/**
 * Context Menu Component
 *
 * Right-click menu for quick actions on canvas elements.
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useModelStore } from '@/stores/modelStore';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  action: () => void;
}

interface MenuSection {
  items: MenuItem[];
}

interface ContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  onClose: () => void;
  target: { type: 'node' | 'member' | 'support' | 'canvas'; id?: string } | undefined;
}

export function ContextMenu({ isOpen, x, y, onClose, target }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const {
    selection,
    deleteNode,
    deleteMember,
    deleteSupport,
    select,
    clearSelection,
    undo,
    redo,
    canUndo,
    canRedo,
    setMode,
    model,
    addSupport,
    fitToContent,
  } = useModelStore();

  // Adjust position to keep menu in viewport
  const [adjustedPosition, setAdjustedPosition] = useState({ x, y });

  useEffect(() => {
    if (isOpen && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newX = x;
      let newY = y;

      if (x + rect.width > viewportWidth - 10) {
        newX = viewportWidth - rect.width - 10;
      }
      if (y + rect.height > viewportHeight - 10) {
        newY = viewportHeight - rect.height - 10;
      }

      setAdjustedPosition({ x: newX, y: newY });
    }
  }, [isOpen, x, y]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleDeleteSelection = useCallback(() => {
    selection.forEach((sel) => {
      if (sel.type === 'node') deleteNode(sel.id);
      else if (sel.type === 'member') deleteMember(sel.id);
      else if (sel.type === 'support') deleteSupport(sel.id);
    });
    onClose();
  }, [selection, deleteNode, deleteMember, deleteSupport, onClose]);

  const handleSelectAll = useCallback(() => {
    const allSelections = [
      ...model.nodes.map((node) => ({ type: 'node' as const, id: node.id })),
      ...model.members.map((member) => ({ type: 'member' as const, id: member.id })),
    ];
    select(allSelections);
    onClose();
  }, [model, select, onClose]);

  // Build menu sections based on target
  const buildMenuSections = (): MenuSection[] => {
    const sections: MenuSection[] = [];

    // If clicking on a specific element
    if (target?.type === 'node' && target.id) {
      const hasSupport = model.supports.some((s) => s.nodeId === target.id);

      sections.push({
        items: [
          {
            id: 'select-node',
            label: 'Select Node',
            icon: 'radio_button_unchecked',
            action: () => {
              select({ type: 'node', id: target.id! });
              onClose();
            },
          },
          {
            id: 'edit-node',
            label: 'Edit Properties',
            icon: 'edit',
            shortcut: 'E',
            action: () => {
              select({ type: 'node', id: target.id! });
              onClose();
            },
          },
        ],
      });

      sections.push({
        items: [
          {
            id: 'add-support',
            label: hasSupport ? 'Edit Support' : 'Add Support',
            icon: 'vertical_align_bottom',
            action: () => {
              if (!hasSupport) {
                addSupport(target.id!, 'pinned');
              }
              select({ type: 'node', id: target.id! });
              onClose();
            },
          },
          {
            id: 'add-load',
            label: 'Add Load',
            icon: 'arrow_downward',
            action: () => {
              setMode('load');
              select({ type: 'node', id: target.id! });
              onClose();
            },
          },
          {
            id: 'start-member',
            label: 'Draw Member From Here',
            icon: 'segment',
            action: () => {
              setMode('member');
              onClose();
            },
          },
        ],
      });

      sections.push({
        items: [
          {
            id: 'delete-node',
            label: 'Delete Node',
            icon: 'delete',
            shortcut: 'Del',
            danger: true,
            action: () => {
              deleteNode(target.id!);
              onClose();
            },
          },
        ],
      });
    } else if (target?.type === 'member' && target.id) {
      sections.push({
        items: [
          {
            id: 'select-member',
            label: 'Select Member',
            icon: 'segment',
            action: () => {
              select({ type: 'member', id: target.id! });
              onClose();
            },
          },
          {
            id: 'edit-member',
            label: 'Edit Properties',
            icon: 'edit',
            shortcut: 'E',
            action: () => {
              select({ type: 'member', id: target.id! });
              onClose();
            },
          },
        ],
      });

      sections.push({
        items: [
          {
            id: 'add-dist-load',
            label: 'Add Distributed Load',
            icon: 'straighten',
            action: () => {
              setMode('load');
              select({ type: 'member', id: target.id! });
              onClose();
            },
          },
          {
            id: 'subdivide-member',
            label: 'Subdivide Member',
            icon: 'content_cut',
            action: () => {
              window.dispatchEvent(
                new CustomEvent('structural:subdivide-member', {
                  detail: { memberId: target.id },
                })
              );
              onClose();
            },
          },
        ],
      });

      sections.push({
        items: [
          {
            id: 'delete-member',
            label: 'Delete Member',
            icon: 'delete',
            shortcut: 'Del',
            danger: true,
            action: () => {
              deleteMember(target.id!);
              onClose();
            },
          },
        ],
      });
    } else {
      // Canvas context menu (no specific element)
      sections.push({
        items: [
          {
            id: 'add-node-here',
            label: 'Add Node Here',
            icon: 'add_circle',
            shortcut: 'N',
            action: () => {
              setMode('node');
              onClose();
            },
          },
          {
            id: 'paste',
            label: 'Paste',
            icon: 'content_paste',
            shortcut: 'Ctrl+V',
            action: () => {
              // TODO: Implement paste
              onClose();
            },
            disabled: true,
          },
        ],
      });

      sections.push({
        items: [
          {
            id: 'select-all',
            label: 'Select All',
            icon: 'select_all',
            shortcut: 'Ctrl+A',
            action: handleSelectAll,
          },
          {
            id: 'fit-view',
            label: 'Fit to Content',
            icon: 'fit_screen',
            shortcut: 'F',
            action: () => {
              fitToContent();
              onClose();
            },
          },
        ],
      });

      sections.push({
        items: [
          {
            id: 'undo',
            label: 'Undo',
            icon: 'undo',
            shortcut: 'Ctrl+Z',
            action: () => {
              undo();
              onClose();
            },
            disabled: !canUndo(),
          },
          {
            id: 'redo',
            label: 'Redo',
            icon: 'redo',
            shortcut: 'Ctrl+Y',
            action: () => {
              redo();
              onClose();
            },
            disabled: !canRedo(),
          },
        ],
      });
    }

    // If there's a selection, add selection-specific actions
    if (selection.length > 0 && !target?.id) {
      sections.unshift({
        items: [
          {
            id: 'delete-selection',
            label: `Delete ${selection.length} Selected`,
            icon: 'delete',
            shortcut: 'Del',
            danger: true,
            action: handleDeleteSelection,
          },
          {
            id: 'duplicate-selection',
            label: 'Duplicate',
            icon: 'content_copy',
            shortcut: 'Ctrl+D',
            action: () => {
              // TODO: Implement duplicate
              onClose();
            },
            disabled: true,
          },
          {
            id: 'clear-selection',
            label: 'Clear Selection',
            icon: 'deselect',
            shortcut: 'Esc',
            action: () => {
              clearSelection();
              onClose();
            },
          },
        ],
      });
    }

    return sections;
  };

  if (!isOpen) return null;

  const menuSections = buildMenuSections();

  return (
    <div
      ref={menuRef}
      className="fixed z-[80] bg-white dark:bg-card-dark rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1.5 min-w-[200px] overflow-hidden"
      style={{ left: adjustedPosition.x, top: adjustedPosition.y }}
    >
      {menuSections.map((section, sectionIdx) => (
        <React.Fragment key={sectionIdx}>
          {sectionIdx > 0 && (
            <div className="h-px bg-slate-200 dark:bg-slate-700 my-1.5" />
          )}
          {section.items.map((item) => (
            <button
              key={item.id}
              onClick={item.action}
              disabled={item.disabled}
              className={`
                w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors
                ${item.disabled
                  ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  : item.danger
                    ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }
              `}
            >
              <span className={`material-symbols-outlined text-[18px] ${item.disabled ? '' : item.danger ? '' : 'text-slate-400'}`}>
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {item.shortcut && (
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {item.shortcut}
                </span>
              )}
            </button>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}

// Hook for managing context menu state
export function useContextMenu() {
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    target: { type: 'node' | 'member' | 'support' | 'canvas'; id?: string } | undefined;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    target: undefined,
  });

  const openContextMenu = useCallback(
    (x: number, y: number, target?: { type: 'node' | 'member' | 'support' | 'canvas'; id?: string }) => {
      setContextMenu({ isOpen: true, x, y, target });
    },
    []
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return {
    contextMenu,
    openContextMenu,
    closeContextMenu,
  };
}
