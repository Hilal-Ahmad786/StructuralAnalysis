/**
 * CoordinateInputDialog - Precise coordinate entry for nodes
 *
 * Supports multiple input modes: absolute, relative, polar, and pattern generation.
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useModelStore } from '@/stores/modelStore';

type InputMode = 'absolute' | 'relative' | 'polar' | 'pattern';

interface PatternConfig {
  type: 'grid' | 'line' | 'arc';
  // Grid pattern
  cols?: number;
  rows?: number;
  spacingX?: number;
  spacingY?: number;
  // Line pattern
  count?: number;
  length?: number;
  angle?: number;
  // Arc pattern
  radius?: number;
  startAngle?: number;
  endAngle?: number;
  divisions?: number;
}

interface CoordinateInputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  referencePoint?: { x: number; y: number };
}

export function CoordinateInputDialog({
  isOpen,
  onClose,
  referencePoint = { x: 0, y: 0 },
}: CoordinateInputDialogProps): React.JSX.Element | null {
  const { addNode } = useModelStore();

  const [mode, setMode] = useState<InputMode>('absolute');
  const [x, setX] = useState('0');
  const [y, setY] = useState('0');
  const [distance, setDistance] = useState('1');
  const [angle, setAngle] = useState('0');
  const [pattern, setPattern] = useState<PatternConfig>({
    type: 'grid',
    cols: 3,
    rows: 3,
    spacingX: 1,
    spacingY: 1,
  });

  const calculateAbsoluteCoords = useCallback((): { x: number; y: number } | null => {
    if (mode === 'absolute') {
      const xVal = parseFloat(x);
      const yVal = parseFloat(y);
      if (isNaN(xVal) || isNaN(yVal)) return null;
      return { x: xVal, y: yVal };
    } else if (mode === 'relative') {
      const xVal = parseFloat(x);
      const yVal = parseFloat(y);
      if (isNaN(xVal) || isNaN(yVal)) return null;
      return {
        x: referencePoint.x + xVal,
        y: referencePoint.y + yVal,
      };
    } else if (mode === 'polar') {
      const dist = parseFloat(distance);
      const ang = (parseFloat(angle) * Math.PI) / 180; // Convert to radians
      if (isNaN(dist) || isNaN(ang)) return null;
      return {
        x: referencePoint.x + dist * Math.cos(ang),
        y: referencePoint.y + dist * Math.sin(ang),
      };
    }
    return null;
  }, [mode, x, y, distance, angle, referencePoint]);

  const generatePatternNodes = useCallback((): { x: number; y: number }[] => {
    const nodes: { x: number; y: number }[] = [];
    const baseX = parseFloat(x) || 0;
    const baseY = parseFloat(y) || 0;

    if (pattern.type === 'grid') {
      const cols = pattern.cols || 3;
      const rows = pattern.rows || 3;
      const spX = pattern.spacingX || 1;
      const spY = pattern.spacingY || 1;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          nodes.push({
            x: baseX + col * spX,
            y: baseY + row * spY,
          });
        }
      }
    } else if (pattern.type === 'line') {
      const count = pattern.count || 5;
      const length = pattern.length || 10;
      const ang = ((pattern.angle || 0) * Math.PI) / 180;
      const spacing = length / (count - 1);

      for (let i = 0; i < count; i++) {
        nodes.push({
          x: baseX + i * spacing * Math.cos(ang),
          y: baseY + i * spacing * Math.sin(ang),
        });
      }
    } else if (pattern.type === 'arc') {
      const radius = pattern.radius || 5;
      const startAng = ((pattern.startAngle || 0) * Math.PI) / 180;
      const endAng = ((pattern.endAngle || 180) * Math.PI) / 180;
      const divisions = pattern.divisions || 8;

      for (let i = 0; i <= divisions; i++) {
        const ang = startAng + (i / divisions) * (endAng - startAng);
        nodes.push({
          x: baseX + radius * Math.cos(ang),
          y: baseY + radius * Math.sin(ang),
        });
      }
    }

    return nodes;
  }, [x, y, pattern]);

  const handleAddSingleNode = useCallback(() => {
    const coords = calculateAbsoluteCoords();
    if (coords) {
      addNode(coords.x, coords.y);
      onClose();
    }
  }, [calculateAbsoluteCoords, addNode, onClose]);

  const handleAddPatternNodes = useCallback(() => {
    const nodes = generatePatternNodes();
    nodes.forEach((node) => addNode(node.x, node.y));
    onClose();
  }, [generatePatternNodes, addNode, onClose]);

  const previewCoords = calculateAbsoluteCoords();
  const patternNodes = mode === 'pattern' ? generatePatternNodes() : [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Add Node</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Mode Selector */}
          <div className="flex gap-2">
            {(['absolute', 'relative', 'polar', 'pattern'] as InputMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  mode === m
                    ? 'bg-structura-primary text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>

          {/* Reference Point Info */}
          {(mode === 'relative' || mode === 'polar') && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
              <span className="text-blue-600 dark:text-blue-400">
                Reference: ({referencePoint.x.toFixed(3)}, {referencePoint.y.toFixed(3)})
              </span>
            </div>
          )}

          {/* Input Fields based on mode */}
          {mode !== 'pattern' ? (
            <div className="space-y-4">
              {mode === 'polar' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Distance (m)
                    </label>
                    <input
                      type="number"
                      value={distance}
                      onChange={(e) => setDistance(e.target.value)}
                      step="0.1"
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-structura-primary font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Angle (degrees, CCW from +X)
                    </label>
                    <input
                      type="number"
                      value={angle}
                      onChange={(e) => setAngle(e.target.value)}
                      step="15"
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-structura-primary font-mono"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {mode === 'relative' ? 'Delta X (m)' : 'X Coordinate (m)'}
                    </label>
                    <input
                      type="number"
                      value={x}
                      onChange={(e) => setX(e.target.value)}
                      step="0.1"
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-structura-primary font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {mode === 'relative' ? 'Delta Y (m)' : 'Y Coordinate (m)'}
                    </label>
                    <input
                      type="number"
                      value={y}
                      onChange={(e) => setY(e.target.value)}
                      step="0.1"
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-structura-primary font-mono"
                    />
                  </div>
                </>
              )}

              {/* Preview */}
              {previewCoords && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm">
                  <span className="text-green-600 dark:text-green-400">
                    Node will be placed at: ({previewCoords.x.toFixed(4)}, {previewCoords.y.toFixed(4)})
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* Pattern Mode */
            <div className="space-y-4">
              {/* Pattern Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Pattern Type
                </label>
                <div className="flex gap-2">
                  {(['grid', 'line', 'arc'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setPattern((p) => ({ ...p, type }))}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                        pattern.type === type
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Base Point */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Base X (m)</label>
                  <input
                    type="number"
                    value={x}
                    onChange={(e) => setX(e.target.value)}
                    step="0.1"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Base Y (m)</label>
                  <input
                    type="number"
                    value={y}
                    onChange={(e) => setY(e.target.value)}
                    step="0.1"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              {/* Pattern-specific inputs */}
              {pattern.type === 'grid' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Columns</label>
                    <input
                      type="number"
                      value={pattern.cols}
                      onChange={(e) => setPattern((p) => ({ ...p, cols: parseInt(e.target.value) || 1 }))}
                      min="1"
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Rows</label>
                    <input
                      type="number"
                      value={pattern.rows}
                      onChange={(e) => setPattern((p) => ({ ...p, rows: parseInt(e.target.value) || 1 }))}
                      min="1"
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Spacing X (m)</label>
                    <input
                      type="number"
                      value={pattern.spacingX}
                      onChange={(e) => setPattern((p) => ({ ...p, spacingX: parseFloat(e.target.value) || 1 }))}
                      step="0.1"
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Spacing Y (m)</label>
                    <input
                      type="number"
                      value={pattern.spacingY}
                      onChange={(e) => setPattern((p) => ({ ...p, spacingY: parseFloat(e.target.value) || 1 }))}
                      step="0.1"
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {pattern.type === 'line' && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Count</label>
                    <input
                      type="number"
                      value={pattern.count}
                      onChange={(e) => setPattern((p) => ({ ...p, count: parseInt(e.target.value) || 2 }))}
                      min="2"
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Length (m)</label>
                    <input
                      type="number"
                      value={pattern.length}
                      onChange={(e) => setPattern((p) => ({ ...p, length: parseFloat(e.target.value) || 1 }))}
                      step="0.1"
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Angle (deg)</label>
                    <input
                      type="number"
                      value={pattern.angle}
                      onChange={(e) => setPattern((p) => ({ ...p, angle: parseFloat(e.target.value) || 0 }))}
                      step="15"
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {pattern.type === 'arc' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Radius (m)</label>
                    <input
                      type="number"
                      value={pattern.radius}
                      onChange={(e) => setPattern((p) => ({ ...p, radius: parseFloat(e.target.value) || 1 }))}
                      step="0.1"
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Divisions</label>
                    <input
                      type="number"
                      value={pattern.divisions}
                      onChange={(e) => setPattern((p) => ({ ...p, divisions: parseInt(e.target.value) || 4 }))}
                      min="2"
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Start Angle (deg)</label>
                    <input
                      type="number"
                      value={pattern.startAngle}
                      onChange={(e) => setPattern((p) => ({ ...p, startAngle: parseFloat(e.target.value) || 0 }))}
                      step="15"
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">End Angle (deg)</label>
                    <input
                      type="number"
                      value={pattern.endAngle}
                      onChange={(e) => setPattern((p) => ({ ...p, endAngle: parseFloat(e.target.value) || 180 }))}
                      step="15"
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Pattern Preview */}
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm">
                <span className="text-green-600 dark:text-green-400">
                  Will create {patternNodes.length} nodes
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={mode === 'pattern' ? handleAddPatternNodes : handleAddSingleNode}
            className="px-6 py-2 bg-structura-primary hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {mode === 'pattern' ? `Add ${patternNodes.length} Nodes` : 'Add Node'}
          </button>
        </div>
      </div>
    </div>
  );
}
