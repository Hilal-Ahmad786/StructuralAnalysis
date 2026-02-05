/**
 * Reactions Panel
 *
 * Display support reaction forces from analysis results.
 */

'use client';

import React, { useMemo } from 'react';
import { useModelStore } from '@/stores/modelStore';

interface ReactionForce {
  nodeId: string;
  nodeName: string;
  supportType: string;
  fx: number;
  fy: number;
  mz: number;
  magnitude: number;
}

export function ReactionsPanel(): React.JSX.Element {
  const { model, analysisResult } = useModelStore();

  // Calculate reactions from analysis results
  const reactions: ReactionForce[] = useMemo(() => {
    if (!analysisResult?.success || !analysisResult.results.reactions) {
      return [];
    }

    return model.supports.map((support) => {
      const node = model.nodes.find((n) => n.id === support.nodeId);
      const reaction = analysisResult.results.reactions?.find((r) => r.nodeId === support.nodeId);

      // Determine support type
      let supportType = 'Custom';
      if (support.dx && support.dy && support.rz) supportType = 'Fixed';
      else if (support.dx && support.dy) supportType = 'Pinned';
      else if (support.dy) supportType = 'Roller X';
      else if (support.dx) supportType = 'Roller Y';

      const fx = reaction?.fx || 0;
      const fy = reaction?.fy || 0;
      const mz = reaction?.mz || 0;
      const magnitude = Math.sqrt(fx * fx + fy * fy);

      return {
        nodeId: support.nodeId,
        nodeName: node?.id || support.nodeId,
        supportType,
        fx,
        fy,
        mz,
        magnitude,
      };
    });
  }, [model.supports, model.nodes, analysisResult]);

  // Calculate totals
  const totals = useMemo(() => {
    return reactions.reduce(
      (acc, r) => ({
        fx: acc.fx + r.fx,
        fy: acc.fy + r.fy,
        mz: acc.mz + r.mz,
      }),
      { fx: 0, fy: 0, mz: 0 }
    );
  }, [reactions]);

  if (!analysisResult?.success) {
    return (
      <div className="p-4">
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 text-center">
          <span className="material-symbols-outlined text-[32px] text-slate-400 mb-2 block">
            vertical_align_bottom
          </span>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
            No reaction data available
          </p>
          <p className="text-xs text-slate-400">
            Run analysis to see support reactions
          </p>
        </div>
      </div>
    );
  }

  if (reactions.length === 0) {
    return (
      <div className="p-4">
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[20px] text-amber-500">warning</span>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              No supports defined in the model
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-[20px] text-green-500">
            vertical_align_bottom
          </span>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Support Reactions</h3>
          <p className="text-xs text-slate-500">{reactions.length} supports</p>
        </div>
      </div>

      {/* Reactions Table */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-400">
                Node
              </th>
              <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-400">
                Type
              </th>
              <th className="px-3 py-2 text-right font-medium text-slate-600 dark:text-slate-400">
                Fx (kN)
              </th>
              <th className="px-3 py-2 text-right font-medium text-slate-600 dark:text-slate-400">
                Fy (kN)
              </th>
              <th className="px-3 py-2 text-right font-medium text-slate-600 dark:text-slate-400">
                Mz (kN·m)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {reactions.map((reaction) => (
              <tr key={reaction.nodeId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-3 py-2 font-medium text-slate-900 dark:text-white">
                  {reaction.nodeName}
                </td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-700">
                    {reaction.supportType}
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-mono text-slate-700 dark:text-slate-300">
                  {formatForce(reaction.fx)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-slate-700 dark:text-slate-300">
                  {formatForce(reaction.fy)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-slate-700 dark:text-slate-300">
                  {formatMoment(reaction.mz)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-structura-primary/5 border-t-2 border-structura-primary/20">
            <tr>
              <td className="px-3 py-2 font-semibold text-slate-900 dark:text-white" colSpan={2}>
                Total
              </td>
              <td className="px-3 py-2 text-right font-mono font-semibold text-slate-900 dark:text-white">
                {formatForce(totals.fx)}
              </td>
              <td className="px-3 py-2 text-right font-mono font-semibold text-slate-900 dark:text-white">
                {formatForce(totals.fy)}
              </td>
              <td className="px-3 py-2 text-right font-mono font-semibold text-slate-900 dark:text-white">
                {formatMoment(totals.mz)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Equilibrium Check */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
          Equilibrium Check
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <EquilibriumIndicator
            label="ΣFx"
            value={totals.fx}
            unit="kN"
            threshold={0.001}
          />
          <EquilibriumIndicator
            label="ΣFy"
            value={totals.fy}
            unit="kN"
            threshold={0.001}
          />
          <EquilibriumIndicator
            label="ΣMz"
            value={totals.mz}
            unit="kN·m"
            threshold={0.001}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="text-xs text-slate-500 dark:text-slate-400">
        <p className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[14px]">info</span>
          Positive Fx = rightward, Positive Fy = upward, Positive Mz = counter-clockwise
        </p>
      </div>
    </div>
  );
}

interface EquilibriumIndicatorProps {
  label: string;
  value: number;
  unit: string;
  threshold: number;
}

function EquilibriumIndicator({ label, value, unit, threshold }: EquilibriumIndicatorProps): React.JSX.Element {
  const isBalanced = Math.abs(value) < threshold;

  return (
    <div className={`p-3 rounded-lg border ${
      isBalanced
        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
        : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
    }`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={`material-symbols-outlined text-[16px] ${
          isBalanced ? 'text-green-500' : 'text-amber-500'
        }`}>
          {isBalanced ? 'check_circle' : 'warning'}
        </span>
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</span>
      </div>
      <p className={`text-sm font-mono font-semibold ${
        isBalanced
          ? 'text-green-700 dark:text-green-300'
          : 'text-amber-700 dark:text-amber-300'
      }`}>
        {value.toFixed(4)} {unit}
      </p>
    </div>
  );
}

function formatForce(value: number): string {
  if (Math.abs(value) < 0.0001) return '0.00';
  return value.toFixed(2);
}

function formatMoment(value: number): string {
  if (Math.abs(value) < 0.0001) return '0.00';
  return value.toFixed(2);
}
