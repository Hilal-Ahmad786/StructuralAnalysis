/**
 * Self-Weight Dialog
 *
 * Calculate and apply self-weight loads to members based on material density and section area.
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useModelStore } from '@/stores/modelStore';

interface SelfWeightDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MemberSelfWeight {
  memberId: string;
  memberName: string;
  materialName: string;
  sectionName: string;
  density: number | undefined;
  area: number;
  length: number;
  selfWeight: number | undefined; // kN/m
  totalWeight: number | undefined; // kN
  selected: boolean;
}

export function SelfWeightDialog({ isOpen, onClose }: SelfWeightDialogProps): React.JSX.Element | null {
  const { model, loadCases, activeLoadCaseId, addMemberLoad } = useModelStore();
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(true);

  // Calculate self-weight for each member
  const memberWeights: MemberSelfWeight[] = useMemo(() => {
    return model.members.map((member) => {
      const material = model.materials.find((m) => m.id === member.materialId);
      const section = model.sections.find((s) => s.id === member.sectionId);
      const startNode = model.nodes.find((n) => n.id === member.startNodeId);
      const endNode = model.nodes.find((n) => n.id === member.endNodeId);

      let length = 0;
      if (startNode && endNode) {
        const dx = endNode.x - startNode.x;
        const dy = endNode.y - startNode.y;
        length = Math.sqrt(dx * dx + dy * dy);
      }

      const density = material?.density;
      const area = section?.A || 0;
      const selfWeight = density && area ? density * area : undefined;
      const totalWeight = selfWeight && length ? selfWeight * length : undefined;

      return {
        memberId: member.id,
        memberName: member.id,
        materialName: material?.name || 'Unknown',
        sectionName: section?.name || 'Unknown',
        density,
        area,
        length,
        selfWeight,
        totalWeight,
        selected: selectAll,
      };
    });
  }, [model, selectAll]);

  // Filter members that can have self-weight calculated
  const validMembers = useMemo(() => {
    return memberWeights.filter((m) => m.selfWeight !== undefined);
  }, [memberWeights]);

  const invalidMembers = useMemo(() => {
    return memberWeights.filter((m) => m.selfWeight === undefined);
  }, [memberWeights]);

  // Calculate totals
  const totalSelfWeight = useMemo(() => {
    return validMembers
      .filter((m) => selectedMembers.has(m.memberId) || (selectAll && m.selected))
      .reduce((sum, m) => sum + (m.totalWeight || 0), 0);
  }, [validMembers, selectedMembers, selectAll]);

  const toggleMember = useCallback((memberId: string) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
    setSelectAll(false);
  }, []);

  const handleApply = useCallback(() => {
    const membersToApply = validMembers.filter(
      (m) => selectedMembers.has(m.memberId) || (selectAll && m.selected)
    );

    membersToApply.forEach((member) => {
      if (member.selfWeight) {
        addMemberLoad(member.memberId, member.selfWeight, 'globalNegY');
      }
    });

    onClose();
  }, [validMembers, selectedMembers, selectAll, addMemberLoad, onClose]);

  if (!isOpen) return null;

  const activeLoadCase = loadCases.find((lc) => lc.id === activeLoadCaseId) || loadCases[0];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-card-dark rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px] text-amber-500">
                weight
              </span>
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">Apply Self-Weight</h2>
              <p className="text-xs text-slate-500">
                Load Case: {activeLoadCase?.name || 'Default'}
              </p>
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
        <div className="flex-1 overflow-y-auto p-6">
          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800 mb-6">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[20px] text-blue-500">info</span>
              <div className="text-xs text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">Self-Weight Calculation</p>
                <p>
                  Self-weight is calculated as: <strong>w = γ × A</strong> where γ is the material
                  density (kN/m³) and A is the cross-sectional area (m²).
                </p>
              </div>
            </div>
          </div>

          {/* Valid Members Table */}
          {validMembers.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Members with Valid Data ({validMembers.length})
                </h3>
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={(e) => {
                      setSelectAll(e.target.checked);
                      if (e.target.checked) {
                        setSelectedMembers(new Set());
                      }
                    }}
                    className="rounded border-slate-300"
                  />
                  Select All
                </label>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-slate-600 dark:text-slate-400 w-10">
                        <span className="sr-only">Select</span>
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-slate-600 dark:text-slate-400">Member</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-600 dark:text-slate-400">Material</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-600 dark:text-slate-400">Section</th>
                      <th className="px-4 py-2 text-right font-medium text-slate-600 dark:text-slate-400">Length (m)</th>
                      <th className="px-4 py-2 text-right font-medium text-slate-600 dark:text-slate-400">w (kN/m)</th>
                      <th className="px-4 py-2 text-right font-medium text-slate-600 dark:text-slate-400">Total (kN)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {validMembers.map((member) => {
                      const isSelected = selectAll || selectedMembers.has(member.memberId);
                      return (
                        <tr
                          key={member.memberId}
                          className={isSelected ? 'bg-structura-primary/5' : ''}
                        >
                          <td className="px-4 py-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleMember(member.memberId)}
                              className="rounded border-slate-300"
                            />
                          </td>
                          <td className="px-4 py-2 text-slate-900 dark:text-white font-medium">
                            {member.memberName}
                          </td>
                          <td className="px-4 py-2 text-slate-600 dark:text-slate-400">
                            {member.materialName}
                          </td>
                          <td className="px-4 py-2 text-slate-600 dark:text-slate-400">
                            {member.sectionName}
                          </td>
                          <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-400">
                            {member.length.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-right text-slate-900 dark:text-white font-medium">
                            {member.selfWeight?.toFixed(4)}
                          </td>
                          <td className="px-4 py-2 text-right text-slate-900 dark:text-white font-medium">
                            {member.totalWeight?.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Invalid Members Warning */}
          {invalidMembers.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-[20px] text-amber-500">warning</span>
                <div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">
                    {invalidMembers.length} member(s) missing density data
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    These members cannot have self-weight calculated. Please set material density in the Material Library.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {invalidMembers.map((m) => (
                      <span
                        key={m.memberId}
                        className="px-2 py-0.5 text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded"
                      >
                        {m.memberName} ({m.materialName})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="text-sm">
            <span className="text-slate-500">Total Selected Weight:</span>
            <span className="ml-2 font-semibold text-slate-900 dark:text-white">
              {totalSelfWeight.toFixed(2)} kN
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={validMembers.length === 0 || totalSelfWeight === 0}
              className="px-4 py-2 text-sm font-medium bg-structura-primary hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply Self-Weight Loads
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
