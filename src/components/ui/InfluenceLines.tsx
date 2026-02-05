/**
 * Influence Lines Panel
 *
 * Visualize influence lines for reactions, shear, and moment.
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useModelStore } from '@/stores/modelStore';

type InfluenceType = 'reaction' | 'shear' | 'moment';

interface InfluenceLineData {
  positions: number[];
  values: number[];
  maxPositive: number;
  maxNegative: number;
  maxPositivePos: number;
  maxNegativePos: number;
}

export function InfluenceLinesPanel(): React.JSX.Element {
  const { model, selection } = useModelStore();
  const [influenceType, setInfluenceType] = useState<InfluenceType>('reaction');
  const [showCalculation, setShowCalculation] = useState(false);

  // Get selected support for reaction IL
  const selectedSupport = useMemo(() => {
    const nodeSelection = selection.find((s) => s.type === 'node');
    if (!nodeSelection) return null;
    return model.supports.find((s) => s.nodeId === nodeSelection.id);
  }, [selection, model.supports]);

  // Get selected member for shear/moment IL
  const selectedMember = useMemo(() => {
    const memberSelection = selection.find((s) => s.type === 'member');
    if (!memberSelection) return null;
    return model.members.find((m) => m.id === memberSelection.id);
  }, [selection, model.members]);

  // Calculate mock influence line data
  const influenceLineData: InfluenceLineData | null = useMemo(() => {
    // This is simplified mock data
    // In production, this would involve solving the structure with unit load at each position

    if (influenceType === 'reaction' && !selectedSupport) return null;
    if ((influenceType === 'shear' || influenceType === 'moment') && !selectedMember) return null;

    // Generate sample IL data
    const numPoints = 21;
    const positions: number[] = [];
    const values: number[] = [];

    for (let i = 0; i <= numPoints; i++) {
      const x = i / numPoints;
      positions.push(x);

      // Generate characteristic shapes based on type
      if (influenceType === 'reaction') {
        // Typical reaction IL - triangular for simply supported beam
        values.push(1 - x);
      } else if (influenceType === 'shear') {
        // Typical shear IL - step function
        const sectionPos = 0.5;
        if (x < sectionPos) {
          values.push(1 - sectionPos);
        } else {
          values.push(-sectionPos);
        }
      } else {
        // Moment IL - parabolic shape
        const sectionPos = 0.5;
        if (x < sectionPos) {
          values.push(x * (1 - sectionPos));
        } else {
          values.push((1 - x) * sectionPos);
        }
      }
    }

    const maxPositive = Math.max(...values, 0);
    const maxNegative = Math.min(...values, 0);
    const maxPositiveIdx = values.indexOf(maxPositive);
    const maxNegativeIdx = values.indexOf(maxNegative);

    return {
      positions,
      values,
      maxPositive,
      maxNegative,
      maxPositivePos: positions[maxPositiveIdx] ?? 0,
      maxNegativePos: positions[maxNegativeIdx] ?? 0,
    };
  }, [influenceType, selectedSupport, selectedMember]);

  const calculateForLoad = useCallback((loadPosition: number, loadMagnitude: number) => {
    if (!influenceLineData) return null;

    // Interpolate IL value at load position
    const idx = influenceLineData.positions.findIndex((p) => p >= loadPosition);
    if (idx === 0) return influenceLineData.values[0]! * loadMagnitude;
    if (idx === -1) return influenceLineData.values[influenceLineData.values.length - 1]! * loadMagnitude;

    const p1 = influenceLineData.positions[idx - 1]!;
    const p2 = influenceLineData.positions[idx]!;
    const v1 = influenceLineData.values[idx - 1]!;
    const v2 = influenceLineData.values[idx]!;

    const t = (loadPosition - p1) / (p2 - p1);
    const ilValue = v1 + t * (v2 - v1);

    return ilValue * loadMagnitude;
  }, [influenceLineData]);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-[20px] text-violet-500">
            show_chart
          </span>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Influence Lines</h3>
          <p className="text-xs text-slate-500">Moving load analysis</p>
        </div>
      </div>

      {/* Type Selection */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
          Influence Line Type
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'reaction', label: 'Reaction', icon: 'vertical_align_bottom' },
            { id: 'shear', label: 'Shear', icon: 'swap_vert' },
            { id: 'moment', label: 'Moment', icon: 'rotate_right' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setInfluenceType(type.id as InfluenceType)}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors ${
                influenceType === type.id
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-600'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{type.icon}</span>
              <span className="text-xs font-medium">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Selection Hint */}
      {((influenceType === 'reaction' && !selectedSupport) ||
        ((influenceType === 'shear' || influenceType === 'moment') && !selectedMember)) && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[20px] text-blue-500">info</span>
            <div className="text-xs text-blue-700 dark:text-blue-300">
              {influenceType === 'reaction' ? (
                <p>Select a supported node to view reaction influence line.</p>
              ) : (
                <p>Select a member to view {influenceType} influence line at mid-span.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Influence Line Visualization */}
      {influenceLineData && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
              IL Diagram
            </h4>
            <span className="text-xs text-slate-500">
              {influenceType === 'reaction' && selectedSupport && `Support: ${selectedSupport.nodeId}`}
              {(influenceType === 'shear' || influenceType === 'moment') && selectedMember && `Member: ${selectedMember.id}`}
            </span>
          </div>

          {/* SVG Diagram */}
          <svg width="100%" height="120" viewBox="0 0 300 120" className="mb-4">
            {/* Baseline */}
            <line x1="30" y1="60" x2="270" y2="60" stroke="currentColor" strokeWidth="1" className="text-slate-300" />

            {/* Influence line */}
            <polyline
              points={influenceLineData.positions
                .map((p, i) => {
                  const x = 30 + p * 240;
                  const y = 60 - influenceLineData.values[i]! * 40;
                  return `${x},${y}`;
                })
                .join(' ')}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-violet-500"
            />

            {/* Fill positive area */}
            <polygon
              points={[
                '30,60',
                ...influenceLineData.positions.map((p, i) => {
                  const x = 30 + p * 240;
                  const y = 60 - Math.max(0, influenceLineData.values[i]!) * 40;
                  return `${x},${y}`;
                }),
                '270,60',
              ].join(' ')}
              fill="currentColor"
              className="text-violet-500/20"
            />

            {/* Fill negative area */}
            <polygon
              points={[
                '30,60',
                ...influenceLineData.positions.map((p, i) => {
                  const x = 30 + p * 240;
                  const y = 60 - Math.min(0, influenceLineData.values[i]!) * 40;
                  return `${x},${y}`;
                }),
                '270,60',
              ].join(' ')}
              fill="currentColor"
              className="text-red-500/20"
            />

            {/* Max positive marker */}
            {influenceLineData.maxPositive > 0 && (
              <g>
                <circle
                  cx={30 + influenceLineData.maxPositivePos * 240}
                  cy={60 - influenceLineData.maxPositive * 40}
                  r="4"
                  fill="currentColor"
                  className="text-violet-500"
                />
                <text
                  x={30 + influenceLineData.maxPositivePos * 240}
                  y={60 - influenceLineData.maxPositive * 40 - 10}
                  textAnchor="middle"
                  className="text-[10px] fill-violet-600"
                >
                  +{influenceLineData.maxPositive.toFixed(3)}
                </text>
              </g>
            )}

            {/* Max negative marker */}
            {influenceLineData.maxNegative < 0 && (
              <g>
                <circle
                  cx={30 + influenceLineData.maxNegativePos * 240}
                  cy={60 - influenceLineData.maxNegative * 40}
                  r="4"
                  fill="currentColor"
                  className="text-red-500"
                />
                <text
                  x={30 + influenceLineData.maxNegativePos * 240}
                  y={60 - influenceLineData.maxNegative * 40 + 15}
                  textAnchor="middle"
                  className="text-[10px] fill-red-600"
                >
                  {influenceLineData.maxNegative.toFixed(3)}
                </text>
              </g>
            )}

            {/* Labels */}
            <text x="30" y="110" textAnchor="middle" className="text-[10px] fill-slate-500">0</text>
            <text x="270" y="110" textAnchor="middle" className="text-[10px] fill-slate-500">L</text>
          </svg>

          {/* Critical Values */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
              <span className="text-violet-600 dark:text-violet-400">Max +:</span>
              <span className="ml-2 font-mono text-violet-700 dark:text-violet-300">
                {influenceLineData.maxPositive.toFixed(4)}
              </span>
            </div>
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <span className="text-red-600 dark:text-red-400">Max -:</span>
              <span className="ml-2 font-mono text-red-700 dark:text-red-300">
                {influenceLineData.maxNegative.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Load Calculator */}
      {influenceLineData && (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Effect Calculator
            </h4>
            <button
              onClick={() => setShowCalculation(!showCalculation)}
              className="text-xs text-structura-primary hover:underline"
            >
              {showCalculation ? 'Hide' : 'Show'} calculator
            </button>
          </div>

          {showCalculation && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Calculate the effect of a point load at any position using the IL ordinates.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Position (0-1)</label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    defaultValue="0.5"
                    className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
                    id="il-position"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Load (kN)</label>
                  <input
                    type="number"
                    step="1"
                    defaultValue="10"
                    className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
                    id="il-load"
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  const posInput = document.getElementById('il-position') as HTMLInputElement;
                  const loadInput = document.getElementById('il-load') as HTMLInputElement;
                  const pos = parseFloat(posInput.value) || 0.5;
                  const load = parseFloat(loadInput.value) || 10;
                  const result = calculateForLoad(pos, load);
                  if (result !== null) {
                    alert(`Effect = ${result.toFixed(4)} ${influenceType === 'moment' ? 'kN·m' : 'kN'}`);
                  }
                }}
                className="w-full py-2 text-sm font-medium bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition-colors"
              >
                Calculate Effect
              </button>
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <p className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[14px]">info</span>
          Influence lines show the variation of a response as a unit load moves along the structure.
        </p>
      </div>
    </div>
  );
}
