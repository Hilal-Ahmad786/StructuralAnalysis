/**
 * MemberSubdivisionDialog - Split a member into multiple segments
 *
 * Creates intermediate nodes along a member and replaces it with connected segments.
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useModelStore } from '@/stores/modelStore';

interface MemberSubdivisionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string | null;
}

export function MemberSubdivisionDialog({
  isOpen,
  onClose,
  memberId,
}: MemberSubdivisionDialogProps): React.JSX.Element | null {
  const { model, addNode, addMember, deleteMember } = useModelStore();
  const [divisions, setDivisions] = useState(2);
  const [mode, setMode] = useState<'equal' | 'custom'>('equal');
  const [customPositions, setCustomPositions] = useState<number[]>([0.5]);

  // Get member and nodes
  const member = useMemo(() => {
    if (!memberId) return null;
    return model.members.find((m) => m.id === memberId);
  }, [memberId, model.members]);

  const startNode = useMemo(() => {
    if (!member) return null;
    return model.nodes.find((n) => n.id === member.startNodeId);
  }, [member, model.nodes]);

  const endNode = useMemo(() => {
    if (!member) return null;
    return model.nodes.find((n) => n.id === member.endNodeId);
  }, [member, model.nodes]);

  const memberLength = useMemo(() => {
    if (!startNode || !endNode) return 0;
    return Math.sqrt(
      Math.pow(endNode.x - startNode.x, 2) + Math.pow(endNode.y - startNode.y, 2)
    );
  }, [startNode, endNode]);

  // Calculate preview points
  const previewPoints = useMemo(() => {
    if (!startNode || !endNode) return [];

    let positions: number[];
    if (mode === 'equal') {
      positions = [];
      for (let i = 1; i < divisions; i++) {
        positions.push(i / divisions);
      }
    } else {
      positions = customPositions.filter((p) => p > 0 && p < 1).sort((a, b) => a - b);
    }

    return positions.map((t) => ({
      t,
      x: startNode.x + t * (endNode.x - startNode.x),
      y: startNode.y + t * (endNode.y - startNode.y),
      distance: t * memberLength,
    }));
  }, [startNode, endNode, mode, divisions, customPositions, memberLength]);

  const handleAddCustomPosition = useCallback(() => {
    if (customPositions.length < 10) {
      setCustomPositions((prev) => [...prev, 0.5]);
    }
  }, [customPositions.length]);

  const handleRemoveCustomPosition = useCallback((index: number) => {
    setCustomPositions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpdateCustomPosition = useCallback((index: number, value: number) => {
    setCustomPositions((prev) => {
      const updated = [...prev];
      updated[index] = Math.max(0.01, Math.min(0.99, value));
      return updated;
    });
  }, []);

  const handleSubdivide = useCallback(() => {
    if (!member || !startNode || !endNode || previewPoints.length === 0) return;

    // Create intermediate nodes
    const newNodeIds: string[] = [];
    previewPoints.forEach((point) => {
      const nodeId = addNode(point.x, point.y);
      newNodeIds.push(nodeId);
    });

    // Create new members connecting all nodes
    const allNodeIds = [member.startNodeId, ...newNodeIds, member.endNodeId];
    for (let i = 0; i < allNodeIds.length - 1; i++) {
      addMember(allNodeIds[i]!, allNodeIds[i + 1]!, member.type);
    }

    // Delete original member
    deleteMember(member.id);

    onClose();
  }, [member, startNode, endNode, previewPoints, addNode, addMember, deleteMember, onClose]);

  if (!isOpen || !member || !startNode || !endNode) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Subdivide Member</h2>
            <p className="text-sm text-slate-500">
              {member.id} (L = {memberLength.toFixed(3)} m)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Mode Selection */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode('equal')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                mode === 'equal'
                  ? 'bg-structura-primary text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Equal Divisions
            </button>
            <button
              onClick={() => setMode('custom')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                mode === 'custom'
                  ? 'bg-structura-primary text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Custom Positions
            </button>
          </div>

          {/* Equal Divisions Input */}
          {mode === 'equal' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Number of Segments
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="2"
                  max="20"
                  value={divisions}
                  onChange={(e) => setDivisions(parseInt(e.target.value))}
                  className="flex-1 accent-structura-primary"
                />
                <input
                  type="number"
                  min="2"
                  max="50"
                  value={divisions}
                  onChange={(e) => setDivisions(Math.max(2, Math.min(50, parseInt(e.target.value) || 2)))}
                  className="w-16 px-3 py-2 text-center font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-structura-primary"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Segment length: {(memberLength / divisions).toFixed(4)} m
              </p>
            </div>
          )}

          {/* Custom Positions Input */}
          {mode === 'custom' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Division Points (0-1)
                </label>
                <button
                  onClick={handleAddCustomPosition}
                  disabled={customPositions.length >= 10}
                  className="text-xs text-structura-primary hover:text-blue-700 disabled:text-slate-400"
                >
                  + Add point
                </button>
              </div>
              <div className="space-y-2 max-h-40 overflow-auto">
                {customPositions.map((pos, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0.01"
                      max="0.99"
                      step="0.01"
                      value={pos}
                      onChange={(e) => handleUpdateCustomPosition(idx, parseFloat(e.target.value) || 0.5)}
                      className="flex-1 px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-structura-primary"
                    />
                    <span className="text-xs text-slate-500 w-20">
                      = {(pos * memberLength).toFixed(3)} m
                    </span>
                    {customPositions.length > 1 && (
                      <button
                        onClick={() => handleRemoveCustomPosition(idx)}
                        className="p-1 text-slate-400 hover:text-red-500"
                      >
                        <span className="material-symbols-outlined text-[18px]">remove</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Preview</h4>

            {/* Visual Preview */}
            <div className="relative h-16 mb-4">
              {/* Member line */}
              <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-300 dark:bg-slate-600 rounded-full transform -translate-y-1/2" />

              {/* Start node */}
              <div className="absolute top-1/2 left-4 w-4 h-4 bg-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 border-2 border-white" />

              {/* End node */}
              <div className="absolute top-1/2 right-4 w-4 h-4 bg-blue-500 rounded-full transform translate-x-1/2 -translate-y-1/2 border-2 border-white" />

              {/* Division points */}
              {previewPoints.map((point, idx) => (
                <div
                  key={idx}
                  className="absolute top-1/2 w-3 h-3 bg-green-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 border-2 border-white"
                  style={{ left: `calc(16px + ${point.t * (100 - 32 / 4)}%)` }}
                />
              ))}
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-slate-500">New nodes:</div>
              <div className="text-slate-900 dark:text-white font-medium">{previewPoints.length}</div>
              <div className="text-slate-500">New members:</div>
              <div className="text-slate-900 dark:text-white font-medium">{previewPoints.length + 1}</div>
            </div>

            {/* Division points list */}
            {previewPoints.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 mb-1">Division points:</p>
                <div className="flex flex-wrap gap-1">
                  {previewPoints.map((point, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 text-xs font-mono bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded"
                    >
                      {point.distance.toFixed(3)} m
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
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
            onClick={handleSubdivide}
            disabled={previewPoints.length === 0}
            className="px-6 py-2 bg-structura-primary hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Subdivide
          </button>
        </div>
      </div>
    </div>
  );
}
