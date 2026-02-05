/**
 * Keyboard Shortcuts Panel
 *
 * Displays all available keyboard shortcuts. Press '?' to toggle.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string[]; description: string }[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'Tools',
    shortcuts: [
      { keys: ['V'], description: 'Select mode' },
      { keys: ['Space'], description: 'Pan mode (hold)' },
      { keys: ['N'], description: 'Add node mode' },
      { keys: ['M'], description: 'Add member mode' },
      { keys: ['S'], description: 'Add support mode' },
      { keys: ['L'], description: 'Add load mode' },
    ],
  },
  {
    title: 'Edit',
    shortcuts: [
      { keys: ['Ctrl', 'Z'], description: 'Undo' },
      { keys: ['Ctrl', 'Y'], description: 'Redo' },
      { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo (alt)' },
      { keys: ['Ctrl', 'C'], description: 'Copy selection' },
      { keys: ['Ctrl', 'V'], description: 'Paste' },
      { keys: ['Ctrl', 'D'], description: 'Duplicate selection' },
      { keys: ['Delete'], description: 'Delete selection' },
      { keys: ['Backspace'], description: 'Delete selection (alt)' },
      { keys: ['Escape'], description: 'Cancel / Deselect' },
    ],
  },
  {
    title: 'Selection',
    shortcuts: [
      { keys: ['Ctrl', 'A'], description: 'Select all' },
      { keys: ['Shift', 'Click'], description: 'Add to selection' },
      { keys: ['Ctrl', 'Click'], description: 'Toggle selection' },
      { keys: ['Drag'], description: 'Box select' },
    ],
  },
  {
    title: 'View',
    shortcuts: [
      { keys: ['F'], description: 'Fit to content' },
      { keys: ['R'], description: 'Reset view' },
      { keys: ['G'], description: 'Toggle grid' },
      { keys: ['Ctrl', '+'], description: 'Zoom in' },
      { keys: ['Ctrl', '-'], description: 'Zoom out' },
      { keys: ['Scroll'], description: 'Zoom at cursor' },
    ],
  },
  {
    title: 'Analysis',
    shortcuts: [
      { keys: ['Ctrl', 'Enter'], description: 'Run analysis' },
      { keys: ['1'], description: 'Toggle deformed shape' },
      { keys: ['2'], description: 'Toggle axial diagram' },
      { keys: ['3'], description: 'Toggle shear diagram' },
      { keys: ['4'], description: 'Toggle moment diagram' },
    ],
  },
  {
    title: 'General',
    shortcuts: [
      { keys: ['Ctrl', 'S'], description: 'Save project' },
      { keys: ['Ctrl', 'K'], description: 'Command palette' },
      { keys: ['?'], description: 'Toggle shortcuts panel' },
    ],
  },
];

export function KeyboardShortcutsPanel() {
  const [isOpen, setIsOpen] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Toggle with '?' key (Shift + /)
    if (e.key === '?' || (e.shiftKey && e.key === '/')) {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    }
    // Close with Escape
    if (e.key === 'Escape' && isOpen) {
      setIsOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Panel */}
      <div className="relative bg-white dark:bg-card-dark rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-4xl w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-structura-primary/10 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px] text-structura-primary">
                keyboard
              </span>
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">Keyboard Shortcuts</h2>
              <p className="text-xs text-slate-500">Press ? to toggle this panel</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shortcutGroups.map((group) => (
              <div key={group.title} className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-structura-primary" />
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-4 text-sm"
                    >
                      <span className="text-slate-600 dark:text-slate-400">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {shortcut.keys.map((key, keyIdx) => (
                          <React.Fragment key={keyIdx}>
                            {keyIdx > 0 && (
                              <span className="text-slate-400 text-xs">+</span>
                            )}
                            <kbd className="px-2 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 min-w-[24px] text-center">
                              {key}
                            </kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <p className="text-xs text-slate-500 text-center">
            Press <kbd className="px-1.5 py-0.5 text-xs bg-slate-200 dark:bg-slate-700 rounded">Esc</kbd> or click outside to close
          </p>
        </div>
      </div>
    </div>
  );
}

// Hook for using keyboard shortcuts in other components
export function useKeyboardShortcuts() {
  const [shortcuts, setShortcuts] = useState<Map<string, () => void>>(new Map());

  const registerShortcut = useCallback((key: string, handler: () => void) => {
    setShortcuts((prev) => new Map(prev).set(key, handler));
    return () => {
      setShortcuts((prev) => {
        const next = new Map(prev);
        next.delete(key);
        return next;
      });
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Build key string
      const parts: string[] = [];
      if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
      if (e.shiftKey) parts.push('Shift');
      if (e.altKey) parts.push('Alt');
      parts.push(e.key.toUpperCase());
      const keyString = parts.join('+');

      const handler = shortcuts.get(keyString);
      if (handler) {
        e.preventDefault();
        handler();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);

  return { registerShortcut };
}
