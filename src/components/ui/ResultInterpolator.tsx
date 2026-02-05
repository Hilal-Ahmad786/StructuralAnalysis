/**
 * Result Interpolator
 *
 * Query analysis results at any point along a member.
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useModelStore } from '@/stores/modelStore';
import type { MemberResult } from '@/types/analysis';

interface InterpolatedResult {
  position: number;
  axial: number;
  shear: number;
  moment: number;
  deflection: number;
}

export function ResultInterpolator(): React.JSX.Element {
  const { model, analysisResult, selection } = useModelStore();
  const [queryPosition, setQueryPosition] = useState(0.5); // 0 to 1 (normalized)

  // Get selected member
  const selectedMember = useMemo(() => {
    const memberSelection = selection.find((s) => s.type === 'member');
    if (!memberSelection) return null;
    return model.members.find((m) => m.id === memberSelection.id);
  }, [selection, model.members]);

  // Get member result
  const memberResult = useMemo((): MemberResult | null => {
    if (!analysisResult?.success || !selectedMember) return null;
    return analysisResult.results.memberResults.find(
      (mr) => mr.memberId === selectedMember.id
    ) ?? null;
  }, [analysisResult, selectedMember]);

  // Calculate member length
  const memberLength = useMemo(() => {
    if (!selectedMember) return 0;
    const startNode = model.nodes.find((n) => n.id === selectedMember.startNodeId);
    const endNode = model.nodes.find((n) => n.id === selectedMember.endNodeId);
    if (!startNode || !endNode) return 0;
    const dx = endNode.x - startNode.x;
    const dy = endNode.y - startNode.y;
    return Math.sqrt(dx * dx + dy * dy);
  }, [selectedMember, model.nodes]);

  // Interpolate value at position
  const interpolateValue = useCallback(
    (points: { x: number; value: number }[], position: number): number => {
      if (points.length === 0) return 0;
      if (points.length === 1) return points[0]!.value;

      // Position in meters
      const x = position * memberLength;

      // Find bracketing points
      let i = 0;
      while (i < points.length - 1 && points[i + 1]!.x < x) {
        i++;
      }

      if (i >= points.length - 1) {
        return points[points.length - 1]!.value;
      }

      const p1 = points[i]!;
      const p2 = points[i + 1]!;

      // Linear interpolation
      const t = (x - p1.x) / (p2.x - p1.x);
      return p1.value + t * (p2.value - p1.value);
    },
    [memberLength]
  );

  // Calculate interpolated result
  const interpolatedResult: InterpolatedResult | null = useMemo(() => {
    if (!memberResult || memberLength === 0) return null;

    return {
      position: queryPosition * memberLength,
      axial: interpolateValue(memberResult.diagrams.axial, queryPosition),
      shear: interpolateValue(memberResult.diagrams.shear, queryPosition),
      moment: interpolateValue(memberResult.diagrams.moment, queryPosition),
      deflection: interpolateValue(memberResult.diagrams.deflection, queryPosition),
    };
  }, [memberResult, memberLength, queryPosition, interpolateValue]);

  // Find critical values
  const criticalValues = useMemo(() => {
    if (!memberResult) return null;

    const findMinMax = (points: { x: number; value: number }[]) => {
      if (points.length === 0) return { min: 0, max: 0, minPos: 0, maxPos: 0 };
      let min = points[0]!.value, max = points[0]!.value;
      let minPos = points[0]!.x, maxPos = points[0]!.x;

      points.forEach((p) => {
        if (p.value < min) {
          min = p.value;
          minPos = p.x;
        }
        if (p.value > max) {
          max = p.value;
          maxPos = p.x;
        }
      });

      return { min, max, minPos, maxPos };
    };

    return {
      axial: findMinMax(memberResult.diagrams.axial),
      shear: findMinMax(memberResult.diagrams.shear),
      moment: findMinMax(memberResult.diagrams.moment),
      deflection: findMinMax(memberResult.diagrams.deflection),
    };
  }, [memberResult]);

  if (!analysisResult?.success) {
    return (
      <div className="p-4">
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 text-center">
          <span className="material-symbols-outlined text-[32px] text-slate-400 mb-2 block">
            search
          </span>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
            No results to query
          </p>
          <p className="text-xs text-slate-400">
            Run analysis first
          </p>
        </div>
      </div>
    );
  }

  if (!selectedMember) {
    return (
      <div className="p-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 text-center border border-blue-200 dark:border-blue-800">
          <span className="material-symbols-outlined text-[32px] text-blue-400 mb-2 block">
            touch_app
          </span>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
            Select a member
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            Click on a member to view interpolated results
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-[20px] text-purple-500">
            query_stats
          </span>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Result Query</h3>
          <p className="text-xs text-slate-500">Member: {selectedMember.id}</p>
        </div>
      </div>

      {/* Member Info */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-slate-500">Length:</span>
            <span className="ml-2 font-mono text-slate-700 dark:text-slate-300">
              {memberLength.toFixed(3)} m
            </span>
          </div>
          <div>
            <span className="text-slate-500">Type:</span>
            <span className="ml-2 text-slate-700 dark:text-slate-300">
              {selectedMember.type === 'frame' ? 'Frame' : 'Truss'}
            </span>
          </div>
        </div>
      </div>

      {/* Position Slider */}
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-purple-700 dark:text-purple-300">
            Query Position
          </h4>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-purple-600 dark:text-purple-400">
              x = {(queryPosition * memberLength).toFixed(3)} m
            </span>
            <span className="text-xs text-purple-500">
              ({(queryPosition * 100).toFixed(0)}%)
            </span>
          </div>
        </div>

        <div className="relative">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={queryPosition}
            onChange={(e) => setQueryPosition(parseFloat(e.target.value))}
            className="w-full h-2 bg-purple-200 dark:bg-purple-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <div className="flex justify-between text-xs text-purple-400 mt-1">
            <span>Start</span>
            <span>End</span>
          </div>
        </div>

        {/* Quick position buttons */}
        <div className="flex gap-1 mt-3">
          {[0, 0.25, 0.5, 0.75, 1].map((pos) => (
            <button
              key={pos}
              onClick={() => setQueryPosition(pos)}
              className={`flex-1 py-1 text-xs rounded ${
                Math.abs(queryPosition - pos) < 0.01
                  ? 'bg-purple-500 text-white'
                  : 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800'
              }`}
            >
              {pos === 0 ? '0' : pos === 1 ? 'L' : `${pos}L`}
            </button>
          ))}
        </div>
      </div>

      {/* Interpolated Results */}
      {interpolatedResult && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Values at x = {interpolatedResult.position.toFixed(3)} m
          </h4>

          <ResultRow
            label="Axial Force (N)"
            value={interpolatedResult.axial}
            unit="kN"
            color="#f59e0b"
          />
          <ResultRow
            label="Shear Force (V)"
            value={interpolatedResult.shear}
            unit="kN"
            color="#3b82f6"
          />
          <ResultRow
            label="Bending Moment (M)"
            value={interpolatedResult.moment}
            unit="kN·m"
            color="#ef4444"
          />
          <ResultRow
            label="Deflection (δ)"
            value={interpolatedResult.deflection * 1000}
            unit="mm"
            color="#22d3ee"
          />
        </div>
      )}

      {/* Critical Values */}
      {criticalValues && (
        <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
          <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Critical Values
          </h4>

          <CriticalValueCard
            label="Max |N|"
            maxValue={Math.max(Math.abs(criticalValues.axial.min), Math.abs(criticalValues.axial.max))}
            unit="kN"
            color="#f59e0b"
            onGoToPosition={() => {
              const maxAbs = Math.abs(criticalValues.axial.min) > Math.abs(criticalValues.axial.max)
                ? criticalValues.axial.minPos
                : criticalValues.axial.maxPos;
              setQueryPosition(maxAbs / memberLength);
            }}
          />
          <CriticalValueCard
            label="Max |V|"
            maxValue={Math.max(Math.abs(criticalValues.shear.min), Math.abs(criticalValues.shear.max))}
            unit="kN"
            color="#3b82f6"
            onGoToPosition={() => {
              const maxAbs = Math.abs(criticalValues.shear.min) > Math.abs(criticalValues.shear.max)
                ? criticalValues.shear.minPos
                : criticalValues.shear.maxPos;
              setQueryPosition(maxAbs / memberLength);
            }}
          />
          <CriticalValueCard
            label="Max |M|"
            maxValue={Math.max(Math.abs(criticalValues.moment.min), Math.abs(criticalValues.moment.max))}
            unit="kN·m"
            color="#ef4444"
            onGoToPosition={() => {
              const maxAbs = Math.abs(criticalValues.moment.min) > Math.abs(criticalValues.moment.max)
                ? criticalValues.moment.minPos
                : criticalValues.moment.maxPos;
              setQueryPosition(maxAbs / memberLength);
            }}
          />
          <CriticalValueCard
            label="Max |δ|"
            maxValue={Math.max(Math.abs(criticalValues.deflection.min), Math.abs(criticalValues.deflection.max)) * 1000}
            unit="mm"
            color="#22d3ee"
            onGoToPosition={() => {
              const maxAbs = Math.abs(criticalValues.deflection.min) > Math.abs(criticalValues.deflection.max)
                ? criticalValues.deflection.minPos
                : criticalValues.deflection.maxPos;
              setQueryPosition(maxAbs / memberLength);
            }}
          />
        </div>
      )}
    </div>
  );
}

interface ResultRowProps {
  label: string;
  value: number;
  unit: string;
  color: string;
}

function ResultRow({ label, value, unit, color }: ResultRowProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
      </div>
      <span className="font-mono text-sm font-medium" style={{ color }}>
        {value.toFixed(4)} {unit}
      </span>
    </div>
  );
}

interface CriticalValueCardProps {
  label: string;
  maxValue: number;
  unit: string;
  color: string;
  onGoToPosition: () => void;
}

function CriticalValueCard({ label, maxValue, unit, color, onGoToPosition }: CriticalValueCardProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-slate-600 dark:text-slate-400">{label}:</span>
        <span className="font-mono font-medium" style={{ color }}>
          {maxValue.toFixed(2)} {unit}
        </span>
      </div>
      <button
        onClick={onGoToPosition}
        className="px-2 py-0.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
        title="Go to position"
      >
        <span className="material-symbols-outlined text-[14px]">my_location</span>
      </button>
    </div>
  );
}
