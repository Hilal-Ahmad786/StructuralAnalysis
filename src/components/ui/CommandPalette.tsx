/**
 * Command Palette Component
 *
 * Quick command search and execution with Ctrl+K.
 */

'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useModelStore } from '@/stores/modelStore';
import { useAnalysis } from '@/features/analysis/hooks/useAnalysis';

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: string;
  category: string;
  shortcut?: string;
  action: () => void;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const {
    setMode,
    undo,
    redo,
    fitToContent,
    resetView,
    clearSelection,
    model,
    select,
    canvasSettings,
    updateCanvasSettings,
  } = useModelStore();

  const { runAnalysis } = useAnalysis();

  // Define all available commands
  const commands: Command[] = useMemo(() => [
    // Tools
    { id: 'tool-select', label: 'Select Mode', icon: 'arrow_selector_tool', category: 'Tools', shortcut: 'V', action: () => setMode('select') },
    { id: 'tool-pan', label: 'Pan Mode', icon: 'pan_tool', category: 'Tools', shortcut: 'Space', action: () => setMode('pan') },
    { id: 'tool-node', label: 'Add Node', icon: 'radio_button_unchecked', category: 'Tools', shortcut: 'N', action: () => setMode('node') },
    { id: 'tool-member', label: 'Add Member', icon: 'segment', category: 'Tools', shortcut: 'M', action: () => setMode('member') },
    { id: 'tool-support', label: 'Add Support', icon: 'vertical_align_bottom', category: 'Tools', shortcut: 'S', action: () => setMode('support') },
    { id: 'tool-load', label: 'Add Load', icon: 'arrow_downward', category: 'Tools', shortcut: 'L', action: () => setMode('load') },

    // Edit
    { id: 'edit-undo', label: 'Undo', icon: 'undo', category: 'Edit', shortcut: 'Ctrl+Z', action: () => undo() },
    { id: 'edit-redo', label: 'Redo', icon: 'redo', category: 'Edit', shortcut: 'Ctrl+Y', action: () => redo() },
    { id: 'edit-select-all', label: 'Select All', icon: 'select_all', category: 'Edit', shortcut: 'Ctrl+A', action: () => {
      const allSelections = [
        ...model.nodes.map((node) => ({ type: 'node' as const, id: node.id })),
        ...model.members.map((member) => ({ type: 'member' as const, id: member.id })),
      ];
      select(allSelections);
    }},
    { id: 'edit-deselect', label: 'Clear Selection', icon: 'deselect', category: 'Edit', shortcut: 'Esc', action: () => clearSelection() },

    // View
    { id: 'view-fit', label: 'Fit to Content', icon: 'fit_screen', category: 'View', shortcut: 'F', action: () => fitToContent() },
    { id: 'view-reset', label: 'Reset View', icon: 'refresh', category: 'View', shortcut: 'R', action: () => resetView() },
    { id: 'view-grid', label: 'Toggle Grid', icon: 'grid_4x4', category: 'View', shortcut: 'G', action: () => updateCanvasSettings({ showGrid: !canvasSettings.showGrid }) },
    { id: 'view-snap', label: 'Toggle Snap to Grid', icon: 'grid_goldenratio', category: 'View', action: () => updateCanvasSettings({ snapToGrid: !canvasSettings.snapToGrid }) },
    { id: 'view-labels', label: 'Toggle Node Labels', icon: 'label', category: 'View', action: () => updateCanvasSettings({ showNodeLabels: !canvasSettings.showNodeLabels }) },

    // Analysis
    { id: 'analysis-run', label: 'Run Analysis', icon: 'play_arrow', category: 'Analysis', shortcut: 'Ctrl+Enter', action: () => runAnalysis?.() },
    { id: 'analysis-deformed', label: 'Toggle Deformed Shape', icon: 'ssid_chart', category: 'Analysis', shortcut: '1', action: () => updateCanvasSettings({ showDeformed: !canvasSettings.showDeformed }) },
    { id: 'analysis-axial', label: 'Toggle Axial Diagram', icon: 'show_chart', category: 'Analysis', shortcut: '2', action: () => updateCanvasSettings({ showAxialDiagram: !canvasSettings.showAxialDiagram }) },
    { id: 'analysis-shear', label: 'Toggle Shear Diagram', icon: 'show_chart', category: 'Analysis', shortcut: '3', action: () => updateCanvasSettings({ showShearDiagram: !canvasSettings.showShearDiagram }) },
    { id: 'analysis-moment', label: 'Toggle Moment Diagram', icon: 'show_chart', category: 'Analysis', shortcut: '4', action: () => updateCanvasSettings({ showMomentDiagram: !canvasSettings.showMomentDiagram }) },

    // Navigation
    { id: 'nav-dashboard', label: 'Go to Dashboard', icon: 'dashboard', category: 'Navigation', action: () => router.push('/dashboard') },
    { id: 'nav-settings', label: 'Go to Settings', icon: 'settings', category: 'Navigation', action: () => router.push('/settings') },
    { id: 'nav-help', label: 'Keyboard Shortcuts', icon: 'keyboard', category: 'Help', shortcut: '?', action: () => {
      // Trigger keyboard shortcuts panel
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '?', shiftKey: true }));
    }},
  ], [setMode, undo, redo, model, select, clearSelection, fitToContent, resetView, canvasSettings, updateCanvasSettings, runAnalysis, router]);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const lowerQuery = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(lowerQuery) ||
        cmd.category.toLowerCase().includes(lowerQuery) ||
        (cmd.description && cmd.description.toLowerCase().includes(lowerQuery))
    );
  }, [commands, query]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category]!.push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Handle keyboard
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Open with Ctrl+K
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setIsOpen(true);
      setQuery('');
      setSelectedIndex(0);
    }

    if (!isOpen) return;

    // Close with Escape
    if (e.key === 'Escape') {
      setIsOpen(false);
    }

    // Navigate with arrow keys
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    }

    // Execute with Enter
    if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
      e.preventDefault();
      filteredCommands[selectedIndex].action();
      setIsOpen(false);
    }
  }, [isOpen, filteredCommands, selectedIndex]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Palette */}
      <div className="relative bg-white dark:bg-card-dark rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <span className="material-symbols-outlined text-[20px] text-slate-400">search</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none text-sm"
          />
          <kbd className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 rounded">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto py-2">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-500">
              <span className="material-symbols-outlined text-[32px] mb-2 block">search_off</span>
              No commands found
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category}>
                <div className="px-4 py-1.5 text-xs font-medium text-slate-400 uppercase tracking-wide">
                  {category}
                </div>
                {cmds.map((cmd) => {
                  const globalIndex = filteredCommands.indexOf(cmd);
                  const isSelected = globalIndex === selectedIndex;
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => {
                        cmd.action();
                        setIsOpen(false);
                      }}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                        ${isSelected
                          ? 'bg-structura-primary/10 text-structura-primary'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }
                      `}
                    >
                      <span className={`material-symbols-outlined text-[18px] ${isSelected ? 'text-structura-primary' : 'text-slate-400'}`}>
                        {cmd.icon}
                      </span>
                      <span className="flex-1 text-sm">{cmd.label}</span>
                      {cmd.shortcut && (
                        <span className="text-xs text-slate-400">
                          {cmd.shortcut}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">↑↓</kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">↵</kbd>
            Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">Esc</kbd>
            Close
          </span>
        </div>
      </div>
    </div>
  );
}
