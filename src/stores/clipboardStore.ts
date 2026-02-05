/**
 * Clipboard Store
 *
 * Manages copy/paste functionality for structural elements.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Node, Member, Support, Load } from '@/types';

interface ClipboardItem {
  nodes: Node[];
  members: Member[];
  supports: Support[];
  loads: Load[];
  // Store the bounding box center for paste offset
  center: { x: number; y: number };
}

interface ClipboardStore {
  clipboard: ClipboardItem | null;

  // Actions
  copy: (
    nodes: Node[],
    members: Member[],
    supports: Support[],
    loads: Load[]
  ) => void;
  clear: () => void;
  hasContent: () => boolean;
}

export const useClipboardStore = create<ClipboardStore>()(
  immer((set, get) => ({
    clipboard: null,

    copy: (nodes, members, supports, loads) => {
      if (nodes.length === 0) return;

      // Calculate bounding box center
      const xs = nodes.map((n) => n.x);
      const ys = nodes.map((n) => n.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const center = {
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2,
      };

      set((state) => {
        state.clipboard = {
          nodes: [...nodes],
          members: [...members],
          supports: [...supports],
          loads: [...loads],
          center,
        };
      });
    },

    clear: () => {
      set((state) => {
        state.clipboard = null;
      });
    },

    hasContent: () => {
      return get().clipboard !== null && get().clipboard!.nodes.length > 0;
    },
  }))
);
