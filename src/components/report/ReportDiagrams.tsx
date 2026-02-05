/**
 * ReportDiagrams - SVG-based force and moment diagrams
 * 
 * Renders static SVG diagrams for print/PDF output.
 */

import React from 'react';
import type { MemberResult, DiagramPoint } from '@/types/analysis';
import type { StructuralModel } from '@/types';

interface ReportDiagramsProps {
  memberResults: MemberResult[];
  model: StructuralModel;
}

export function ReportDiagrams({ memberResults, model }: ReportDiagramsProps) {
  const { nodes, members } = model;

  // Get member info
  const getMemberInfo = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return null;
    
    const startNode = nodes.find(n => n.id === member.startNodeId);
    const endNode = nodes.find(n => n.id === member.endNodeId);
    if (!startNode || !endNode) return null;

    const dx = endNode.x - startNode.x;
    const dy = endNode.y - startNode.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    return { member, startNode, endNode, length };
  };

  // Find max values for all diagrams
  const maxValues = {
    axial: Math.max(
      1,
      ...memberResults.flatMap(r => r.diagrams.axial.map(p => Math.abs(p.value)))
    ),
    shear: Math.max(
      1,
      ...memberResults.flatMap(r => r.diagrams.shear.map(p => Math.abs(p.value)))
    ),
    moment: Math.max(
      1,
      ...memberResults.flatMap(r => r.diagrams.moment.map(p => Math.abs(p.value)))
    ),
  };

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
        4. Force Diagrams
      </h2>

      {memberResults.map(result => {
        const info = getMemberInfo(result.memberId);
        if (!info) return null;

        return (
          <div key={result.memberId} className="mb-8 break-inside-avoid">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Member {result.memberId}
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({info.member.startNodeId} → {info.member.endNodeId}, L = {info.length.toFixed(3)} m, {info.member.type})
              </span>
            </h3>

            <div className="grid grid-cols-1 gap-4">
              {/* Axial Force Diagram */}
              {result.diagrams.axial.length > 0 && (
                <DiagramSVG
                  title="Axial Force (N)"
                  unit="kN"
                  points={result.diagrams.axial}
                  length={info.length}
                  maxValue={maxValues.axial}
                  color="#dc2626"
                  fillColor="#fecaca"
                />
              )}

              {/* Shear Force Diagram */}
              {result.diagrams.shear.length > 0 && (
                <DiagramSVG
                  title="Shear Force (V)"
                  unit="kN"
                  points={result.diagrams.shear}
                  length={info.length}
                  maxValue={maxValues.shear}
                  color="#2563eb"
                  fillColor="#bfdbfe"
                />
              )}

              {/* Bending Moment Diagram */}
              {result.diagrams.moment.length > 0 && (
                <DiagramSVG
                  title="Bending Moment (M)"
                  unit="kN·m"
                  points={result.diagrams.moment}
                  length={info.length}
                  maxValue={maxValues.moment}
                  color="#16a34a"
                  fillColor="#bbf7d0"
                />
              )}
            </div>

            {/* Diagram values table */}
            <div className="mt-4">
              <DiagramValuesTable
                axial={result.diagrams.axial}
                shear={result.diagrams.shear}
                moment={result.diagrams.moment}
                length={info.length}
              />
            </div>
          </div>
        );
      })}
    </section>
  );
}

interface DiagramSVGProps {
  title: string;
  unit: string;
  points: DiagramPoint[];
  length: number;
  maxValue: number;
  color: string;
  fillColor: string;
}

