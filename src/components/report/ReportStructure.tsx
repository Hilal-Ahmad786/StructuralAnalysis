/**
 * ReportStructure - SVG visualization of the structural model
 * 
 * Static SVG rendering for print/PDF output.
 */

import React from 'react';
import type { StructuralModel, LoadCase } from '@/types';

interface ReportStructureProps {
  model: StructuralModel;
  loadCase?: LoadCase | undefined;
}

export function ReportStructure({ model, loadCase }: ReportStructureProps) {
  const { nodes, members, supports } = model;

  // Calculate bounds
  const xs = nodes.map(n => n.x);
  const ys = nodes.map(n => n.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  // SVG dimensions
  const width = 700;
  const height = 400;
  const padding = 60;

  // Scale to fit
  const scaleX = (width - 2 * padding) / spanX;
  const scaleY = (height - 2 * padding) / spanY;
  const scale = Math.min(scaleX, scaleY) * 0.85;

  // Transform functions (flip Y axis)
  const tx = (x: number) => width / 2 + (x - centerX) * scale;
  const ty = (y: number) => height / 2 - (y - centerY) * scale;

  // Get support type label
  const getSupportSymbol = (nodeId: string) => {
    const support = supports.find(s => s.nodeId === nodeId);
    if (!support) return null;
    
    if (support.dx && support.dy && support.rz) return 'fixed';
    if (support.dx && support.dy) return 'pinned';
    if (support.dy) return 'roller-y';
    if (support.dx) return 'roller-x';
    return 'custom';
  };

  // Arrow size for loads
  const arrowSize = 30;

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
        Structure Overview
      </h2>

      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <svg width={width} height={height} className="block mx-auto">
          {/* Background */}
          <rect width={width} height={height} fill="#fafafa" />
          
          {/* Grid */}
          <g stroke="#e5e7eb" strokeWidth={0.5}>
            {Array.from({ length: 11 }, (_, i) => (
              <React.Fragment key={`grid-${i}`}>
                <line x1={0} y1={i * height / 10} x2={width} y2={i * height / 10} />
                <line x1={i * width / 10} y1={0} x2={i * width / 10} y2={height} />
              </React.Fragment>
            ))}
          </g>

          {/* Members */}
          {members.map(member => {
            const startNode = nodes.find(n => n.id === member.startNodeId);
            const endNode = nodes.find(n => n.id === member.endNodeId);
            if (!startNode || !endNode) return null;

            return (
              <line
                key={member.id}
                x1={tx(startNode.x)}
                y1={ty(startNode.y)}
                x2={tx(endNode.x)}
                y2={ty(endNode.y)}
                stroke={member.type === 'frame' ? '#2563eb' : '#059669'}
                strokeWidth={member.type === 'frame' ? 4 : 3}
                strokeLinecap="round"
              />
            );
          })}

          {/* Member labels */}
          {members.map(member => {
            const startNode = nodes.find(n => n.id === member.startNodeId);
            const endNode = nodes.find(n => n.id === member.endNodeId);
            if (!startNode || !endNode) return null;

            const midX = (tx(startNode.x) + tx(endNode.x)) / 2;
            const midY = (ty(startNode.y) + ty(endNode.y)) / 2;

            return (
              <text
                key={`label-${member.id}`}
                x={midX}
                y={midY - 8}
                textAnchor="middle"
                className="text-xs"
                fill="#6b7280"
              >
                {member.id}
              </text>
            );
          })}

          {/* Supports */}
          {nodes.map(node => {
            const supportType = getSupportSymbol(node.id);
            if (!supportType) return null;

            const x = tx(node.x);
            const y = ty(node.y);

            return (
              <g key={`support-${node.id}`}>
                {supportType === 'fixed' && (
                  <>
                    <rect
                      x={x - 15}
                      y={y}
                      width={30}
                      height={8}
                      fill="#374151"
                    />
                    {/* Hatch marks */}
                    {[-10, -5, 0, 5, 10].map((dx, i) => (
                      <line
                        key={i}
                        x1={x + dx}
                        y1={y + 8}
                        x2={x + dx - 5}
                        y2={y + 15}
                        stroke="#374151"
                        strokeWidth={1}
                      />
                    ))}
                  </>
                )}
                {supportType === 'pinned' && (
                  <polygon
                    points={`${x},${y} ${x - 12},${y + 18} ${x + 12},${y + 18}`}
                    fill="none"
                    stroke="#374151"
                    strokeWidth={2}
                  />
                )}
                {supportType === 'roller-y' && (
                  <>
                    <polygon
                      points={`${x},${y} ${x - 10},${y + 15} ${x + 10},${y + 15}`}
                      fill="none"
                      stroke="#374151"
                      strokeWidth={2}
                    />
                    <circle cx={x} cy={y + 20} r={4} fill="none" stroke="#374151" strokeWidth={2} />
                  </>
                )}
                {supportType === 'roller-x' && (
                  <>
                    <polygon
                      points={`${x},${y} ${x + 15},${y - 10} ${x + 15},${y + 10}`}
                      fill="none"
                      stroke="#374151"
                      strokeWidth={2}
                    />
                    <circle cx={x + 20} cy={y} r={4} fill="none" stroke="#374151" strokeWidth={2} />
                  </>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map(node => (
            <g key={node.id}>
              <circle
                cx={tx(node.x)}
                cy={ty(node.y)}
                r={6}
                fill="#1f2937"
                stroke="white"
                strokeWidth={2}
              />
              <text
                x={tx(node.x)}
                y={ty(node.y) - 12}
                textAnchor="middle"
                className="text-xs font-medium"
                fill="#1f2937"
              >
                {node.id}
              </text>
            </g>
          ))}

          {/* Loads */}
          {loadCase?.loads.map(load => {
            if (load.target === 'node') {
              const node = nodes.find(n => n.id === load.targetId);
              if (!node) return null;

              const x = tx(node.x);
              const y = ty(node.y);
              const arrows: React.ReactNode[] = [];

              // Fx arrow
              if (load.fx && Math.abs(load.fx) > 0.001) {
                const dir = load.fx > 0 ? 1 : -1;
                arrows.push(
                  <g key={`${load.id}-fx`}>
                    <line
                      x1={x - dir * arrowSize}
                      y1={y}
                      x2={x}
                      y2={y}
                      stroke="#dc2626"
                      strokeWidth={2}
                      markerEnd="url(#arrowhead)"
                    />
                    <text
                      x={x - dir * arrowSize / 2}
                      y={y - 8}
                      textAnchor="middle"
                      className="text-xs"
                      fill="#dc2626"
                    >
                      {Math.abs(load.fx).toFixed(1)}
                    </text>
                  </g>
                );
              }

              // Fy arrow
              if (load.fy && Math.abs(load.fy) > 0.001) {
                const dir = load.fy > 0 ? -1 : 1; // Flip for Y
                arrows.push(
                  <g key={`${load.id}-fy`}>
                    <line
                      x1={x}
                      y1={y + dir * arrowSize}
                      x2={x}
                      y2={y}
                      stroke="#dc2626"
                      strokeWidth={2}
                      markerEnd="url(#arrowhead)"
                    />
                    <text
                      x={x + 8}
                      y={y + dir * arrowSize / 2}
                      textAnchor="start"
                      className="text-xs"
                      fill="#dc2626"
                    >
                      {Math.abs(load.fy).toFixed(1)}
                    </text>
                  </g>
                );
              }

              // Mz arc
              if (load.mz && Math.abs(load.mz) > 0.001) {
                const r = 15;
                const sweepFlag = load.mz > 0 ? 1 : 0;
                
                arrows.push(
                  <g key={`${load.id}-mz`}>
                    <path
                      d={`M ${x + r} ${y} A ${r} ${r} 0 1 ${sweepFlag} ${x} ${y - r}`}
                      fill="none"
                      stroke="#7c3aed"
                      strokeWidth={2}
                      markerEnd="url(#arrowhead-moment)"
                    />
                    <text
                      x={x}
                      y={y - r - 5}
                      textAnchor="middle"
                      className="text-xs"
                      fill="#7c3aed"
                    >
                      {Math.abs(load.mz).toFixed(1)}
                    </text>
                  </g>
                );
              }

              return <g key={load.id}>{arrows}</g>;
            }

            // Distributed load
            if (load.target === 'member' && load.w) {
              const member = members.find(m => m.id === load.targetId);
              if (!member) return null;

              const startNode = nodes.find(n => n.id === member.startNodeId);
              const endNode = nodes.find(n => n.id === member.endNodeId);
              if (!startNode || !endNode) return null;

              const x1 = tx(startNode.x);
              const y1 = ty(startNode.y);
              const x2 = tx(endNode.x);
              const y2 = ty(endNode.y);

              // Draw small arrows along member
              const numArrows = 5;
              const arrowLen = 20;
              const dir = load.w > 0 ? -1 : 1;

              return (
                <g key={load.id}>
                  {Array.from({ length: numArrows }, (_, i) => {
                    const t = (i + 0.5) / numArrows;
                    const ax = x1 + t * (x2 - x1);
                    const ay = y1 + t * (y2 - y1);
                    
                    return (
                      <line
                        key={i}
                        x1={ax}
                        y1={ay + dir * arrowLen}
                        x2={ax}
                        y2={ay}
                        stroke="#f97316"
                        strokeWidth={1.5}
                        markerEnd="url(#arrowhead-dist)"
                      />
                    );
                  })}
                  <text
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2 + dir * arrowLen + dir * 12}
                    textAnchor="middle"
                    className="text-xs"
                    fill="#f97316"
                  >
                    w={Math.abs(load.w).toFixed(1)} kN/m
                  </text>
                </g>
              );
            }

            return null;
          })}

          {/* Arrow markers */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#dc2626" />
            </marker>
            <marker
              id="arrowhead-moment"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#7c3aed" />
            </marker>
            <marker
              id="arrowhead-dist"
              markerWidth="6"
              markerHeight="5"
              refX="5"
              refY="2.5"
              orient="auto"
            >
              <polygon points="0 0, 6 2.5, 0 5" fill="#f97316" />
            </marker>
          </defs>

          {/* Scale bar */}
          <g transform={`translate(${padding}, ${height - 25})`}>
            <line x1={0} y1={0} x2={50 * scale} y2={0} stroke="#374151" strokeWidth={2} />
            <line x1={0} y1={-5} x2={0} y2={5} stroke="#374151" strokeWidth={2} />
            <line x1={50 * scale} y1={-5} x2={50 * scale} y2={5} stroke="#374151" strokeWidth={2} />
            <text x={25 * scale} y={15} textAnchor="middle" className="text-xs" fill="#374151">
              {(50 / scale).toFixed(1) !== 'Infinity' ? `${(50 / scale).toFixed(1)} m` : '1 m'}
            </text>
          </g>

          {/* Legend */}
          <g transform={`translate(${width - 150}, ${height - 60})`}>
            <rect x={0} y={0} width={140} height={50} fill="white" stroke="#e5e7eb" rx={4} />
            <line x1={10} y1={15} x2={30} y2={15} stroke="#2563eb" strokeWidth={4} />
            <text x={35} y={18} className="text-xs" fill="#374151">Frame</text>
            <line x1={80} y1={15} x2={100} y2={15} stroke="#059669" strokeWidth={3} />
            <text x={105} y={18} className="text-xs" fill="#374151">Truss</text>
            <circle cx={20} cy={35} r={5} fill="#1f2937" />
            <text x={35} y={38} className="text-xs" fill="#374151">Node</text>
          </g>
        </svg>

        {/* Coordinate info */}
        <p className="text-xs text-gray-500 mt-2 text-center">
          Coordinate range: X [{minX.toFixed(1)}, {maxX.toFixed(1)}] m, Y [{minY.toFixed(1)}, {maxY.toFixed(1)}] m
        </p>
      </div>
    </section>
  );
}
