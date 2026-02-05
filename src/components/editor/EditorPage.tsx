/**
 * EditorPage - Main structural analysis editor
 *
 * Combines canvas, toolbar, and panels into a complete editing experience.
 * Updated with Structura Design System.
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useModelStore } from '@/stores/modelStore';
import { Toolbar } from '@/components/ui/Toolbar';
import { PropertyPanel } from '@/components/ui/PropertyPanel';
import { AnalysisPanel } from '@/components/ui/AnalysisPanel';
import { DemoSelector } from '@/components/ui/DemoSelector';
import { LoadDialog } from '@/components/ui/LoadDialog';
import { ToastProvider } from '@/components/ui/Toast';
import { KeyboardShortcutsPanel } from '@/components/ui/KeyboardShortcuts';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { ContextMenu, useContextMenu } from '@/components/ui/ContextMenu';
import { UnsavedChangesWarning } from '@/components/ui/UnsavedChangesWarning';
import { ZoomControls, MiniMap } from '@/components/ui/ZoomControls';
import { StatusBar } from '@/components/ui/StatusBar';
import { MaterialLibrary } from '@/components/ui/MaterialLibrary';
import { SectionLibrary } from '@/components/ui/SectionLibrary';
import { SelfWeightDialog } from '@/components/ui/SelfWeightDialog';
import { ExportDialog } from '@/components/ui/ExportDialog';
import { GridGenerator } from '@/components/ui/GridGenerator';
import { ReactionsPanel } from '@/components/ui/ReactionsPanel';
import { DiagramControls } from '@/components/ui/DiagramControls';
import { DiagramLegend } from '@/components/ui/DiagramLegend';
import { ResultInterpolator } from '@/components/ui/ResultInterpolator';
import { ShareDialog } from '@/components/ui/ShareDialog';
import { MemberReleasesPanel } from '@/components/ui/MemberReleases';
import { SpringSupportsPanel } from '@/components/ui/SpringSupports';
import { InfluenceLinesPanel } from '@/components/ui/InfluenceLines';
import { NodeTableEditor } from '@/components/ui/NodeTableEditor';
import { MemberTableEditor } from '@/components/ui/MemberTableEditor';
import { CoordinateInputDialog } from '@/components/ui/CoordinateInputDialog';
import { LoadCombinationsPanel } from '@/components/ui/LoadCombinationsPanel';
import { MemberSubdivisionDialog } from '@/components/ui/MemberSubdivisionDialog';
import { useEditorShortcuts } from './useEditorShortcuts';
import type { Load } from '@/types';

// Dynamic import for react-konva (no SSR)
const StructuralCanvas = dynamic(
  () => import('@/components/canvas/StructuralCanvas').then((mod) => mod.StructuralCanvas),
  { ssr: false, loading: () => <CanvasPlaceholder /> }
);

function CanvasPlaceholder() {
  return (
    <div className="flex-1 flex items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-400">
      <div className="flex flex-col items-center gap-3">
        <span className="material-symbols-outlined text-[32px] animate-pulse">grid_4x4</span>
        <span className="text-sm">Loading canvas...</span>
      </div>
    </div>
  );
}

export function EditorPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [rightPanelTab, setRightPanelTab] = useState<'properties' | 'analysis' | 'reactions' | 'results' | 'loads' | 'advanced'>('properties');

  // Load dialog state
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [loadDialogTarget, setLoadDialogTarget] = useState<{ type: 'node' | 'member'; id: string } | null>(null);
  const [editingLoad, setEditingLoad] = useState<Load | null>(null);

  // Phase 2 dialog states
  const [materialLibraryOpen, setMaterialLibraryOpen] = useState(false);
  const [sectionLibraryOpen, setSectionLibraryOpen] = useState(false);
  const [selfWeightDialogOpen, setSelfWeightDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [gridGeneratorOpen, setGridGeneratorOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // Quick Wins dialog states
  const [nodeTableOpen, setNodeTableOpen] = useState(false);
  const [memberTableOpen, setMemberTableOpen] = useState(false);
  const [coordinateInputOpen, setCoordinateInputOpen] = useState(false);
  const [subdivisionDialogOpen, setSubdivisionDialogOpen] = useState(false);
  const [subdivisionMemberId, setSubdivisionMemberId] = useState<string | null>(null);

  // Context menu state
  const { contextMenu, openContextMenu, closeContextMenu } = useContextMenu();

  // Enable keyboard shortcuts
  useEditorShortcuts();

  const {
    projectName,
    isDirty,
    selection,
    mode,
    loadCases,
    activeLoadCaseId,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useModelStore();
  
  // Get active load case for finding existing loads
  const activeLoadCase = loadCases.find(lc => lc.id === activeLoadCaseId) ?? loadCases[0];
  
  // Open load dialog when in load mode and a node/member is selected
  const handleLoadToolClick = useCallback((targetType: 'node' | 'member', targetId: string) => {
    // Check if there's an existing load on this target
    const existingLoad = activeLoadCase?.loads.find(
      l => l.target === targetType && l.targetId === targetId
    );
    
    setLoadDialogTarget({ type: targetType, id: targetId });
    setEditingLoad(existingLoad ?? null);
    setLoadDialogOpen(true);
  }, [activeLoadCase]);
  
  // Subscribe to load tool events from canvas
  useEffect(() => {
    const handleLoadEvent = (e: CustomEvent<{ type: 'node' | 'member'; id: string }>) => {
      if (mode === 'load') {
        handleLoadToolClick(e.detail.type, e.detail.id);
      }
    };
    
    window.addEventListener('structural:load-click' as keyof WindowEventMap, handleLoadEvent as EventListener);
    return () => {
      window.removeEventListener('structural:load-click' as keyof WindowEventMap, handleLoadEvent as EventListener);
    };
  }, [mode, handleLoadToolClick]);
  
  // Resize observer for canvas
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setCanvasSize({
        width: rect.width,
        height: rect.height,
      });
    };
    
    updateSize();
    
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    
    return () => observer.disconnect();
  }, []);
  
  // Auto-switch to properties panel when selection changes
  useEffect(() => {
    if (selection.length > 0) {
      setRightPanelTab('properties');
    }
  }, [selection]);

  // Handle right-click context menu on canvas
  const handleCanvasContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    openContextMenu(e.clientX, e.clientY, { type: 'canvas' });
  }, [openContextMenu]);

  // Subscribe to context menu events from canvas elements
  useEffect(() => {
    const handleContextMenuEvent = (e: CustomEvent<{ x: number; y: number; target: { type: 'node' | 'member' | 'support' | 'canvas'; id?: string } }>) => {
      openContextMenu(e.detail.x, e.detail.y, e.detail.target);
    };

    window.addEventListener('structural:context-menu' as keyof WindowEventMap, handleContextMenuEvent as EventListener);
    return () => {
      window.removeEventListener('structural:context-menu' as keyof WindowEventMap, handleContextMenuEvent as EventListener);
    };
  }, [openContextMenu]);

  // Subscribe to subdivide member events from context menu
  useEffect(() => {
    const handleSubdivideEvent = (e: CustomEvent<{ memberId: string }>) => {
      setSubdivisionMemberId(e.detail.memberId);
      setSubdivisionDialogOpen(true);
    };

    window.addEventListener('structural:subdivide-member' as keyof WindowEventMap, handleSubdivideEvent as EventListener);
    return () => {
      window.removeEventListener('structural:subdivide-member' as keyof WindowEventMap, handleSubdivideEvent as EventListener);
    };
  }, []);

  return (
    <ToastProvider>
    <div className="flex flex-col h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 h-14 bg-white dark:bg-card-dark border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 text-structura-primary">
            <div className="w-9 h-9 bg-structura-primary/10 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">architecture</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-white tracking-tight hidden sm:block">
              Structura
            </span>
          </Link>

          <span className="text-slate-300 dark:text-slate-600">|</span>

          {/* Project Name */}
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-slate-400">folder</span>
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {projectName}
            </span>
            {isDirty && (
              <span className="w-2 h-2 rounded-full bg-amber-500" title="Unsaved changes" />
            )}
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            disabled={!canUndo()}
            className={`p-2 rounded-lg transition-colors ${
              canUndo()
                ? 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <span className="material-symbols-outlined text-[20px]">undo</span>
          </button>
          <button
            onClick={redo}
            disabled={!canRedo()}
            className={`p-2 rounded-lg transition-colors ${
              canRedo()
                ? 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <span className="material-symbols-outlined text-[20px]">redo</span>
          </button>

          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-[18px]">save</span>
            <span className="hidden sm:inline">Save</span>
          </button>
          <button
            onClick={() => setExportDialogOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => setShareDialogOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">share</span>
            <span className="hidden sm:inline">Share</span>
          </button>

          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-structura-primary hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">play_arrow</span>
            <span className="hidden sm:inline">Analyze</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Tools */}
        <div className="w-16 bg-white dark:bg-card-dark border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-3 gap-1">
          <Toolbar />
        </div>

        {/* Left Panel - Model Tree and Demos */}
        <div className="w-56 bg-white dark:bg-card-dark border-r border-slate-200 dark:border-slate-800 overflow-y-auto hidden lg:flex lg:flex-col">
          <DemoSelector />

          {/* Quick Tools */}
          <div className="border-t border-slate-200 dark:border-slate-700 p-3">
            <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 px-1">Quick Tools</h4>
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => setGridGeneratorOpen(true)}
                className="flex flex-col items-center gap-1 p-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Grid Generator"
              >
                <span className="material-symbols-outlined text-[18px]">grid_on</span>
                <span>Grid</span>
              </button>
              <button
                onClick={() => setCoordinateInputOpen(true)}
                className="flex flex-col items-center gap-1 p-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Coordinate Input"
              >
                <span className="material-symbols-outlined text-[18px]">pin_drop</span>
                <span>Coords</span>
              </button>
              <button
                onClick={() => setMaterialLibraryOpen(true)}
                className="flex flex-col items-center gap-1 p-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Material Library"
              >
                <span className="material-symbols-outlined text-[18px]">layers</span>
                <span>Materials</span>
              </button>
              <button
                onClick={() => setSectionLibraryOpen(true)}
                className="flex flex-col items-center gap-1 p-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Section Library"
              >
                <span className="material-symbols-outlined text-[18px]">crop_square</span>
                <span>Sections</span>
              </button>
              <button
                onClick={() => setSelfWeightDialogOpen(true)}
                className="flex flex-col items-center gap-1 p-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Self-Weight Calculator"
              >
                <span className="material-symbols-outlined text-[18px]">weight</span>
                <span>Self-Wt</span>
              </button>
              <button
                onClick={() => setNodeTableOpen(true)}
                className="flex flex-col items-center gap-1 p-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Node Table Editor"
              >
                <span className="material-symbols-outlined text-[18px]">table_chart</span>
                <span>Nodes</span>
              </button>
              <button
                onClick={() => setMemberTableOpen(true)}
                className="flex flex-col items-center gap-1 p-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Member Table Editor"
              >
                <span className="material-symbols-outlined text-[18px]">view_list</span>
                <span>Members</span>
              </button>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700">
            <ModelTree />
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={containerRef}
          className="flex-1 relative bg-slate-50 dark:bg-slate-900"
          onContextMenu={handleCanvasContextMenu}
        >
          <StructuralCanvas width={canvasSize.width} height={canvasSize.height} />

          {/* Canvas overlays */}
          <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">zoom_in</span>
                Scroll to zoom
              </span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">ads_click</span>
                Click to add
              </span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">select_all</span>
                Shift+click multi-select
              </span>
            </span>
          </div>

          {/* Zoom Controls */}
          <ZoomControls className="absolute bottom-4 right-4" />

          {/* Mini Map */}
          <MiniMap className="absolute top-4 right-4" />

          {/* Diagram Legend */}
          <DiagramLegend className="absolute top-4 left-4" />
        </div>

        {/* Right Panel */}
        <div className="w-80 bg-white dark:bg-card-dark border-l border-slate-200 dark:border-slate-800 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setRightPanelTab('properties')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors ${
                rightPanelTab === 'properties'
                  ? 'text-structura-primary border-b-2 border-structura-primary bg-structura-primary/5'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
              <span className="hidden xl:inline">Properties</span>
            </button>
            <button
              onClick={() => setRightPanelTab('analysis')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors ${
                rightPanelTab === 'analysis'
                  ? 'text-structura-primary border-b-2 border-structura-primary bg-structura-primary/5'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">analytics</span>
              <span className="hidden xl:inline">Analysis</span>
            </button>
            <button
              onClick={() => setRightPanelTab('reactions')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors ${
                rightPanelTab === 'reactions'
                  ? 'text-structura-primary border-b-2 border-structura-primary bg-structura-primary/5'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">vertical_align_bottom</span>
              <span className="hidden xl:inline">Reactions</span>
            </button>
            <button
              onClick={() => setRightPanelTab('results')}
              className={`flex-1 flex items-center justify-center gap-2 px-2 py-3 text-sm font-medium transition-colors ${
                rightPanelTab === 'results'
                  ? 'text-structura-primary border-b-2 border-structura-primary bg-structura-primary/5'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              title="Results & Diagrams"
            >
              <span className="material-symbols-outlined text-[18px]">stacked_line_chart</span>
            </button>
            <button
              onClick={() => setRightPanelTab('loads')}
              className={`flex-1 flex items-center justify-center gap-2 px-2 py-3 text-sm font-medium transition-colors ${
                rightPanelTab === 'loads'
                  ? 'text-structura-primary border-b-2 border-structura-primary bg-structura-primary/5'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              title="Load Combinations"
            >
              <span className="material-symbols-outlined text-[18px]">functions</span>
            </button>
            <button
              onClick={() => setRightPanelTab('advanced')}
              className={`flex-1 flex items-center justify-center gap-2 px-2 py-3 text-sm font-medium transition-colors ${
                rightPanelTab === 'advanced'
                  ? 'text-structura-primary border-b-2 border-structura-primary bg-structura-primary/5'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              title="Advanced Features"
            >
              <span className="material-symbols-outlined text-[18px]">science</span>
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto">
            {rightPanelTab === 'properties' && <PropertyPanel />}
            {rightPanelTab === 'analysis' && <AnalysisPanel />}
            {rightPanelTab === 'reactions' && <ReactionsPanel />}
            {rightPanelTab === 'results' && (
              <div className="space-y-4">
                <DiagramControls />
                <div className="border-t border-slate-200 dark:border-slate-700" />
                <ResultInterpolator />
              </div>
            )}
            {rightPanelTab === 'loads' && (
              <LoadCombinationsPanel />
            )}
            {rightPanelTab === 'advanced' && (
              <AdvancedPanel />
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      {/* Status Bar */}
      <StatusBar />

      {/* Load Dialog */}
      <LoadDialog
        isOpen={loadDialogOpen}
        onClose={() => {
          setLoadDialogOpen(false);
          setLoadDialogTarget(null);
          setEditingLoad(null);
        }}
        target={loadDialogTarget}
        existingLoad={editingLoad}
      />

      {/* Overlay Components */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={closeContextMenu}
        target={contextMenu.target}
      />
      <CommandPalette />
      <KeyboardShortcutsPanel />
      <UnsavedChangesWarning />

      {/* Phase 2 Dialogs */}
      <MaterialLibrary
        isOpen={materialLibraryOpen}
        onClose={() => setMaterialLibraryOpen(false)}
      />
      <SectionLibrary
        isOpen={sectionLibraryOpen}
        onClose={() => setSectionLibraryOpen(false)}
      />
      <SelfWeightDialog
        isOpen={selfWeightDialogOpen}
        onClose={() => setSelfWeightDialogOpen(false)}
      />
      <ExportDialog
        isOpen={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
      />
      <GridGenerator
        isOpen={gridGeneratorOpen}
        onClose={() => setGridGeneratorOpen(false)}
      />
      <ShareDialog
        isOpen={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
      />

      {/* Quick Wins Dialogs */}
      <CoordinateInputDialog
        isOpen={coordinateInputOpen}
        onClose={() => setCoordinateInputOpen(false)}
      />
      <MemberSubdivisionDialog
        isOpen={subdivisionDialogOpen}
        onClose={() => {
          setSubdivisionDialogOpen(false);
          setSubdivisionMemberId(null);
        }}
        memberId={subdivisionMemberId}
      />

      {/* Table Editor Slideovers */}
      {nodeTableOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setNodeTableOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[500px] bg-white dark:bg-slate-900 shadow-2xl">
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => setNodeTableOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <NodeTableEditor />
          </div>
        </div>
      )}
      {memberTableOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMemberTableOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[600px] bg-white dark:bg-slate-900 shadow-2xl">
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => setMemberTableOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <MemberTableEditor />
          </div>
        </div>
      )}
    </div>
    </ToastProvider>
  );
}

// Simple model tree component
function ModelTree() {
  const { model, loadCases, selection, select } = useModelStore();

  return (
    <div className="p-3 text-xs space-y-4">
      {/* Nodes */}
      <div>
        <h4 className="flex items-center gap-2 font-medium text-slate-500 dark:text-slate-400 mb-2 px-1">
          <span className="material-symbols-outlined text-[16px]">radio_button_unchecked</span>
          Nodes ({model.nodes.length})
        </h4>
        <ul className="space-y-0.5">
          {model.nodes.map((node) => {
            const isSelected = selection.some((s) => s.type === 'node' && s.id === node.id);
            return (
              <li
                key={node.id}
                onClick={() => select({ type: 'node', id: node.id })}
                className={`px-2 py-1 cursor-pointer rounded-lg flex items-center gap-2 transition-colors ${
                  isSelected
                    ? 'bg-structura-primary text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-structura-primary'}`}
                />
                {node.id}
                <span className={`ml-auto text-[10px] ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                  ({node.x.toFixed(1)}, {node.y.toFixed(1)})
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Members */}
      <div>
        <h4 className="flex items-center gap-2 font-medium text-slate-500 dark:text-slate-400 mb-2 px-1">
          <span className="material-symbols-outlined text-[16px]">segment</span>
          Members ({model.members.length})
        </h4>
        <ul className="space-y-0.5">
          {model.members.map((member) => {
            const isSelected = selection.some((s) => s.type === 'member' && s.id === member.id);
            return (
              <li
                key={member.id}
                onClick={() => select({ type: 'member', id: member.id })}
                className={`px-2 py-1 cursor-pointer rounded-lg flex items-center gap-2 transition-colors ${
                  isSelected
                    ? 'bg-structura-primary text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span
                  className={`w-3 h-0.5 ${isSelected ? 'bg-white' : 'bg-structura-primary'}`}
                />
                {member.id}
                <span
                  className={`ml-auto px-1.5 py-0.5 text-[10px] rounded ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {member.type}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Supports */}
      <div>
        <h4 className="flex items-center gap-2 font-medium text-slate-500 dark:text-slate-400 mb-2 px-1">
          <span className="material-symbols-outlined text-[16px]">vertical_align_bottom</span>
          Supports ({model.supports.length})
        </h4>
        <ul className="space-y-0.5">
          {model.supports.map((support) => (
            <li
              key={support.nodeId}
              className="px-2 py-1 text-slate-600 dark:text-slate-300 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[14px] text-slate-400">push_pin</span>
              {support.nodeId}
              <span className="ml-auto text-[10px] text-slate-400">
                {support.dx && 'X'}
                {support.dy && 'Y'}
                {support.rz && 'R'}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Load Cases */}
      <div>
        <h4 className="flex items-center gap-2 font-medium text-slate-500 dark:text-slate-400 mb-2 px-1">
          <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
          Load Cases ({loadCases.length})
        </h4>
        <ul className="space-y-0.5">
          {loadCases.map((lc) => (
            <li
              key={lc.id}
              className="px-2 py-1 text-slate-600 dark:text-slate-300 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[14px] text-amber-500">folder</span>
              {lc.name}
              <span className="ml-auto text-[10px] text-slate-400">{lc.loads.length} loads</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Advanced features panel with collapsible sections
function AdvancedPanel() {
  const [expandedSection, setExpandedSection] = useState<string | null>('releases');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="p-4 space-y-2">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-[20px] text-purple-500">
            science
          </span>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Advanced Features</h3>
          <p className="text-xs text-slate-500">Special analysis tools</p>
        </div>
      </div>

      {/* Member Releases Section */}
      <CollapsibleSection
        title="Member Releases"
        icon="link_off"
        description="Define hinges at member ends"
        expanded={expandedSection === 'releases'}
        onToggle={() => toggleSection('releases')}
      >
        <MemberReleasesPanel />
      </CollapsibleSection>

      {/* Spring Supports Section */}
      <CollapsibleSection
        title="Spring Supports"
        icon="compress"
        description="Elastic support stiffness"
        expanded={expandedSection === 'springs'}
        onToggle={() => toggleSection('springs')}
      >
        <SpringSupportsPanel />
      </CollapsibleSection>

      {/* Influence Lines Section */}
      <CollapsibleSection
        title="Influence Lines"
        icon="show_chart"
        description="Moving load analysis"
        expanded={expandedSection === 'influence'}
        onToggle={() => toggleSection('influence')}
      >
        <InfluenceLinesPanel />
      </CollapsibleSection>
    </div>
  );
}

interface CollapsibleSectionProps {
  title: string;
  icon: string;
  description: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  icon,
  description,
  expanded,
  onToggle,
  children,
}: CollapsibleSectionProps): React.JSX.Element {
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          expanded ? 'bg-structura-primary/10' : 'bg-slate-100 dark:bg-slate-800'
        }`}>
          <span className={`material-symbols-outlined text-[16px] ${
            expanded ? 'text-structura-primary' : 'text-slate-500'
          }`}>{icon}</span>
        </div>
        <div className="flex-1 text-left">
          <h4 className="text-sm font-medium text-slate-900 dark:text-white">{title}</h4>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
        <span className={`material-symbols-outlined text-[18px] text-slate-400 transition-transform ${
          expanded ? 'rotate-180' : ''
        }`}>
          expand_more
        </span>
      </button>
      {expanded && (
        <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          {children}
        </div>
      )}
    </div>
  );
}
