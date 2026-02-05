/**
 * Editor Keyboard Shortcuts Hook
 *
 * Handles keyboard shortcuts for the structural editor.
 */

'use client';

import { useEffect, useCallback } from 'react';
import { useModelStore } from '@/stores/modelStore';
import { useClipboardStore } from '@/stores/clipboardStore';
import { useAnalysis } from '@/features/analysis/hooks/useAnalysis';

export function useEditorShortcuts(): void {
  const {
    mode,
    setMode,
    undo,
    redo,
    canUndo,
    canRedo,
    fitToContent,
    resetView,
    clearSelection,
    selection,
    deleteNode,
    deleteMember,
    deleteSupport,
    model,
    select,
    canvasSettings,
    updateCanvasSettings,
  } = useModelStore();

  const { runAnalysis } = useAnalysis();
  const { copy } = useClipboardStore();

  // Copy selected items to clipboard
  const copySelection = useCallback(() => {
    if (selection.length === 0) return;

    // Get selected nodes
    const selectedNodeIds = new Set(
      selection.filter((s) => s.type === 'node').map((s) => s.id)
    );
    const selectedNodes = model.nodes.filter((n) => selectedNodeIds.has(n.id));

    // Get selected members (only if both endpoints are selected)
    const selectedMemberIds = new Set(
      selection.filter((s) => s.type === 'member').map((s) => s.id)
    );
    const selectedMembers = model.members.filter(
      (m) =>
        selectedMemberIds.has(m.id) ||
        (selectedNodeIds.has(m.startNodeId) && selectedNodeIds.has(m.endNodeId))
    );

    // Get supports for selected nodes
    const selectedSupports = model.supports.filter((s) =>
      selectedNodeIds.has(s.nodeId)
    );

    // For now, don't copy loads (they'd need load case context)
    copy(selectedNodes, selectedMembers, selectedSupports, []);
  }, [selection, model, copy]);

  // Delete selected items
  const deleteSelection = useCallback(() => {
    if (selection.length === 0) return;

    selection.forEach((sel) => {
      if (sel.type === 'node') {
        deleteNode(sel.id);
      } else if (sel.type === 'member') {
        deleteMember(sel.id);
      } else if (sel.type === 'support') {
        deleteSupport(sel.id);
      }
    });
  }, [selection, deleteNode, deleteMember, deleteSupport]);

  // Select all elements
  const selectAll = useCallback(() => {
    const allSelections = [
      ...model.nodes.map((node) => ({ type: 'node' as const, id: node.id })),
      ...model.members.map((member) => ({ type: 'member' as const, id: member.id })),
    ];
    select(allSelections);
  }, [model, select]);

  // Main keyboard handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if typing in an input field
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const isMod = e.ctrlKey || e.metaKey;

      // Tool shortcuts (single keys)
      if (!isMod && !e.shiftKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'v':
            e.preventDefault();
            setMode('select');
            break;
          case 'n':
            e.preventDefault();
            setMode('node');
            break;
          case 'm':
            e.preventDefault();
            setMode('member');
            break;
          case 's':
            e.preventDefault();
            setMode('support');
            break;
          case 'l':
            e.preventDefault();
            setMode('load');
            break;
          case 'f':
            e.preventDefault();
            fitToContent();
            break;
          case 'r':
            e.preventDefault();
            resetView();
            break;
          case 'g':
            e.preventDefault();
            updateCanvasSettings({ showGrid: !canvasSettings.showGrid });
            break;
          case 'escape':
            e.preventDefault();
            clearSelection();
            if (mode !== 'select') {
              setMode('select');
            }
            break;
          case 'delete':
          case 'backspace':
            e.preventDefault();
            deleteSelection();
            break;
          // Analysis diagram toggles
          case '1':
            e.preventDefault();
            updateCanvasSettings({ showDeformed: !canvasSettings.showDeformed });
            break;
          case '2':
            e.preventDefault();
            updateCanvasSettings({ showAxialDiagram: !canvasSettings.showAxialDiagram });
            break;
          case '3':
            e.preventDefault();
            updateCanvasSettings({ showShearDiagram: !canvasSettings.showShearDiagram });
            break;
          case '4':
            e.preventDefault();
            updateCanvasSettings({ showMomentDiagram: !canvasSettings.showMomentDiagram });
            break;
        }
      }

      // Space for pan (hold)
      if (e.key === ' ' && !isMod && !e.shiftKey) {
        e.preventDefault();
        if (!e.repeat) {
          setMode('pan');
        }
      }

      // Modifier shortcuts
      if (isMod) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              if (canRedo()) redo();
            } else {
              if (canUndo()) undo();
            }
            break;
          case 'y':
            e.preventDefault();
            if (canRedo()) redo();
            break;
          case 'a':
            e.preventDefault();
            selectAll();
            break;
          case 's':
            e.preventDefault();
            // Dispatch custom event for save
            window.dispatchEvent(new CustomEvent('structural:save'));
            break;
          case 'c':
            e.preventDefault();
            copySelection();
            break;
          case 'x':
            e.preventDefault();
            copySelection();
            deleteSelection();
            break;
          case 'd':
            e.preventDefault();
            // Duplicate: copy and paste in place (with offset)
            copySelection();
            // TODO: implement paste with offset
            break;
          case 'enter':
            e.preventDefault();
            runAnalysis();
            break;
        }
      }
    },
    [
      mode,
      setMode,
      undo,
      redo,
      canUndo,
      canRedo,
      fitToContent,
      resetView,
      clearSelection,
      deleteSelection,
      selectAll,
      copySelection,
      canvasSettings,
      updateCanvasSettings,
      runAnalysis,
    ]
  );

  // Handle space key release to return to select mode
  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === ' ' && mode === 'pan') {
        setMode('select');
      }
    },
    [mode, setMode]
  );

  // Register event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);
}