function DiagramSVG({ title, unit, points, length, maxValue, color, fillColor }: DiagramSVGProps) {
  if (points.length === 0) return null;

  // SVG dimensions
  const width = 600;
  const height = 150;
  const padding = { top: 30, right: 60, bottom: 30, left: 60 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Scale functions
  const xScale = (x: number) => padding.left + (x / length) * plotWidth;
  const yScale = (value: number) => {
    const normalized = value / (maxValue * 1.2);
    return padding.top + plotHeight / 2 - normalized * (plotHeight / 2);
  };

  // Build path for filled polygon
  const buildPath = () => {
    if (points.length === 0) return '';
    
    const baseline = yScale(0);
    let path = `M ${xScale(points[0]!.x)} ${baseline}`;
    
    // Line to first point
    path += ` L ${xScale(points[0]!.x)} ${yScale(points[0]!.value)}`;
    
    // Connect all points
    for (let i = 1; i < points.length; i++) {
      path += ` L ${xScale(points[i]!.x)} ${yScale(points[i]!.value)}`;
    }
    
    // Close back to baseline
    path += ` L ${xScale(points[points.length - 1]!.x)} ${baseline}`;
    path += ' Z';
    
    return path;
  };

  // Build line path only
  const buildLinePath = () => {
    if (points.length === 0) return '';
    
    let path = `M ${xScale(points[0]!.x)} ${yScale(points[0]!.value)}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${xScale(points[i]!.x)} ${yScale(points[i]!.value)}`;
    }
    return path;
  };

  // Find max and min values for labels
  const maxPoint = points.reduce((max, p) => Math.abs(p.value) > Math.abs(max.value) ? p : max, points[0]!);
  const startValue = points[0]!.value;
  const endValue = points[points.length - 1]!.value;

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white">
      <p className="text-sm font-medium text-gray-700 mb-2">{title}</p>
      <svg width={width} height={height} className="block mx-auto">
        {/* Background */}
        <rect
          x={padding.left}
          y={padding.top}
          width={plotWidth}
          height={plotHeight}
          fill="#fafafa"
          stroke="#e5e7eb"
        />

        {/* Grid lines */}
        <line
          x1={padding.left}
          y1={yScale(0)}
          x2={padding.left + plotWidth}
          y2={yScale(0)}
          stroke="#9ca3af"
          strokeWidth={1}
          strokeDasharray="4,2"
        />

        {/* Member baseline */}
        <line
          x1={padding.left}
          y1={yScale(0)}
          x2={padding.left + plotWidth}
          y2={yScale(0)}
          stroke="#374151"
          strokeWidth={2}
        />

        {/* Filled diagram area */}
        <path
          d={buildPath()}
          fill={fillColor}
          fillOpacity={0.5}
        />

        {/* Diagram line */}
        <path
          d={buildLinePath()}
          fill="none"
          stroke={color}
          strokeWidth={2}
        />

        {/* End markers */}
        <circle cx={padding.left} cy={yScale(0)} r={4} fill="#374151" />
        <circle cx={padding.left + plotWidth} cy={yScale(0)} r={4} fill="#374151" />

        {/* Value labels */}
        {/* Start value */}
        <text
          x={padding.left - 5}
          y={yScale(startValue)}
          textAnchor="end"
          dominantBaseline="middle"
          className="text-xs"
          fill={color}
        >
          {startValue.toFixed(2)}
        </text>

        {/* End value */}
        <text
          x={padding.left + plotWidth + 5}
          y={yScale(endValue)}
          textAnchor="start"
          dominantBaseline="middle"
          className="text-xs"
          fill={color}
        >
          {endValue.toFixed(2)}
        </text>

        {/* Max value label (if different from ends) */}
        {Math.abs(maxPoint.value) > Math.max(Math.abs(startValue), Math.abs(endValue)) * 1.1 && (
          <>
            <circle
              cx={xScale(maxPoint.x)}
              cy={yScale(maxPoint.value)}
              r={3}
              fill={color}
            />
            <text
              x={xScale(maxPoint.x)}
              y={yScale(maxPoint.value) - 8}
              textAnchor="middle"
              className="text-xs font-medium"
              fill={color}
            >
              {maxPoint.value.toFixed(2)} {unit}
            </text>
          </>
        )}

        {/* Axis labels */}
        <text
          x={padding.left}
          y={height - 5}
          textAnchor="middle"
          className="text-xs"
          fill="#6b7280"
        >
          0
        </text>
        <text
          x={padding.left + plotWidth}
          y={height - 5}
          textAnchor="middle"
          className="text-xs"
          fill="#6b7280"
        >
          {length.toFixed(2)} m
        </text>

        {/* Unit label */}
        <text
          x={width - 5}
          y={padding.top}
          textAnchor="end"
          className="text-xs"
          fill="#6b7280"
        >
          [{unit}]
        </text>
      </svg>
    </div>
  );
}

