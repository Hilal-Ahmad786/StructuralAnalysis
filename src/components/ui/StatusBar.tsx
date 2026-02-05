/**
 * Status Bar Component
 *
 * Shows current mode, selection info, model statistics, and keyboard hints.
 */

'use client';

import React from 'react';
import { useModelStore, type EditorMode } from '@/stores/modelStore';

interface ModeInfo {
  label: string;
  hint: string;
  icon: string;
}

const modeInfo: Record<EditorMode, ModeInfo> = {
  select: {
    label: 'Select',
    hint: 'Click to select, Shift+click to multi-select, drag for box selection',
    icon: 'arrow_selector_tool',
  },
  pan: {
    label: 'Pan',
    hint: 'Drag to pan the canvas, scroll to zoom',
    icon: 'pan_tool',
  },
  node: {
    label: 'Add Node',
    hint: 'Click on canvas to place a node',
    icon: 'radio_button_unchecked',
  },
  member: {
    label: 'Add Member',
    hint: 'Click first node, then second node to create a member',
    icon: 'segment',
  },
  support: {
    label: 'Add Support',
    hint: 'Click on a node to add a support',
    icon: 'vertical_align_bottom',
  },
  load: {
    label: 'Add Load',
    hint: 'Click on a node or member to add a load',
    icon: 'arrow_downward',
  },
};

export function StatusBar(): React.JSX.Element {
  const {
    mode,
    selection,
    model,
    analysisResult,
    isAnalyzing,
    loadCases,
  } = useModelStore();

  const currentMode = modeInfo[mode];
  const activeLoadCase = loadCases[0];
  const totalLoads = activeLoadCase?.loads.length ?? 0;

  // Calculate selection summary
  const selectedNodes = selection.filter((s) => s.type === 'node').length;
  const selectedMembers = selection.filter((s) => s.type === 'member').length;

  return (
    <footer className="flex items-center justify-between px-4 h-9 bg-white dark:bg-card-dark border-t border-slate-200 dark:border-slate-800 text-xs">
      {/* Left: Mode and hints */}
      <div className="flex items-center gap-4 min-w-0">
        {/* Current Mode */}
        <div className="flex items-center gap-2 text-structura-primary font-medium">
          <span className="material-symbols-outlined text-[16px]">{currentMode.icon}</span>
          <span>{currentMode.label}</span>
        </div>

        {/* Hint */}
        <span className="text-slate-400 dark:text-slate-500 truncate hidden sm:inline">
          {currentMode.hint}
        </span>
      </div>

      {/* Center: Selection info */}
      {selection.length > 0 && (
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 mx-4">
          <span className="material-symbols-outlined text-[14px]">select_all</span>
          <span>
            {selectedNodes > 0 && `${selectedNodes} node${selectedNodes > 1 ? 's' : ''}`}
            {selectedNodes > 0 && selectedMembers > 0 && ', '}
            {selectedMembers > 0 && `${selectedMembers} member${selectedMembers > 1 ? 's' : ''}`}
          </span>
        </div>
      )}

      {/* Right: Model stats and status */}
      <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
        {/* Analysis status */}
        <span className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              isAnalyzing
                ? 'bg-blue-500 animate-pulse'
                : analysisResult?.success
                  ? 'bg-green-500'
                  : analysisResult
                    ? 'bg-red-500'
                    : 'bg-slate-300 dark:bg-slate-600'
            }`}
          />
          {isAnalyzing
            ? 'Analyzing...'
            : analysisResult?.success
              ? 'Analysis OK'
              : analysisResult
                ? 'Analysis failed'
                : 'Not analyzed'}
        </span>

        <span className="text-slate-300 dark:text-slate-600">|</span>

        {/* Model statistics */}
        <span className="flex items-center gap-1.5" title="Nodes">
          <span className="material-symbols-outlined text-[14px]">radio_button_unchecked</span>
          {model.nodes.length}
        </span>
        <span className="flex items-center gap-1.5" title="Members">
          <span className="material-symbols-outlined text-[14px]">segment</span>
          {model.members.length}
        </span>
        <span className="flex items-center gap-1.5" title="Supports">
          <span className="material-symbols-outlined text-[14px]">vertical_align_bottom</span>
          {model.supports.length}
        </span>
        <span className="flex items-center gap-1.5" title="Loads">
          <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
          {totalLoads}
        </span>

        <span className="text-slate-300 dark:text-slate-600 hidden md:inline">|</span>

        {/* Units */}
        <span className="hidden md:inline">m, kN, kPa</span>

        {/* Keyboard hint */}
        <span className="text-slate-400 hidden lg:flex items-center gap-1">
          Press
          <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px] font-medium">
            ?
          </kbd>
          for shortcuts
        </span>
      </div>
    </footer>
  );
}
