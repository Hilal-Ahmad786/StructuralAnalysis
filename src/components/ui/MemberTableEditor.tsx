/**
 * MemberTableEditor - Spreadsheet-style editor for members
 *
 * Allows bulk editing of member properties in a table format.
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useModelStore } from '@/stores/modelStore';
import type { MemberType } from '@/types';

export function MemberTableEditor(): React.JSX.Element {
  const { model, updateMember, deleteMember, addMember } = useModelStore();
  const [filter, setFilter] = useState('');
  const [sortField, setSortField] = useState<'id' | 'type' | 'length'>('id');
  const [sortAsc, setSortAsc] = useState(true);
  const [newMemberStart, setNewMemberStart] = useState('');
  const [newMemberEnd, setNewMemberEnd] = useState('');
  const [newMemberType, setNewMemberType] = useState<MemberType>('frame');

  // Calculate member lengths
  const getMemberLength = useCallback(
    (startNodeId: string, endNodeId: string) => {
      const startNode = model.nodes.find((n) => n.id === startNodeId);
      const endNode = model.nodes.find((n) => n.id === endNodeId);
      if (!startNode || !endNode) return 0;
      return Math.sqrt(
        Math.pow(endNode.x - startNode.x, 2) + Math.pow(endNode.y - startNode.y, 2)
      );
    },
    [model.nodes]
  );

  // Sort and filter members
  const sortedMembers = useMemo(() => {
    let members = model.members.map((m) => ({
      ...m,
      length: getMemberLength(m.startNodeId, m.endNodeId),
    }));

    // Filter
    if (filter) {
      const lowerFilter = filter.toLowerCase();
      members = members.filter(
        (m) =>
          m.id.toLowerCase().includes(lowerFilter) ||
          m.type.toLowerCase().includes(lowerFilter) ||
          m.startNodeId.toLowerCase().includes(lowerFilter) ||
          m.endNodeId.toLowerCase().includes(lowerFilter)
      );
    }

    // Sort
    members.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'id') {
        cmp = a.id.localeCompare(b.id, undefined, { numeric: true });
      } else if (sortField === 'type') {
        cmp = a.type.localeCompare(b.type);
      } else if (sortField === 'length') {
        cmp = a.length - b.length;
      }
      return sortAsc ? cmp : -cmp;
    });

    return members;
  }, [model.members, getMemberLength, sortField, sortAsc, filter]);

  const handleSort = useCallback((field: 'id' | 'type' | 'length') => {
    setSortField((prev) => {
      if (prev === field) {
        setSortAsc((asc) => !asc);
        return field;
      }
      setSortAsc(true);
      return field;
    });
  }, []);

  const handleDeleteMember = useCallback(
    (memberId: string) => {
      if (confirm(`Delete member ${memberId}?`)) {
        deleteMember(memberId);
      }
    },
    [deleteMember]
  );

  const handleTypeChange = useCallback(
    (memberId: string, newType: MemberType) => {
      updateMember(memberId, { type: newType });
    },
    [updateMember]
  );

  const handleMaterialChange = useCallback(
    (memberId: string, materialId: string) => {
      updateMember(memberId, { materialId });
    },
    [updateMember]
  );

  const handleSectionChange = useCallback(
    (memberId: string, sectionId: string) => {
      updateMember(memberId, { sectionId });
    },
    [updateMember]
  );

  const handleAddMember = useCallback(() => {
    if (!newMemberStart || !newMemberEnd) return;
    if (newMemberStart === newMemberEnd) {
      alert('Start and end nodes must be different');
      return;
    }

    const startNode = model.nodes.find((n) => n.id === newMemberStart);
    const endNode = model.nodes.find((n) => n.id === newMemberEnd);

    if (!startNode || !endNode) {
      alert('Invalid node IDs');
      return;
    }

    addMember(newMemberStart, newMemberEnd, newMemberType);
    setNewMemberStart('');
    setNewMemberEnd('');
  }, [newMemberStart, newMemberEnd, newMemberType, model.nodes, addMember]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px] text-green-500">line_end</span>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Member Table</h3>
            <p className="text-xs text-slate-500">{model.members.length} members</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-700">
        <input
          type="text"
          placeholder="Filter members..."
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
                className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-400 cursor-pointer hover:text-structura-primary"
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
                className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-400 cursor-pointer hover:text-structura-primary"
                onClick={() => handleSort('type')}
              >
                <span className="flex items-center gap-1">
                  Type
                  {sortField === 'type' && (
                    <span className="material-symbols-outlined text-[14px]">
                      {sortAsc ? 'arrow_upward' : 'arrow_downward'}
                    </span>
                  )}
                </span>
              </th>
              <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-400">
                Start
              </th>
              <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-400">
                End
              </th>
              <th
                className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-400 cursor-pointer hover:text-structura-primary"
                onClick={() => handleSort('length')}
              >
                <span className="flex items-center gap-1">
                  Length
                  {sortField === 'length' && (
                    <span className="material-symbols-outlined text-[14px]">
                      {sortAsc ? 'arrow_upward' : 'arrow_downward'}
                    </span>
                  )}
                </span>
              </th>
              <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-400">
                Material
              </th>
              <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-400">
                Section
              </th>
              <th className="px-3 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {sortedMembers.map((member) => (
              <tr
                key={member.id}
                className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-300">
                  {member.id}
                </td>
                <td className="px-3 py-2">
                  <select
                    value={member.type}
                    onChange={(e) => handleTypeChange(member.id, e.target.value as MemberType)}
                    className="px-2 py-1 text-xs bg-transparent border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-structura-primary"
                  >
                    <option value="frame">Frame</option>
                    <option value="truss">Truss</option>
                  </select>
                </td>
                <td className="px-3 py-2 font-mono text-xs text-slate-600 dark:text-slate-400">
                  {member.startNodeId}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-slate-600 dark:text-slate-400">
                  {member.endNodeId}
                </td>
                <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-300">
                  {member.length.toFixed(3)} m
                </td>
                <td className="px-3 py-2">
                  <select
                    value={member.materialId}
                    onChange={(e) => handleMaterialChange(member.id, e.target.value)}
                    className="px-2 py-1 text-xs bg-transparent border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-structura-primary max-w-[100px]"
                  >
                    {model.materials.map((mat) => (
                      <option key={mat.id} value={mat.id}>
                        {mat.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <select
                    value={member.sectionId}
                    onChange={(e) => handleSectionChange(member.id, e.target.value)}
                    className="px-2 py-1 text-xs bg-transparent border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-structura-primary max-w-[100px]"
                  >
                    {model.sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => handleDeleteMember(member.id)}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    title="Delete member"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sortedMembers.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            {filter ? 'No members match filter' : 'No members yet'}
          </div>
        )}
      </div>

      {/* Add Member Row */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Add:</span>
          <select
            value={newMemberStart}
            onChange={(e) => setNewMemberStart(e.target.value)}
            className="flex-1 px-2 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-structura-primary"
          >
            <option value="">Start node</option>
            {model.nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.id}
              </option>
            ))}
          </select>
          <select
            value={newMemberEnd}
            onChange={(e) => setNewMemberEnd(e.target.value)}
            className="flex-1 px-2 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-structura-primary"
          >
            <option value="">End node</option>
            {model.nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.id}
              </option>
            ))}
          </select>
          <select
            value={newMemberType}
            onChange={(e) => setNewMemberType(e.target.value as MemberType)}
            className="px-2 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-structura-primary"
          >
            <option value="frame">Frame</option>
            <option value="truss">Truss</option>
          </select>
          <button
            onClick={handleAddMember}
            disabled={!newMemberStart || !newMemberEnd}
            className="px-4 py-2 bg-structura-primary hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
