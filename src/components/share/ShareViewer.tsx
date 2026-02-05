/**
 * ShareViewer - Read-only project viewer for shared links
 * 
 * Displays the structural model with analysis results.
 * All editing tools are disabled.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useModelStore } from '@/stores/modelStore';
import type { ProjectData } from '@/types/database';
import type { StructuralModel, LoadCase } from '@/types';

// Dynamic import for canvas (no SSR)
const StructuralCanvas = dynamic(
  () => import('@/components/canvas/StructuralCanvas').then((mod) => mod.StructuralCanvas),
  { ssr: false, loading: () => <CanvasPlaceholder /> }
);

function CanvasPlaceholder() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-900 text-gray-500">
      Loading canvas...
    </div>
  );
}

interface SharedProject {
  id: string;
  name: string;
  data: ProjectData;
  updatedAt: string;
}

interface ShareViewerProps {
  project: SharedProject;
}

export function ShareViewer({ project }: ShareViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  
  const { 
    loadModel, 
    setMode, 
    canvasSettings, 
    updateCanvasSettings,
    analysisResult,
    fitToContent,
  } = useModelStore();

  // Load project data on mount
  useEffect(() => {
    if (project.data) {
      const model: StructuralModel = project.data.model as unknown as StructuralModel;
      const loadCases: LoadCase[] = project.data.loadCases as unknown as LoadCase[];
      loadModel(model, loadCases);
      
      // Set to select mode (read-only)
      setMode('select');
      
      // Fit to content after a short delay
      setTimeout(() => fitToContent(), 100);
    }
  }, [project.data, loadModel, setMode, fitToContent]);

  // Handle canvas resize
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCanvasSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <a href="/" className="text-blue-400 hover:text-blue-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </a>
          <div>
            <h1 className="text-lg font-semibold text-white">{project.name}</h1>
            <p className="text-xs text-gray-500">
              Shared project · Read-only view
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Last updated: {new Date(project.updatedAt).toLocaleDateString()}</span>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex items-center gap-4 px-4 py-2 bg-gray-900 border-b border-gray-800">
        {/* View controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => fitToContent()}
            className="px-2 py-1 text-xs text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
            title="Fit to content"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>

        <div className="h-4 w-px bg-gray-700" />

        {/* Display toggles */}
        <div className="flex items-center gap-2">
          <ToggleButton
            active={canvasSettings.showGrid}
            onClick={() => updateCanvasSettings({ showGrid: !canvasSettings.showGrid })}
            label="Grid"
          />
          <ToggleButton
            active={canvasSettings.showNodeLabels}
            onClick={() => updateCanvasSettings({ showNodeLabels: !canvasSettings.showNodeLabels })}
            label="Labels"
          />
          <ToggleButton
            active={canvasSettings.showLoads}
            onClick={() => updateCanvasSettings({ showLoads: !canvasSettings.showLoads })}
            label="Loads"
          />
          <ToggleButton
            active={canvasSettings.showSupports}
            onClick={() => updateCanvasSettings({ showSupports: !canvasSettings.showSupports })}
            label="Supports"
          />
        </div>

        {/* Results toggles (if analysis exists) */}
        {analysisResult && (
          <>
            <div className="h-4 w-px bg-gray-700" />
            <div className="flex items-center gap-2">
              <ToggleButton
                active={canvasSettings.showDeformed}
                onClick={() => updateCanvasSettings({ showDeformed: !canvasSettings.showDeformed })}
                label="Deformed"
              />
              <ToggleButton
                active={canvasSettings.showMomentDiagram}
                onClick={() => updateCanvasSettings({ showMomentDiagram: !canvasSettings.showMomentDiagram })}
                label="M"
              />
              <ToggleButton
                active={canvasSettings.showShearDiagram}
                onClick={() => updateCanvasSettings({ showShearDiagram: !canvasSettings.showShearDiagram })}
                label="V"
              />
              <ToggleButton
                active={canvasSettings.showAxialDiagram}
                onClick={() => updateCanvasSettings({ showAxialDiagram: !canvasSettings.showAxialDiagram })}
                label="N"
              />
            </div>
          </>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Canvas */}
        <div ref={containerRef} className="flex-1 relative">
          <StructuralCanvas
            width={canvasSize.width}
            height={canvasSize.height}
          />
        </div>

        {/* Info panel */}
        <div className="w-64 bg-gray-900 border-l border-gray-800 overflow-y-auto">
          <ProjectInfo />
        </div>
      </div>
    </div>
  );
}

function ToggleButton({ 
  active, 
  onClick, 
  label 
}: { 
  active: boolean; 
  onClick: () => void; 
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 text-xs rounded transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'text-gray-400 hover:text-white hover:bg-gray-800'
      }`}
    >
      {label}
    </button>
  );
}

function ProjectInfo() {
  const { model } = useModelStore();
  
  return (
    <div className="p-4">
      <h2 className="text-sm font-semibold text-white mb-4">Project Info</h2>
      
      <div className="space-y-3 text-xs">
        <div>
          <p className="text-gray-500">Nodes</p>
          <p className="text-white">{model.nodes.length}</p>
        </div>
        <div>
          <p className="text-gray-500">Members</p>
          <p className="text-white">{model.members.length}</p>
        </div>
        <div>
          <p className="text-gray-500">Supports</p>
          <p className="text-white">{model.supports.length}</p>
        </div>
        <div>
          <p className="text-gray-500">Materials</p>
          <p className="text-white">{model.materials.length}</p>
        </div>
        <div>
          <p className="text-gray-500">Sections</p>
          <p className="text-white">{model.sections.length}</p>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-800">
        <p className="text-xs text-gray-500 mb-2">
          This is a shared view. To edit this project, you&apos;ll need access from the owner.
        </p>
        <a
          href="/"
          className="block text-center px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
        >
          Create Your Own Project
        </a>
      </div>
    </div>
  );
}
