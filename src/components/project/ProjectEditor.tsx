/**
 * ProjectEditor Component
 * 
 * Wraps the structural editor with cloud save functionality.
 * Handles auto-save, manual save, and syncing with the database.
 */

'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useModelStore } from '@/stores/modelStore';
import { ShareModal } from '@/components/project/ShareModal';
import type { ProjectData } from '@/types/database';
import type { LoadCase, LoadCaseType, LoadType, LoadTargetType, LoadDirection } from '@/types';

// Dynamic import for the editor (no SSR for Konva)
const EditorContent = dynamic(
  () => import('@/components/project/EditorContent').then((mod) => mod.EditorContent),
  { 
    ssr: false, 
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-gray-900 text-gray-500">
        Loading editor...
      </div>
    ),
  }
);

interface ProjectEditorProps {
  projectId: string;
  initialName: string;
  initialData: ProjectData;
}

export function ProjectEditor({ projectId, initialName, initialData }: ProjectEditorProps) {
  const { loadModel, model, loadCases, isDirty, markClean } = useModelStore();
  
  const [projectName, setProjectName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitializedRef = useRef(false);

  // Initialize model from project data
  useEffect(() => {
    if (!hasInitializedRef.current && initialData) {
      hasInitializedRef.current = true;
      
      // Convert database format to store format
      if (initialData.model && initialData.loadCases) {
        // Map load cases to ensure proper typing
        const typedLoadCases: LoadCase[] = initialData.loadCases.map(lc => ({
          id: lc.id,
          name: lc.name,
          type: lc.type as LoadCaseType,
          loads: lc.loads.map(l => {
            // Build load object conditionally
            const load: {
              id: string;
              type: LoadType;
              target: LoadTargetType;
              targetId: string;
              fx?: number;
              fy?: number;
              mz?: number;
              w?: number;
              direction?: LoadDirection;
            } = {
              id: l.id,
              type: l.type as LoadType,
              target: l.target as LoadTargetType,
              targetId: l.targetId,
            };
            
            if (l.fx !== undefined) load.fx = l.fx;
            if (l.fy !== undefined) load.fy = l.fy;
            if (l.mz !== undefined) load.mz = l.mz;
            if (l.w !== undefined) load.w = l.w;
            if (l.direction !== undefined) load.direction = l.direction as LoadDirection;
            
            return load;
          }),
        }));
        
        loadModel(
          {
            nodes: initialData.model.nodes.map(n => ({ id: n.id, x: n.x, y: n.y })),
            members: initialData.model.members,
            materials: initialData.model.materials,
            sections: initialData.model.sections,
            supports: initialData.model.supports,
          },
          typedLoadCases
        );
        markClean();
      }
    }
  }, [initialData, loadModel, markClean]);

  // Build project data for saving
  const buildProjectData = useCallback((): ProjectData => {
    return {
      model: {
        nodes: model.nodes.map(n => ({ id: n.id, x: n.x, y: n.y })),
        members: model.members.map(m => ({
          id: m.id,
          type: m.type,
          startNodeId: m.startNodeId,
          endNodeId: m.endNodeId,
          materialId: m.materialId,
          sectionId: m.sectionId,
        })),
        materials: model.materials.map(m => ({ id: m.id, name: m.name, E: m.E })),
        sections: model.sections.map(s => ({ id: s.id, name: s.name, A: s.A, I: s.I })),
        supports: model.supports.map(s => ({
          nodeId: s.nodeId,
          dx: s.dx,
          dy: s.dy,
          rz: s.rz,
        })),
      },
      loadCases: loadCases.map(lc => ({
        id: lc.id,
        name: lc.name,
        type: lc.type,
        loads: lc.loads.map(l => {
          // Build load object conditionally to avoid undefined
          const load: {
            id: string;
            type: string;
            target: string;
            targetId: string;
            fx?: number;
            fy?: number;
            mz?: number;
            w?: number;
            direction?: string;
          } = {
            id: l.id,
            type: l.type,
            target: l.target,
            targetId: l.targetId,
          };
          
          if (l.type === 'point') {
            if (l.fx !== undefined) load.fx = l.fx;
            if (l.fy !== undefined) load.fy = l.fy;
            if (l.mz !== undefined) load.mz = l.mz;
          } else if (l.type === 'distributed') {
            if (l.w !== undefined) load.w = l.w;
            if (l.direction !== undefined) load.direction = l.direction;
          }
          
          return load;
        }),
      })),
    };
  }, [model, loadCases]);

  // Save project to database
  const saveProject = useCallback(async (showIndicator = true) => {
    if (showIndicator) setSaving(true);
    setSaveError(null);

    try {
      const data = buildProjectData();
      
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: projectName, data }),
      });

      if (!res.ok) {
        throw new Error('Failed to save');
      }

      markClean();
      setLastSaved(new Date());
    } catch (error) {
      console.error('Save error:', error);
      setSaveError('Failed to save');
    } finally {
      if (showIndicator) setSaving(false);
    }
  }, [projectId, projectName, buildProjectData, markClean]);

  // Auto-save when dirty
  useEffect(() => {
    if (isDirty) {
      // Clear existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      // Set new timer (save after 30 seconds of no changes)
      autoSaveTimerRef.current = setTimeout(() => {
        saveProject(false);
      }, 30000);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [isDirty, saveProject]);

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveProject();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveProject]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleNameSubmit = async () => {
    setIsEditingName(false);
    await saveProject();
  };

  const formatLastSaved = () => {
    if (!lastSaved) return null;
    const now = new Date();
    const diff = now.getTime() - lastSaved.getTime();
    
    if (diff < 60000) return 'Saved just now';
    if (diff < 3600000) return `Saved ${Math.floor(diff / 60000)}m ago`;
    return `Saved at ${lastSaved.toLocaleTimeString()}`;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Back to dashboard"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          
          {isEditingName ? (
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameSubmit();
                if (e.key === 'Escape') setIsEditingName(false);
              }}
              className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="text-lg font-semibold text-white hover:text-blue-400 transition-colors"
            >
              {projectName}
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Save status */}
          <div className="text-sm text-gray-500">
            {saving ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Saving...
              </span>
            ) : saveError ? (
              <span className="text-red-400">{saveError}</span>
            ) : isDirty ? (
              <span className="text-yellow-500">Unsaved changes</span>
            ) : (
              <span>{formatLastSaved()}</span>
            )}
          </div>

          {/* Report button */}
          <Link
            href={`/project/${projectId}/report`}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-sm rounded transition-colors flex items-center gap-2"
            title="Generate report"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Report
          </Link>

          {/* Share button */}
          <button
            onClick={() => setShowShareModal(true)}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-sm rounded transition-colors flex items-center gap-2"
            title="Share project"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>

          {/* Save button */}
          <button
            onClick={() => saveProject()}
            disabled={saving || !isDirty}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm rounded transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </header>

      {/* Editor */}
      <EditorContent />
      
      {/* Share Modal */}
      <ShareModal
        projectId={projectId}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
}
