/**
 * NodeTableEditor - Spreadsheet-style editor for nodes
 *
 * Allows bulk editing of node coordinates in a table format.
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useModelStore } from '@/stores/modelStore';

interface EditingCell {
  nodeId: string;
  field: 'x' | 'y';
}

export function NodeTableEditor(): React.JSX.Element {
  const { model, updateNode, addNode, deleteNode } = useModelStore();
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newNodeX, setNewNodeX] = useState('');
  const [newNodeY, setNewNodeY] = useState('');
  const [sortField, setSortField] = useState<'id' | 'x' | 'y'>('id');
  const [sortAsc, setSortAsc] = useState(true);
  const [filter, setFilter] = useState('');

  // Sort and filter nodes
  const sortedNodes = useMemo(() => {
    let nodes = [...model.nodes];

    // Filter
    if (filter) {
      const lowerFilter = filter.toLowerCase();
      nodes = nodes.filter(
        (n) =>
          n.id.toLowerCase().includes(lowerFilter) ||
          n.x.toString().includes(filter) ||
          n.y.toString().includes(filter)
      );
    }

    // Sort
    nodes.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'id') {
        cmp = a.id.localeCompare(b.id, undefined, { numeric: true });
      } else {
        cmp = a[sortField] - b[sortField];
      }
      return sortAsc ? cmp : -cmp;
    });

    return nodes;
  }, [model.nodes, sortField, sortAsc, filter]);

  const handleSort = useCallback((field: 'id' | 'x' | 'y') => {
    setSortField((prev) => {
      if (prev === field) {
        setSortAsc((asc) => !asc);
        return field;
      }
      setSortAsc(true);
      return field;
    });
  }, []);

  const startEditing = useCallback((nodeId: string, field: 'x' | 'y', currentValue: number) => {
    setEditingCell({ nodeId, field });
    setEditValue(currentValue.toFixed(4));
  }, []);

  const commitEdit = useCallback(() => {
    if (!editingCell) return;

    const value = parseFloat(editValue);
    if (!isNaN(value)) {
      updateNode(editingCell.nodeId, { [editingCell.field]: value });
    }
    setEditingCell(null);
    setEditValue('');
  }, [editingCell, editValue, updateNode]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        commitEdit();
      } else if (e.key === 'Escape') {
        cancelEdit();
      }
    },
    [commitEdit, cancelEdit]
  );

  const handleAddNode = useCallback(() => {
    const x = parseFloat(newNodeX);
    const y = parseFloat(newNodeY);

    if (isNaN(x) || isNaN(y)) {
      return;
    }

    addNode(x, y);
    setNewNodeX('');
    setNewNodeY('');
  }, [newNodeX, newNodeY, addNode]);

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      if (confirm(`Delete node ${nodeId}? This will also delete connected members.`)) {
        deleteNode(nodeId);
      }
    },
    [deleteNode]
  );

  const handleBulkImport = useCallback(() => {
    const input = prompt(
      'Enter nodes as CSV (x,y per line):\nExample:\n0,0\n5,0\n5,3'
    );
    if (!input) return;

    const lines = input.trim().split('\n');
    for (const line of lines) {
      const parts = line.split(',').map((s) => parseFloat(s.trim()));
      if (parts.length >= 2 && !isNaN(parts[0]!) && !isNaN(parts[1]!)) {
        addNode(parts[0]!, parts[1]!);
      }
    }
  }, [addNode]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px] text-blue-500">scatter_plot</span>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Node Table</h3>
            <p className="text-xs text-slate-500">{model.nodes.length} nodes</p>
          </div>
        </div>
        <button
          onClick={handleBulkImport}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-structura-primary border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">upload</span>
          Import CSV
        </button>
      </div>

      {/* Filter */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-700">
        <input
          type="text"
          placeholder="Filter nodes..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-structura-primary"
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
            <tr>
              <th
                className="px-4 py-2 text-left font-medium text-slate-600 dark:text-slate-400 cursor-pointer hover:text-structura-primary"
                onClick={() => handleSort('id')}
              >
                <span className="flex items-center gap-1">
                  ID
                  {sortField === 'id' && (
                    <span className="material-symbols-outlined text-[14px]">
                      {sortAsc ? 'arrow_upward' : 'arrow_downward'}
                    </span>
                  )}
                </span>
              </th>
              <th
                className="px-4 py-2 text-left font-medium text-slate-600 dark:text-slate-400 cursor-pointer hover:text-structura-primary"
                onClick={() => handleSort('x')}
              >
                <span className="flex items-center gap-1">
                  X (m)
                  {sortField === 'x' && (
                    <span className="material-symbols-outlined text-[14px]">
                      {sortAsc ? 'arrow_upward' : 'arrow_downward'}
                    </span>
                  )}
                </span>
              </th>
              <th
                className="px-4 py-2 text-left font-medium text-slate-600 dark:text-slate-400 cursor-pointer hover:text-structura-primary"
                onClick={() => handleSort('y')}
              >
                <span className="flex items-center gap-1">
                  Y (m)
                  {sortField === 'y' && (
                    <span className="material-symbols-outlined text-[14px]">
                      {sortAsc ? 'arrow_upward' : 'arrow_downward'}
                    </span>
                  )}
                </span>
              </th>
              <th className="px-4 py-2 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {sortedNodes.map((node) => (
              <tr
                key={node.id}
                className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <td className="px-4 py-2 font-mono text-slate-700 dark:text-slate-300">{node.id}</td>
                <td className="px-4 py-2">
                  {editingCell?.nodeId === node.id && editingCell.field === 'x' ? (
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      step="0.001"
                      className="w-full px-2 py-1 text-sm font-mono bg-white dark:bg-slate-900 border border-structura-primary rounded focus:outline-none"
                    />
                  ) : (
                    <span
                      className="font-mono text-slate-700 dark:text-slate-300 cursor-pointer hover:text-structura-primary"
                      onClick={() => startEditing(node.id, 'x', node.x)}
                    >
                      {node.x.toFixed(4)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {editingCell?.nodeId === node.id && editingCell.field === 'y' ? (
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      step="0.001"
                      className="w-full px-2 py-1 text-sm font-mono bg-white dark:bg-slate-900 border border-structura-primary rounded focus:outline-none"
                    />
                  ) : (
                    <span
                      className="font-mono text-slate-700 dark:text-slate-300 cursor-pointer hover:text-structura-primary"
                      onClick={() => startEditing(node.id, 'y', node.y)}
                    >
                      {node.y.toFixed(4)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => handleDeleteNode(node.id)}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    title="Delete node"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sortedNodes.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            {filter ? 'No nodes match filter' : 'No nodes yet'}
          </div>
        )}
      </div>

      {/* Add Node Row */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 w-16">Add node:</span>
          <input
            type="number"
            placeholder="X"
            value={newNodeX}
            onChange={(e) => setNewNodeX(e.target.value)}
            step="0.1"
            className="flex-1 px-3 py-2 text-sm font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-structura-primary"
          />
          <input
            type="number"
            placeholder="Y"
            value={newNodeY}
            onChange={(e) => setNewNodeY(e.target.value)}
            step="0.1"
            className="flex-1 px-3 py-2 text-sm font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-structura-primary"
          />
          <button
            onClick={handleAddNode}
            disabled={!newNodeX || !newNodeY}
            className="px-4 py-2 bg-structura-primary hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
