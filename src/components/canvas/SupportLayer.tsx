/**
 * SupportLayer - Renders support symbols (fixed, pinned, roller)
 */

'use client';

import React from 'react';
import { Group, Line, Circle, RegularPolygon } from 'react-konva';
import type { Support, Node } from '@/types';
import { useModelStore } from '@/stores/modelStore';

interface SupportLayerProps {
  supports: Support[];
  nodes: Node[];
}

export function SupportLayer({ supports, nodes }: SupportLayerProps) {
  const { selection, view } = useModelStore();
  const scale = 1 / view.zoom;
  const baseSize = 20 * scale;
  
  const getNode = (id: string) => nodes.find((n) => n.id === id);
  
  // Determine support type from restraints
  const getSupportType = (support: Support): 'fixed' | 'pinned' | 'rollerX' | 'rollerY' => {
    if (support.dx && support.dy && support.rz) return 'fixed';
    if (support.dx && support.dy && !support.rz) return 'pinned';
    if (!support.dx && support.dy && !support.rz) return 'rollerX';
    if (support.dx && !support.dy && !support.rz) return 'rollerY';
    return 'pinned'; // Default
  };
  
  return (
    <Group>
      {supports.map((support) => {
        const node = getNode(support.nodeId);
        if (!node) return null;
        
        const type = getSupportType(support);
        const isSelected = selection.some((s) => s.type === 'support' && s.id === support.nodeId);
        const color = isSelected ? '#00d9ff' : '#ff6b6b';
        const x = node.x;
        const y = -node.y; // Flip Y
        
        return (
          <Group key={support.nodeId}>
            {type === 'fixed' && (
              <FixedSupport x={x} y={y} size={baseSize} color={color} />
            )}
            {type === 'pinned' && (
              <PinnedSupport x={x} y={y} size={baseSize} color={color} />
            )}
            {type === 'rollerX' && (
              <RollerSupport x={x} y={y} size={baseSize} color={color} rotation={0} />
            )}
            {type === 'rollerY' && (
              <RollerSupport x={x} y={y} size={baseSize} color={color} rotation={90} />
            )}
          </Group>
        );
      })}
    </Group>
  );
}

// Fixed support - filled rectangle with hatching
function FixedSupport({ x, y, size, color }: { x: number; y: number; size: number; color: string }) {
  const hatchLines = [];
  const hatchCount = 5;
  const hatchSpacing = size / hatchCount;
  
  for (let i = 0; i < hatchCount; i++) {
    hatchLines.push(
      <Line
        key={i}
        points={[
          x - size / 2 + i * hatchSpacing, y + size * 0.1,
          x - size / 2 + i * hatchSpacing - size * 0.3, y + size * 0.5,
        ]}
        stroke={color}
        strokeWidth={size * 0.04}
        listening={false}
      />
    );
  }
  
  return (
    <Group>
      {/* Base line */}
      <Line
        points={[x - size / 2, y, x + size / 2, y]}
        stroke={color}
        strokeWidth={size * 0.12}
        listening={false}
      />
      {/* Hatching */}
      {hatchLines}
    </Group>
  );
}

// Pinned support - triangle
function PinnedSupport({ x, y, size, color }: { x: number; y: number; size: number; color: string }) {
  return (
    <Group>
      {/* Triangle */}
      <RegularPolygon
        x={x}
        y={y + size * 0.4}
        sides={3}
        radius={size * 0.45}
        rotation={180}
        fill="transparent"
        stroke={color}
        strokeWidth={size * 0.08}
        listening={false}
      />
      {/* Ground line */}
      <Line
        points={[x - size * 0.5, y + size * 0.65, x + size * 0.5, y + size * 0.65]}
        stroke={color}
        strokeWidth={size * 0.06}
        listening={false}
      />
      {/* Hatching under ground */}
      <Line
        points={[
          x - size * 0.4, y + size * 0.65,
          x - size * 0.5, y + size * 0.85,
        ]}
        stroke={color}
        strokeWidth={size * 0.04}
        listening={false}
      />
      <Line
        points={[
          x - size * 0.1, y + size * 0.65,
          x - size * 0.2, y + size * 0.85,
        ]}
        stroke={color}
        strokeWidth={size * 0.04}
        listening={false}
      />
      <Line
        points={[
          x + size * 0.2, y + size * 0.65,
          x + size * 0.1, y + size * 0.85,
        ]}
        stroke={color}
        strokeWidth={size * 0.04}
        listening={false}
      />
    </Group>
  );
}

// Roller support - triangle with circles
function RollerSupport({ 
  x, y, size, color, rotation 
}: { 
  x: number; y: number; size: number; color: string; rotation: number 
}) {
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  
  // For rotation, we rotate the offsets
  const rotatePoint = (px: number, py: number) => ({
    x: x + px * cos - py * sin,
    y: y + px * sin + py * cos,
  });
  
  const triOffset = rotatePoint(0, size * 0.35);
  const circleY = size * 0.6;
  const groundY = size * 0.75;
  
  return (
    <Group>
      {/* Triangle */}
      <RegularPolygon
        x={triOffset.x}
        y={triOffset.y}
        sides={3}
        radius={size * 0.35}
        rotation={180 + rotation}
        fill="transparent"
        stroke={color}
        strokeWidth={size * 0.08}
        listening={false}
      />
      
      {/* Rollers (2 circles) */}
      <Circle
        {...rotatePoint(-size * 0.2, circleY)}
        radius={size * 0.1}
        fill="transparent"
        stroke={color}
        strokeWidth={size * 0.06}
        listening={false}
      />
      <Circle
        {...rotatePoint(size * 0.2, circleY)}
        radius={size * 0.1}
        fill="transparent"
        stroke={color}
        strokeWidth={size * 0.06}
        listening={false}
      />
      
      {/* Ground line */}
      <Line
        points={[
          ...Object.values(rotatePoint(-size * 0.45, groundY)),
          ...Object.values(rotatePoint(size * 0.45, groundY)),
        ]}
        stroke={color}
        strokeWidth={size * 0.06}
        listening={false}
      />
    </Group>
  );
}
