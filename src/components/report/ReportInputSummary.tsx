/**
 * ReportInputSummary - Model input data summary
 * 
 * Shows nodes, members, materials, sections, and supports tables.
 */

import React from 'react';
import type { StructuralModel } from '@/types';

interface ReportInputSummaryProps {
  model: StructuralModel;
}

export function ReportInputSummary({ model }: ReportInputSummaryProps) {
  const { nodes, members, materials, sections, supports } = model;

  // Calculate member lengths
  const getMemberLength = (startNodeId: string, endNodeId: string) => {
    const startNode = nodes.find(n => n.id === startNodeId);
    const endNode = nodes.find(n => n.id === endNodeId);
    if (!startNode || !endNode) return 0;
    const dx = endNode.x - startNode.x;
    const dy = endNode.y - startNode.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getSupportType = (support: StructuralModel['supports'][0]) => {
    if (support.dx && support.dy && support.rz) return 'Fixed';
    if (support.dx && support.dy && !support.rz) return 'Pinned';
    if (!support.dx && support.dy && !support.rz) return 'Roller (Y)';
    if (support.dx && !support.dy && !support.rz) return 'Roller (X)';
    return 'Custom';
  };

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
        1. Model Input Summary
      </h2>

      {/* Statistics */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <StatBox label="Nodes" value={nodes.length} />
        <StatBox label="Members" value={members.length} />
        <StatBox label="Supports" value={supports.length} />
        <StatBox label="Materials" value={materials.length} />
        <StatBox label="Sections" value={sections.length} />
      </div>

      {/* Nodes Table */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">1.1 Nodes</h3>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left">Node ID</th>
              <th className="border border-gray-300 px-3 py-2 text-right">X (m)</th>
              <th className="border border-gray-300 px-3 py-2 text-right">Y (m)</th>
            </tr>
          </thead>
          <tbody>
            {nodes.map(node => (
              <tr key={node.id}>
                <td className="border border-gray-300 px-3 py-2 font-mono">{node.id}</td>
                <td className="border border-gray-300 px-3 py-2 text-right">{node.x.toFixed(3)}</td>
                <td className="border border-gray-300 px-3 py-2 text-right">{node.y.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Members Table */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">1.2 Members</h3>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left">Member ID</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Type</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Start Node</th>
              <th className="border border-gray-300 px-3 py-2 text-left">End Node</th>
              <th className="border border-gray-300 px-3 py-2 text-right">Length (m)</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Material</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Section</th>
            </tr>
          </thead>
          <tbody>
            {members.map(member => {
              const material = materials.find(m => m.id === member.materialId);
              const section = sections.find(s => s.id === member.sectionId);
              const length = getMemberLength(member.startNodeId, member.endNodeId);
              return (
                <tr key={member.id}>
                  <td className="border border-gray-300 px-3 py-2 font-mono">{member.id}</td>
                  <td className="border border-gray-300 px-3 py-2 capitalize">{member.type}</td>
                  <td className="border border-gray-300 px-3 py-2 font-mono">{member.startNodeId}</td>
                  <td className="border border-gray-300 px-3 py-2 font-mono">{member.endNodeId}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right">{length.toFixed(3)}</td>
                  <td className="border border-gray-300 px-3 py-2">{material?.name || '-'}</td>
                  <td className="border border-gray-300 px-3 py-2">{section?.name || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Supports Table */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">1.3 Supports</h3>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left">Node ID</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Type</th>
              <th className="border border-gray-300 px-3 py-2 text-center">dx</th>
              <th className="border border-gray-300 px-3 py-2 text-center">dy</th>
              <th className="border border-gray-300 px-3 py-2 text-center">rz</th>
            </tr>
          </thead>
          <tbody>
            {supports.map(support => (
              <tr key={support.nodeId}>
                <td className="border border-gray-300 px-3 py-2 font-mono">{support.nodeId}</td>
                <td className="border border-gray-300 px-3 py-2">{getSupportType(support)}</td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {support.dx ? '✓' : '–'}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {support.dy ? '✓' : '–'}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {support.rz ? '✓' : '–'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Materials Table */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">1.4 Materials</h3>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left">Material</th>
              <th className="border border-gray-300 px-3 py-2 text-right">E (kPa)</th>
              <th className="border border-gray-300 px-3 py-2 text-right">E (GPa)</th>
            </tr>
          </thead>
          <tbody>
            {materials.map(material => (
              <tr key={material.id}>
                <td className="border border-gray-300 px-3 py-2">{material.name}</td>
                <td className="border border-gray-300 px-3 py-2 text-right font-mono">
                  {material.E.toExponential(3)}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-right">
                  {(material.E / 1e6).toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sections Table */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">1.5 Sections</h3>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left">Section</th>
              <th className="border border-gray-300 px-3 py-2 text-right">A (m²)</th>
              <th className="border border-gray-300 px-3 py-2 text-right">A (cm²)</th>
              <th className="border border-gray-300 px-3 py-2 text-right">I (m⁴)</th>
              <th className="border border-gray-300 px-3 py-2 text-right">I (cm⁴)</th>
            </tr>
          </thead>
          <tbody>
            {sections.map(section => (
              <tr key={section.id}>
                <td className="border border-gray-300 px-3 py-2">{section.name}</td>
                <td className="border border-gray-300 px-3 py-2 text-right font-mono">
                  {section.A.toExponential(3)}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-right">
                  {(section.A * 1e4).toFixed(2)}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-right font-mono">
                  {section.I.toExponential(3)}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-right">
                  {(section.I * 1e8).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}
