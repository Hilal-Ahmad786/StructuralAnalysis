/**
 * Zoom Controls Component
 *
 * Provides zoom in/out buttons and displays current zoom level.
 */

'use client';

import React, { useCallback } from 'react';
import { useModelStore } from '@/stores/modelStore';

interface ZoomControlsProps {
  className?: string;
}

export function ZoomControls({ className = '' }: ZoomControlsProps): React.JSX.Element {
  const { view, setZoom, fitToContent, resetView } = useModelStore();

  const zoomIn = useCallback(() => {
    const newZoom = Math.min(view.zoom * 1.25, 500);
    setZoom(newZoom);
  }, [view, setZoom]);

  const zoomOut = useCallback(() => {
    const newZoom = Math.max(view.zoom / 1.25, 5);
    setZoom(newZoom);
  }, [view, setZoom]);

  // Calculate percentage (100% = 50 px/m default)
  const zoomPercent = Math.round((view.zoom / 50) * 100);

  return (
    <div
      className={`flex items-center gap-1 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 ${className}`}
    >
      {/* Zoom Out */}
      <button
        onClick={zoomOut}
        className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-l-lg transition-colors"
        title="Zoom Out (Ctrl+-)"
      >
        <span className="material-symbols-outlined text-[18px]">remove</span>
      </button>

      {/* Zoom Level Display */}
      <button
        onClick={resetView}
        className="px-2 py-1.5 min-w-[60px] text-center text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        title="Reset to 100%"
      >
        {zoomPercent}%
      </button>

      {/* Zoom In */}
      <button
        onClick={zoomIn}
        className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-r-lg transition-colors"
        title="Zoom In (Ctrl++)"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

      {/* Fit to Content */}
      <button
        onClick={fitToContent}
        className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-r-lg transition-colors"
        title="Fit to Content (F)"
      >
        <span className="material-symbols-outlined text-[18px]">fit_screen</span>
      </button>
    </div>
  );
}

/**
 * Mini Map Component
 *
 * Shows an overview of the entire model with viewport indicator.
 */
interface MiniMapProps {
  width?: number;
  height?: number;
  className?: string;
}

export function MiniMap({
  width = 150,
  height = 100,
  className = '',
}: MiniMapProps): React.JSX.Element | null {
  const { model } = useModelStore();

  // Don't show if no model
  if (model.nodes.length === 0) return null;

  // Calculate model bounds
  const xs = model.nodes.map((n) => n.x);
  const ys = model.nodes.map((n) => n.y);
  const modelMinX = Math.min(...xs);
  const modelMaxX = Math.max(...xs);
  const modelMinY = Math.min(...ys);
  const modelMaxY = Math.max(...ys);

  const modelWidth = Math.max(modelMaxX - modelMinX, 1);
  const modelHeight = Math.max(modelMaxY - modelMinY, 1);

  // Add padding
  const padding = 10;
  const availableWidth = width - padding * 2;
  const availableHeight = height - padding * 2;

  // Calculate scale to fit model in mini map
  const scaleX = availableWidth / modelWidth;
  const scaleY = availableHeight / modelHeight;
  const scale = Math.min(scaleX, scaleY);

  // Transform model coordinates to mini map coordinates
  const toMiniX = (x: number): number =>
    padding + (x - modelMinX) * scale + (availableWidth - modelWidth * scale) / 2;
  const toMiniY = (y: number): number =>
    padding + (modelMaxY - y) * scale + (availableHeight - modelHeight * scale) / 2;

  return (
    <div
      className={`bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden ${className}`}
      style={{ width, height }}
    >
      <svg width={width} height={height}>
        {/* Members */}
        {model.members.map((member) => {
          const startNode = model.nodes.find((n) => n.id === member.startNodeId);
          const endNode = model.nodes.find((n) => n.id === member.endNodeId);
          if (!startNode || !endNode) return null;

          return (
            <line
              key={member.id}
              x1={toMiniX(startNode.x)}
              y1={toMiniY(startNode.y)}
              x2={toMiniX(endNode.x)}
              y2={toMiniY(endNode.y)}
              stroke="#64748b"
              strokeWidth={1.5}
            />
          );
        })}

        {/* Nodes */}
        {model.nodes.map((node) => (
          <circle
            key={node.id}
            cx={toMiniX(node.x)}
            cy={toMiniY(node.y)}
            r={3}
            fill="#2463eb"
          />
        ))}

        {/* Supports */}
        {model.supports.map((support) => {
          const node = model.nodes.find((n) => n.id === support.nodeId);
          if (!node) return null;

          return (
            <rect
              key={support.nodeId}
              x={toMiniX(node.x) - 4}
              y={toMiniY(node.y) - 4}
              width={8}
              height={8}
              fill="#f59e0b"
              transform={`rotate(45 ${toMiniX(node.x)} ${toMiniY(node.y)})`}
            />
          );
        })}

        {/* Viewport indicator - approximate since we'd need canvas dimensions */}
        {/* This is a placeholder - actual implementation would track viewport bounds */}
      </svg>
    </div>
  );
}
