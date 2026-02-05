/**
 * PropertyPanel - Edit properties of selected elements
 *
 * Updated with Structura Design System.
 */

'use client';

import React from 'react';
import { useModelStore } from '@/stores/modelStore';
import type { Node, Member, Load, LoadDirection } from '@/types';

export function PropertyPanel() {
  const { selection, model, deleteNode, deleteMember, deleteSupport } = useModelStore();

  if (selection.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-[28px] text-slate-400 dark:text-slate-500">
            touch_app
          </span>
        </div>
        <p className="text-slate-600 dark:text-slate-400 font-medium">No selection</p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
          Click on nodes or members to edit their properties
        </p>
      </div>
    );
  }

  // Handle multi-selection
  if (selection.length > 1) {
    const nodeCount = selection.filter((s) => s.type === 'node').length;
    const memberCount = selection.filter((s) => s.type === 'member').length;

    return (
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-structura-primary/10 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px] text-structura-primary">
              select_all
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Multiple Selection</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {nodeCount > 0 && `${nodeCount} nodes`}
              {nodeCount > 0 && memberCount > 0 && ', '}
              {memberCount > 0 && `${memberCount} members`}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            selection.forEach((s) => {
              if (s.type === 'node') deleteNode(s.id);
              else if (s.type === 'member') deleteMember(s.id);
              else if (s.type === 'support') deleteSupport(s.id);
            });
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
          Delete Selected
        </button>
      </div>
    );
  }

  // Single selection
  const sel = selection[0]!;

  if (sel.type === 'node') {
    const node = model.nodes.find((n) => n.id === sel.id);
    if (!node) return null;
    return <NodeProperties node={node} />;
  }

  if (sel.type === 'member') {
    const member = model.members.find((m) => m.id === sel.id);
    if (!member) return null;
    return <MemberProperties member={member} />;
  }

  return null;
}

