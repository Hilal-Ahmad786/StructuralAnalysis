/**
 * Grid Generator
 *
 * Quickly generate frame grids with customizable spans and heights.
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useModelStore } from '@/stores/modelStore';

interface GridGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

type GridType = 'single-span' | 'multi-span' | 'multi-story' | 'truss';

interface GridConfig {
  type: GridType;
  spans: number;
  stories: number;
  spanWidth: number;
  storyHeight: number;
  // For trusses
  trussDepth: number;
  trussSubdivisions: number;
  // Options
  addBaseSupports: boolean;
  supportType: 'fixed' | 'pinned';
  memberType: 'frame' | 'truss';
}

export function GridGenerator({ isOpen, onClose }: GridGeneratorProps): React.JSX.Element | null {
  const { addNode, addMember, addSupport, resetModel, setMode } = useModelStore();

  const [config, setConfig] = useState<GridConfig>({
    type: 'multi-span',
    spans: 3,
    stories: 2,
    spanWidth: 6,
    storyHeight: 3,
    trussDepth: 1.5,
    trussSubdivisions: 4,
    addBaseSupports: true,
    supportType: 'pinned',
    memberType: 'frame',
  });

  const [showConfirm, setShowConfirm] = useState(false);

  // Preview calculations
  const preview = useMemo(() => {
    const { type, spans, stories, spanWidth, storyHeight, trussDepth, trussSubdivisions } = config;
    let nodeCount = 0;
    let memberCount = 0;
    let supportCount = 0;
    let totalWidth = 0;
    let totalHeight = 0;

    if (type === 'single-span') {
      nodeCount = 4;
      memberCount = 3;
      supportCount = 2;
      totalWidth = spanWidth;
      totalHeight = storyHeight;
    } else if (type === 'multi-span') {
      nodeCount = (spans + 1) * 2;
      memberCount = spans + (spans + 1) + spans; // beams + columns + connections
      supportCount = spans + 1;
      totalWidth = spans * spanWidth;
      totalHeight = storyHeight;
    } else if (type === 'multi-story') {
      nodeCount = (spans + 1) * (stories + 1);
      memberCount = spans * (stories + 1) + (spans + 1) * stories;
      supportCount = spans + 1;
      totalWidth = spans * spanWidth;
      totalHeight = stories * storyHeight;
    } else if (type === 'truss') {
      // Warren truss pattern
      const bottomNodes = trussSubdivisions + 1;
      const topNodes = trussSubdivisions;
      nodeCount = bottomNodes + topNodes;
      // Bottom chord + top chord + diagonals
      memberCount = trussSubdivisions + (trussSubdivisions - 1) + trussSubdivisions * 2;
      supportCount = 2;
      totalWidth = spanWidth;
      totalHeight = trussDepth;
    }

    return { nodeCount, memberCount, supportCount, totalWidth, totalHeight };
  }, [config]);

  const handleGenerate = useCallback(() => {
    const { type, spans, stories, spanWidth, storyHeight, trussDepth, trussSubdivisions, addBaseSupports, supportType } = config;

    // Clear existing model
    resetModel();

    const nodes: Map<string, string> = new Map(); // key -> nodeId
    const nodeKey = (x: number, y: number) => `${x.toFixed(4)},${y.toFixed(4)}`;
    const getOrCreateNode = (x: number, y: number): string => {
      const key = nodeKey(x, y);
      if (!nodes.has(key)) {
        const id = addNode(x, y);
        nodes.set(key, id);
      }
      return nodes.get(key)!;
    };

    if (type === 'single-span' || type === 'multi-span') {
      // Create a single-story frame
      for (let i = 0; i <= spans; i++) {
        const x = i * spanWidth;
        // Base node
        const baseId = getOrCreateNode(x, 0);
        // Top node
        const topId = getOrCreateNode(x, storyHeight);

        // Column
        addMember(baseId, topId);

        // Add support at base
        if (addBaseSupports) {
          addSupport(baseId, supportType);
        }

        // Beam (if not first column)
        if (i > 0) {
          const prevTopId = getOrCreateNode((i - 1) * spanWidth, storyHeight);
          addMember(prevTopId, topId);
        }
      }
    } else if (type === 'multi-story') {
      // Create multi-story frame
      for (let story = 0; story <= stories; story++) {
        const y = story * storyHeight;

        for (let span = 0; span <= spans; span++) {
          const x = span * spanWidth;
          const nodeId = getOrCreateNode(x, y);

          // Column (if not at top)
          if (story < stories) {
            const topNodeId = getOrCreateNode(x, (story + 1) * storyHeight);
            addMember(nodeId, topNodeId);
          }

          // Beam (if not first column)
          if (span > 0) {
            const prevNodeId = getOrCreateNode((span - 1) * spanWidth, y);
            addMember(prevNodeId, nodeId);
          }

          // Support at base
          if (story === 0 && addBaseSupports) {
            addSupport(nodeId, supportType);
          }
        }
      }
    } else if (type === 'truss') {
      // Create Warren truss
      const dx = spanWidth / trussSubdivisions;

      // Bottom chord nodes and members
      const bottomNodes: string[] = [];
      for (let i = 0; i <= trussSubdivisions; i++) {
        const x = i * dx;
        bottomNodes.push(getOrCreateNode(x, 0));
      }

      // Bottom chord members
      for (let i = 0; i < trussSubdivisions; i++) {
        addMember(bottomNodes[i]!, bottomNodes[i + 1]!);
      }

      // Top chord nodes (offset by half dx)
      const topNodes: string[] = [];
      for (let i = 0; i < trussSubdivisions; i++) {
        const x = (i + 0.5) * dx;
        topNodes.push(getOrCreateNode(x, trussDepth));
      }

      // Top chord members
      for (let i = 0; i < trussSubdivisions - 1; i++) {
        addMember(topNodes[i]!, topNodes[i + 1]!);
      }

      // Diagonal members
      for (let i = 0; i < trussSubdivisions; i++) {
        // Left diagonal
        addMember(bottomNodes[i]!, topNodes[i]!);
        // Right diagonal
        addMember(topNodes[i]!, bottomNodes[i + 1]!);
      }

      // Supports
      if (addBaseSupports) {
        addSupport(bottomNodes[0]!, 'pinned');
        addSupport(bottomNodes[bottomNodes.length - 1]!, 'rollerX');
      }
    }

    setMode('select');
    onClose();
  }, [config, addNode, addMember, addSupport, resetModel, setMode, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-card-dark rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-structura-primary/10 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px] text-structura-primary">
                grid_view
              </span>
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">Grid Generator</h2>
              <p className="text-xs text-slate-500">Quickly create common structural layouts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Grid Type Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Structure Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {([
                { id: 'single-span', label: 'Single Span', icon: 'door_sliding' },
                { id: 'multi-span', label: 'Multi-Span', icon: 'view_column' },
                { id: 'multi-story', label: 'Multi-Story', icon: 'apartment' },
                { id: 'truss', label: 'Truss', icon: 'ssid_chart' },
              ] as const).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setConfig({ ...config, type: t.id })}
                  className={`p-3 rounded-lg border text-center transition-colors ${
                    config.type === t.id
                      ? 'border-structura-primary bg-structura-primary/10 text-structura-primary'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <span className="material-symbols-outlined text-[24px] block mb-1">{t.icon}</span>
                  <span className="text-xs">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            {config.type !== 'truss' && config.type !== 'single-span' && (
              <div>
                <label className="block text-xs text-slate-500 mb-1">Number of Spans</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={config.spans}
                  onChange={(e) => setConfig({ ...config, spans: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>
            )}

            {config.type === 'multi-story' && (
              <div>
                <label className="block text-xs text-slate-500 mb-1">Number of Stories</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={config.stories}
                  onChange={(e) => setConfig({ ...config, stories: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-500 mb-1">Span Width (m)</label>
              <input
                type="number"
                step="0.5"
                min={1}
                max={50}
                value={config.spanWidth}
                onChange={(e) => setConfig({ ...config, spanWidth: parseFloat(e.target.value) || 6 })}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
              />
            </div>

            {config.type !== 'truss' && (
              <div>
                <label className="block text-xs text-slate-500 mb-1">Story Height (m)</label>
                <input
                  type="number"
                  step="0.5"
                  min={1}
                  max={20}
                  value={config.storyHeight}
                  onChange={(e) => setConfig({ ...config, storyHeight: parseFloat(e.target.value) || 3 })}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>
            )}

            {config.type === 'truss' && (
              <>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Truss Depth (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0.5}
                    max={10}
                    value={config.trussDepth}
                    onChange={(e) => setConfig({ ...config, trussDepth: parseFloat(e.target.value) || 1.5 })}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Subdivisions</label>
                  <input
                    type="number"
                    min={2}
                    max={20}
                    value={config.trussSubdivisions}
                    onChange={(e) => setConfig({ ...config, trussSubdivisions: parseInt(e.target.value) || 4 })}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
              </>
            )}
          </div>

          {/* Support Options */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.addBaseSupports}
                onChange={(e) => setConfig({ ...config, addBaseSupports: e.target.checked })}
                className="rounded border-slate-300"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Add base supports</span>
            </label>

            {config.addBaseSupports && config.type !== 'truss' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Type:</span>
                <select
                  value={config.supportType}
                  onChange={(e) => setConfig({ ...config, supportType: e.target.value as 'fixed' | 'pinned' })}
                  className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm"
                >
                  <option value="fixed">Fixed</option>
                  <option value="pinned">Pinned</option>
                </select>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Preview</h4>
            <div className="grid grid-cols-5 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-structura-primary">{preview.nodeCount}</p>
                <p className="text-xs text-slate-500">Nodes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-structura-primary">{preview.memberCount}</p>
                <p className="text-xs text-slate-500">Members</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-structura-primary">{preview.supportCount}</p>
                <p className="text-xs text-slate-500">Supports</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">{preview.totalWidth.toFixed(1)}</p>
                <p className="text-xs text-slate-500">Width (m)</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">{preview.totalHeight.toFixed(1)}</p>
                <p className="text-xs text-slate-500">Height (m)</p>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[20px] text-amber-500">warning</span>
              <div className="text-xs text-amber-700 dark:text-amber-300">
                <p className="font-medium mb-1">This will replace your current model</p>
                <p>All existing nodes, members, supports, and loads will be removed.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            className="px-4 py-2 text-sm font-medium bg-structura-primary hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Generate Structure
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-white dark:bg-card-dark rounded-xl shadow-xl p-6 max-w-sm">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Confirm Generation</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              This will replace your current model. Are you sure you want to continue?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  handleGenerate();
                }}
                className="px-4 py-2 text-sm font-medium bg-structura-primary hover:bg-blue-700 text-white rounded-lg"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