interface DiagramValuesTableProps {
  axial: DiagramPoint[];
  shear: DiagramPoint[];
  moment: DiagramPoint[];
  length: number; // Keep for reference but mark as used
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function DiagramValuesTable({ axial, shear, moment, length: _length }: DiagramValuesTableProps) {
  // Get key points: start, max, mid, end
  const getKeyValues = (points: DiagramPoint[]) => {
    if (points.length === 0) return { start: 0, mid: 0, end: 0, max: 0, maxX: 0 };
    
    const start = points[0]!.value;
    const end = points[points.length - 1]!.value;
    const midIndex = Math.floor(points.length / 2);
    const mid = points[midIndex]!.value;
    const maxPoint = points.reduce((max, p) => Math.abs(p.value) > Math.abs(max.value) ? p : max, points[0]!);
    
    return { start, mid, end, max: maxPoint.value, maxX: maxPoint.x };
  };

  const axialValues = getKeyValues(axial);
  const shearValues = getKeyValues(shear);
  const momentValues = getKeyValues(moment);

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="bg-gray-50">
          <th className="border border-gray-300 px-3 py-2 text-left">Location</th>
          <th className="border border-gray-300 px-3 py-2 text-right">N (kN)</th>
          <th className="border border-gray-300 px-3 py-2 text-right">V (kN)</th>
          <th className="border border-gray-300 px-3 py-2 text-right">M (kN·m)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border border-gray-300 px-3 py-2">Start (x=0)</td>
          <td className="border border-gray-300 px-3 py-2 text-right font-mono">
            {axialValues.start.toFixed(3)}
          </td>
          <td className="border border-gray-300 px-3 py-2 text-right font-mono">
            {shearValues.start.toFixed(3)}
          </td>
          <td className="border border-gray-300 px-3 py-2 text-right font-mono">
            {momentValues.start.toFixed(3)}
          </td>
        </tr>
        <tr>
          <td className="border border-gray-300 px-3 py-2">Mid (x=L/2)</td>
          <td className="border border-gray-300 px-3 py-2 text-right font-mono">
            {axialValues.mid.toFixed(3)}
          </td>
          <td className="border border-gray-300 px-3 py-2 text-right font-mono">
            {shearValues.mid.toFixed(3)}
          </td>
          <td className="border border-gray-300 px-3 py-2 text-right font-mono">
            {momentValues.mid.toFixed(3)}
          </td>
        </tr>
        <tr>
          <td className="border border-gray-300 px-3 py-2">End (x=L)</td>
          <td className="border border-gray-300 px-3 py-2 text-right font-mono">
            {axialValues.end.toFixed(3)}
          </td>
          <td className="border border-gray-300 px-3 py-2 text-right font-mono">
            {shearValues.end.toFixed(3)}
          </td>
          <td className="border border-gray-300 px-3 py-2 text-right font-mono">
            {momentValues.end.toFixed(3)}
          </td>
        </tr>
        <tr className="bg-yellow-50 font-medium">
          <td className="border border-gray-300 px-3 py-2">
            Max (x={momentValues.maxX.toFixed(2)}m)
          </td>
          <td className="border border-gray-300 px-3 py-2 text-right font-mono">
            {axialValues.max.toFixed(3)}
          </td>
          <td className="border border-gray-300 px-3 py-2 text-right font-mono">
            {shearValues.max.toFixed(3)}
          </td>
          <td className="border border-gray-300 px-3 py-2 text-right font-mono">
            {momentValues.max.toFixed(3)}
          </td>
        </tr>
      </tbody>
    </table>
  );
}