// Node properties editor
function NodeProperties({ node }: { node: Node }) {
  const { updateNode, deleteNode, model, addSupport, deleteSupport, addNodalLoad, getActiveLoadCase } =
    useModelStore();

  const support = model.supports.find((s) => s.nodeId === node.id);
  const activeLoadCase = getActiveLoadCase();
  const nodalLoads =
    activeLoadCase?.loads.filter((l) => l.target === 'node' && l.targetId === node.id) ?? [];

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-structura-primary/10 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px] text-structura-primary">
              radio_button_unchecked
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Node {node.id}</h3>
            <p className="text-xs text-slate-400">Joint / Connection Point</p>
          </div>
        </div>
        <button
          onClick={() => deleteNode(node.id)}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          title="Delete Node"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>

      {/* Position */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
        <h4 className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <span className="material-symbols-outlined text-[16px] text-slate-400">location_on</span>
          Position
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">X (m)</label>
            <input
              type="number"
              step="0.1"
              value={node.x}
              onChange={(e) => updateNode(node.id, { x: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-structura-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Y (m)</label>
            <input
              type="number"
              step="0.1"
              value={node.y}
              onChange={(e) => updateNode(node.id, { y: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-structura-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Support */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
        <h4 className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <span className="material-symbols-outlined text-[16px] text-slate-400">
            vertical_align_bottom
          </span>
          Support Conditions
        </h4>
        {support ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <label className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-structura-primary transition-colors">
                <input
                  type="checkbox"
                  checked={support.dx}
                  onChange={(e) =>
                    useModelStore.getState().updateSupport(node.id, { dx: e.target.checked })
                  }
                  className="rounded text-structura-primary focus:ring-structura-primary"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">X</span>
              </label>
              <label className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-structura-primary transition-colors">
                <input
                  type="checkbox"
                  checked={support.dy}
                  onChange={(e) =>
                    useModelStore.getState().updateSupport(node.id, { dy: e.target.checked })
                  }
                  className="rounded text-structura-primary focus:ring-structura-primary"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">Y</span>
              </label>
              <label className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-structura-primary transition-colors">
                <input
                  type="checkbox"
                  checked={support.rz}
                  onChange={(e) =>
                    useModelStore.getState().updateSupport(node.id, { rz: e.target.checked })
                  }
                  className="rounded text-structura-primary focus:ring-structura-primary"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">Rotation</span>
              </label>
            </div>

            {/* Settlements Section */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
              <h5 className="text-xs font-medium text-slate-500 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">trending_down</span>
                Settlements (Prescribed Displacements)
              </h5>
              <div className="grid grid-cols-3 gap-2">
                {support.dx && (
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">ΔX (m)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={support.settlementDx ?? 0}
                      onChange={(e) =>
                        useModelStore.getState().updateSupport(node.id, {
                          settlementDx: parseFloat(e.target.value) || 0
                        })
                      }
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-structura-primary focus:border-transparent"
                    />
                  </div>
                )}
                {support.dy && (
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">ΔY (m)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={support.settlementDy ?? 0}
                      onChange={(e) =>
                        useModelStore.getState().updateSupport(node.id, {
                          settlementDy: parseFloat(e.target.value) || 0
                        })
                      }
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-structura-primary focus:border-transparent"
                    />
                  </div>
                )}
                {support.rz && (
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Δθ (rad)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={support.settlementRz ?? 0}
                      onChange={(e) =>
                        useModelStore.getState().updateSupport(node.id, {
                          settlementRz: parseFloat(e.target.value) || 0
                        })
                      }
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-structura-primary focus:border-transparent"
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Negative ΔY = downward settlement
              </p>
            </div>

            <button
              onClick={() => deleteSupport(node.id)}
              className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">remove_circle</span>
              Remove Support
            </button>
          </div>
        ) : (
          <button
            onClick={() => addSupport(node.id, 'pinned')}
            className="flex items-center gap-2 text-sm text-structura-primary hover:text-blue-700 font-medium transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Add Support
          </button>
        )}
      </div>

      {/* Loads */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
        <h4 className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <span className="material-symbols-outlined text-[16px] text-slate-400">
            arrow_downward
          </span>
          Loads
          <span className="ml-auto text-xs text-slate-400 font-normal">
            {activeLoadCase?.name ?? 'No load case'}
          </span>
        </h4>
        {nodalLoads.map((load) => (
          <NodalLoadEditor key={load.id} load={load} loadCaseId={activeLoadCase!.id} />
        ))}
        <button
          onClick={() => addNodalLoad(node.id, 0, -10)}
          className="flex items-center gap-2 text-sm text-structura-primary hover:text-blue-700 font-medium transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          Add Load
        </button>
      </div>
    </div>
  );
}

// Nodal load editor
function NodalLoadEditor({ load, loadCaseId }: { load: Load; loadCaseId: string }) {
  const { updateLoad, deleteLoad } = useModelStore();

  return (
    <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-slate-500">{load.id}</span>
        <button
          onClick={() => deleteLoad(loadCaseId, load.id)}
          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Fx (kN)</label>
          <input
            type="number"
            step="1"
            value={load.fx ?? 0}
            onChange={(e) => updateLoad(loadCaseId, load.id, { fx: parseFloat(e.target.value) || 0 })}
            className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-structura-primary focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Fy (kN)</label>
          <input
            type="number"
            step="1"
            value={load.fy ?? 0}
            onChange={(e) => updateLoad(loadCaseId, load.id, { fy: parseFloat(e.target.value) || 0 })}
            className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-structura-primary focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Mz (kN·m)</label>
          <input
            type="number"
            step="1"
            value={load.mz ?? 0}
            onChange={(e) => updateLoad(loadCaseId, load.id, { mz: parseFloat(e.target.value) || 0 })}
            className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-structura-primary focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}

// Member properties editor
function MemberProperties({ member }: { member: Member }) {
  const { updateMember, deleteMember, model, addMemberLoad, getActiveLoadCase } = useModelStore();

  const startNode = model.nodes.find((n) => n.id === member.startNodeId);
  const endNode = model.nodes.find((n) => n.id === member.endNodeId);

  // Calculate length
  const length =
    startNode && endNode
      ? Math.sqrt(
          Math.pow(endNode.x - startNode.x, 2) + Math.pow(endNode.y - startNode.y, 2)
        ).toFixed(3)
      : '?';

  const activeLoadCase = getActiveLoadCase();
  const memberLoads =
    activeLoadCase?.loads.filter((l) => l.target === 'member' && l.targetId === member.id) ?? [];

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-structura-primary/10 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px] text-structura-primary">
              segment
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Member {member.id}</h3>
            <p className="text-xs text-slate-400">
              {member.startNodeId} → {member.endNodeId}
            </p>
          </div>
        </div>
        <button
          onClick={() => deleteMember(member.id)}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          title="Delete Member"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>

      {/* Geometry Info */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-400">Length</span>
          <span className="text-sm font-medium text-slate-900 dark:text-white">{length} m</span>
        </div>
      </div>

      {/* Type */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
        <h4 className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <span className="material-symbols-outlined text-[16px] text-slate-400">category</span>
          Element Type
        </h4>
        <select
          value={member.type}
          onChange={(e) => updateMember(member.id, { type: e.target.value as 'frame' | 'truss' })}
          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-structura-primary focus:border-transparent"
        >
          <option value="frame">Frame (Moment-resisting)</option>
          <option value="truss">Truss (Axial only)</option>
        </select>
      </div>

      {/* Material */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
        <h4 className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <span className="material-symbols-outlined text-[16px] text-slate-400">science</span>
          Material
        </h4>
        <select
          value={member.materialId}
          onChange={(e) => updateMember(member.id, { materialId: e.target.value })}
          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-structura-primary focus:border-transparent"
        >
          {model.materials.map((mat) => (
            <option key={mat.id} value={mat.id}>
              {mat.name} (E = {mat.E / 1e6} GPa)
            </option>
          ))}
        </select>
      </div>

      {/* Section */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
        <h4 className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <span className="material-symbols-outlined text-[16px] text-slate-400">view_in_ar</span>
          Section
        </h4>
        <select
          value={member.sectionId}
          onChange={(e) => updateMember(member.id, { sectionId: e.target.value })}
          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-structura-primary focus:border-transparent"
        >
          {model.sections.map((sec) => (
            <option key={sec.id} value={sec.id}>
              {sec.name}
            </option>
          ))}
        </select>
      </div>

      {/* Distributed Loads */}
      {member.type === 'frame' && (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
          <h4 className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <span className="material-symbols-outlined text-[16px] text-slate-400">
              arrow_downward
            </span>
            Distributed Loads
            <span className="ml-auto text-xs text-slate-400 font-normal">
              {activeLoadCase?.name ?? 'No load case'}
            </span>
          </h4>
          {memberLoads.map((load) => (
            <MemberLoadEditor key={load.id} load={load} loadCaseId={activeLoadCase!.id} />
          ))}
          <button
            onClick={() => addMemberLoad(member.id, 10, 'globalNegY')}
            className="flex items-center gap-2 text-sm text-structura-primary hover:text-blue-700 font-medium transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Add Distributed Load
          </button>
        </div>
      )}

      {member.type === 'truss' && memberLoads.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-400">
          <span className="material-symbols-outlined text-[18px]">warning</span>
          Truss elements cannot have distributed loads
        </div>
      )}
    </div>
  );
}

// Member load editor
function MemberLoadEditor({ load, loadCaseId }: { load: Load; loadCaseId: string }) {
  const { updateLoad, deleteLoad } = useModelStore();

  return (
    <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-slate-500">{load.id}</span>
        <button
          onClick={() => deleteLoad(loadCaseId, load.id)}
          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-slate-500 mb-1">w (kN/m)</label>
          <input
            type="number"
            step="1"
            value={load.w ?? 0}
            onChange={(e) => updateLoad(loadCaseId, load.id, { w: parseFloat(e.target.value) || 0 })}
            className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-structura-primary focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Direction</label>
          <select
            value={load.direction ?? 'globalNegY'}
            onChange={(e) =>
              updateLoad(loadCaseId, load.id, { direction: e.target.value as LoadDirection })
            }
            className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-structura-primary focus:border-transparent"
          >
            <option value="globalNegY">Global -Y (↓)</option>
            <option value="globalY">Global +Y (↑)</option>
            <option value="localNegY">Local -Y</option>
            <option value="localY">Local +Y</option>
          </select>
        </div>
      </div>
    </div>
  );
}
