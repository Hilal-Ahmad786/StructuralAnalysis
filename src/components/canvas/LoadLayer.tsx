/**
 * LoadLayer - Renders load arrows and distributed loads
 */

'use client';

import React from 'react';
import { Group, Line, Arrow, Text } from 'react-konva';
import type { Load } from '@/types';
import { useModelStore } from '@/stores/modelStore';

export function LoadLayer() {
  const { 
    model, 
    loadCases, 
    activeLoadCaseId, 
    selection, 
    view 
  } = useModelStore();
  
  const activeLoadCase = loadCases.find((lc) => lc.id === activeLoadCaseId) ?? loadCases[0];
  if (!activeLoadCase) return null;
  
  const scale = 1 / view.zoom;
  
  const getNode = (id: string) => model.nodes.find((n) => n.id === id);
  const getMember = (id: string) => model.members.find((m) => m.id === id);
  
  return (
    <Group>
      {activeLoadCase.loads.map((load) => {
        const isSelected = selection.some((s) => s.type === 'load' && s.id === load.id);
        const color = isSelected ? '#00d9ff' : '#ff9f43';
        
        if (load.target === 'node') {
          const node = getNode(load.targetId);
          if (!node) return null;
          
          return (
            <NodalLoadArrow
              key={load.id}
              load={load}
              x={node.x}
              y={-node.y}
              scale={scale}
              color={color}
            />
          );
        } else if (load.target === 'member') {
          const member = getMember(load.targetId);
          if (!member) return null;

          const startNode = getNode(member.startNodeId);
          const endNode = getNode(member.endNodeId);
          if (!startNode || !endNode) return null;

          if (load.type === 'point') {
            // Point load on member
            return (
              <MemberPointLoadArrow
                key={load.id}
                load={load}
                startX={startNode.x}
                startY={-startNode.y}
                endX={endNode.x}
                endY={-endNode.y}
                scale={scale}
                color={color}
              />
            );
          } else if (load.type === 'temperature') {
            // Temperature load on member
            return (
              <TemperatureLoadIndicator
                key={load.id}
                load={load}
                startX={startNode.x}
                startY={-startNode.y}
                endX={endNode.x}
                endY={-endNode.y}
                scale={scale}
                color={color}
              />
            );
          } else {
            // Distributed load on member
            return (
              <DistributedLoadArrows
                key={load.id}
                load={load}
                startX={startNode.x}
                startY={-startNode.y}
                endX={endNode.x}
                endY={-endNode.y}
                scale={scale}
                color={color}
              />
            );
          }
        }
        
        return null;
      })}
    </Group>
  );
}

// Nodal load (point load or moment)
function NodalLoadArrow({
  load,
  x,
  y,
  scale,
  color,
}: {
  load: Load;
  x: number;
  y: number;
  scale: number;
  color: string;
}) {
  const arrowLength = 40 * scale;
  const arrowWidth = 8 * scale;
  const fontSize = 11 * scale;
  
  const elements: React.ReactNode[] = [];
  
  // Horizontal force (fx)
  if (load.fx && Math.abs(load.fx) > 0.001) {
    const dir = load.fx > 0 ? 1 : -1;
    elements.push(
      <Group key="fx">
        <Arrow
          points={[x - dir * arrowLength, y, x, y]}
          fill={color}
          stroke={color}
          strokeWidth={2 * scale}
          pointerLength={arrowWidth}
          pointerWidth={arrowWidth}
          listening={false}
        />
        <Text
          x={x - dir * arrowLength * 0.5}
          y={y - fontSize * 1.5}
          text={`${Math.abs(load.fx).toFixed(1)} kN`}
          fontSize={fontSize}
          fill={color}
          align="center"
          listening={false}
        />
      </Group>
    );
  }
  
  // Vertical force (fy)
  // Standard convention: positive fy = upward force
  // In screen coords: upward = negative Y direction
  // Arrow points FROM tail TO tip, so for upward force:
  //   tail below (larger screen Y), tip at node
  if (load.fy && Math.abs(load.fy) > 0.001) {
    const dir = load.fy > 0 ? 1 : -1; // +1 for upward (tail below), -1 for downward (tail above)
    elements.push(
      <Group key="fy">
        <Arrow
          points={[x, y + dir * arrowLength, x, y]}
          fill={color}
          stroke={color}
          strokeWidth={2 * scale}
          pointerLength={arrowWidth}
          pointerWidth={arrowWidth}
          listening={false}
        />
        <Text
          x={x + fontSize * 0.5}
          y={y + dir * arrowLength * 0.5}
          text={`${Math.abs(load.fy).toFixed(1)} kN`}
          fontSize={fontSize}
          fill={color}
          listening={false}
        />
      </Group>
    );
  }
  
  // Moment (mz)
  if (load.mz && Math.abs(load.mz) > 0.001) {
    const radius = arrowLength * 0.6;
    const dir = load.mz > 0 ? 1 : -1; // CCW positive
    
    // Draw arc arrow for moment
    const arcPoints: number[] = [];
    const startAngle = dir > 0 ? 0 : Math.PI;
    const endAngle = dir > 0 ? Math.PI * 1.5 : Math.PI * 0.5;
    const steps = 20;
    
    for (let i = 0; i <= steps; i++) {
      const angle = startAngle + (endAngle - startAngle) * (i / steps);
      arcPoints.push(x + Math.cos(angle) * radius);
      arcPoints.push(y + Math.sin(angle) * radius);
    }
    
    elements.push(
      <Group key="mz">
        <Line
          points={arcPoints}
          stroke={color}
          strokeWidth={2 * scale}
          listening={false}
        />
        {/* Arrow head at end of arc */}
        <Arrow
          points={[
            arcPoints[arcPoints.length - 4]!,
            arcPoints[arcPoints.length - 3]!,
            arcPoints[arcPoints.length - 2]!,
            arcPoints[arcPoints.length - 1]!,
          ]}
          fill={color}
          stroke={color}
          strokeWidth={2 * scale}
          pointerLength={arrowWidth * 0.8}
          pointerWidth={arrowWidth * 0.8}
          listening={false}
        />
        <Text
          x={x - radius - fontSize * 2}
          y={y - fontSize * 0.5}
          text={`${Math.abs(load.mz).toFixed(1)} kN·m`}
          fontSize={fontSize}
          fill={color}
          listening={false}
        />
      </Group>
    );
  }
  
  return <Group>{elements}</Group>;
}

// Temperature load indicator on a member
function TemperatureLoadIndicator({
  load,
  startX,
  startY,
  endX,
  endY,
  scale,
  color,
}: {
  load: Load;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  scale: number;
  color: string;
}) {
  const deltaT = load.deltaT ?? 0;
  const gradT = load.gradT ?? 0;

  if (Math.abs(deltaT) < 0.001 && Math.abs(gradT) < 0.001) return null;

  const fontSize = 10 * scale;
  const lineWidth = 1.5 * scale;

  // Calculate member midpoint
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;

  // Calculate perpendicular offset for label
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const perpX = -dy / length;
  const perpY = dx / length;
  const offset = 20 * scale;

  // Build label text
  let labelText = '';
  if (Math.abs(deltaT) >= 0.001) {
    labelText += `ΔT=${deltaT > 0 ? '+' : ''}${deltaT.toFixed(0)}°C`;
  }
  if (Math.abs(gradT) >= 0.001) {
    if (labelText) labelText += ', ';
    labelText += `∇T=${gradT > 0 ? '+' : ''}${gradT.toFixed(0)}°C`;
  }

  // Temperature color: red for heating, blue for cooling
  const tempColor = deltaT > 0 ? '#ef4444' : deltaT < 0 ? '#3b82f6' : color;

  return (
    <Group>
      {/* Wavy line along member to indicate temperature */}
      <Line
        points={[startX, startY, endX, endY]}
        stroke={tempColor}
        strokeWidth={lineWidth * 2}
        dash={[8 * scale, 4 * scale]}
        listening={false}
      />

      {/* Temperature indicator icon and label */}
      <Text
        x={midX + perpX * offset}
        y={midY + perpY * offset - fontSize / 2}
        text={`🌡 ${labelText}`}
        fontSize={fontSize}
        fill={tempColor}
        listening={false}
      />
    </Group>
  );
}

// Point load on a member at specified position
function MemberPointLoadArrow({
  load,
  startX,
  startY,
  endX,
  endY,
  scale,
  color,
}: {
  load: Load;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  scale: number;
  color: string;
}) {
  const fy = load.fy ?? 0;
  if (Math.abs(fy) < 0.001) return null;

  const position = load.position ?? 0.5;
  const arrowLength = 40 * scale;
  const arrowWidth = 8 * scale;
  const fontSize = 11 * scale;

  // Calculate position along member
  const dx = endX - startX;
  const dy = endY - startY;
  const px = startX + position * dx;
  const py = startY + position * dy;

  // Determine load direction
  const direction = load.direction ?? 'globalNegY';
  let perpX = 0;
  let perpY = -1; // Default: downward in screen coords

  if (direction === 'globalY' || direction === 'globalPosY') {
    perpY = 1;
  } else if (direction === 'globalNegY') {
    perpY = -1;
  } else if (direction === 'globalPosX') {
    perpX = 1;
    perpY = 0;
  } else if (direction === 'globalNegX') {
    perpX = -1;
    perpY = 0;
  } else {
    // Local directions - perpendicular to member
    const length = Math.sqrt(dx * dx + dy * dy);
    const unitX = dx / length;
    const unitY = dy / length;
    if (direction === 'localY' || direction === 'localPosY') {
      perpX = -unitY;
      perpY = unitX;
    } else {
      perpX = unitY;
      perpY = -unitX;
    }
  }

  // Arrow points from tail to tip (tip at load position)
  // If load is negative (downward), arrow comes from above
  const dir = fy > 0 ? 1 : -1;

  return (
    <Group>
      <Arrow
        points={[
          px + perpX * arrowLength * dir,
          py + perpY * arrowLength * dir,
          px,
          py,
        ]}
        fill={color}
        stroke={color}
        strokeWidth={2 * scale}
        pointerLength={arrowWidth}
        pointerWidth={arrowWidth}
        listening={false}
      />
      <Text
        x={px + perpX * arrowLength * dir * 0.5 + fontSize * 0.5}
        y={py + perpY * arrowLength * dir * 0.5 - fontSize}
        text={`${Math.abs(fy).toFixed(1)} kN`}
        fontSize={fontSize}
        fill={color}
        listening={false}
      />
    </Group>
  );
}

// Distributed load (UDL or Trapezoidal)
function DistributedLoadArrows({
  load,
  startX,
  startY,
  endX,
  endY,
  scale,
  color,
}: {
  load: Load;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  scale: number;
  color: string;
}) {
  // Check if trapezoidal or uniform
  const isTrapezoidal = load.wStart !== undefined && load.wEnd !== undefined;
  const w1 = isTrapezoidal ? (load.wStart ?? 0) : (load.w ?? 0);
  const w2 = isTrapezoidal ? (load.wEnd ?? 0) : (load.w ?? 0);

  // Skip if no load
  if (Math.abs(w1) < 0.001 && Math.abs(w2) < 0.001) return null;

  const maxW = Math.max(Math.abs(w1), Math.abs(w2));
  const baseArrowLength = 25 * scale;
  const arrowWidth = 6 * scale;
  const fontSize = 10 * scale;

  // Calculate member direction
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const unitX = dx / length;
  const unitY = dy / length;

  // Perpendicular direction (for arrow orientation)
  let perpX = -unitY;
  let perpY = unitX;

  // Determine load direction
  const direction = load.direction ?? 'globalNegY';
  if (direction === 'globalY' || direction === 'globalPosY') {
    perpX = 0;
    perpY = 1;
  } else if (direction === 'globalNegY') {
    perpX = 0;
    perpY = -1;
  } else if (direction === 'globalPosX') {
    perpX = 1;
    perpY = 0;
  } else if (direction === 'globalNegX') {
    perpX = -1;
    perpY = 0;
  } else if (direction === 'localY' || direction === 'localPosY') {
    // Already set
  } else if (direction === 'localNegY') {
    perpX = -perpX;
    perpY = -perpY;
  }

  // Generate arrows along member
  const numArrows = Math.max(3, Math.floor(length / 0.5));
  const arrows: React.ReactNode[] = [];
  const topLinePoints: number[] = [];

  for (let i = 0; i <= numArrows; i++) {
    const t = i / numArrows;
    const ax = startX + t * dx;
    const ay = startY + t * dy;

    // Interpolate load intensity for trapezoidal
    const wAtPoint = w1 + (w2 - w1) * t;
    const arrowLengthAtPoint = (Math.abs(wAtPoint) / maxW) * baseArrowLength;

    // Only draw arrow if there's meaningful load at this point
    if (arrowLengthAtPoint > 2 * scale) {
      arrows.push(
        <Arrow
          key={i}
          points={[
            ax + perpX * arrowLengthAtPoint,
            ay + perpY * arrowLengthAtPoint,
            ax,
            ay,
          ]}
          fill={color}
          stroke={color}
          strokeWidth={1.5 * scale}
          pointerLength={arrowWidth}
          pointerWidth={arrowWidth}
          listening={false}
        />
      );
    }

    // Build top line following the trapezoidal shape
    topLinePoints.push(ax + perpX * arrowLengthAtPoint);
    topLinePoints.push(ay + perpY * arrowLengthAtPoint);
  }

  // Label text
  const labelText = isTrapezoidal
    ? `${Math.abs(w1).toFixed(1)}→${Math.abs(w2).toFixed(1)} kN/m`
    : `${Math.abs(w1).toFixed(1)} kN/m`;

  // Label position (at midpoint of load)
  const midIdx = Math.floor(numArrows / 2);
  const midT = midIdx / numArrows;
  const midW = w1 + (w2 - w1) * midT;
  const midArrowLen = (Math.abs(midW) / maxW) * baseArrowLength;
  const midX = (startX + endX) / 2 + perpX * (midArrowLen + 10 * scale);
  const midY = (startY + endY) / 2 + perpY * (midArrowLen + 10 * scale);

  return (
    <Group>
      {/* Top connecting line (follows trapezoidal shape) */}
      <Line
        points={topLinePoints}
        stroke={color}
        strokeWidth={1.5 * scale}
        listening={false}
      />

      {/* Close the shape by connecting ends to member */}
      {isTrapezoidal && (
        <>
          {/* Start vertical line */}
          <Line
            points={[startX, startY, topLinePoints[0]!, topLinePoints[1]!]}
            stroke={color}
            strokeWidth={1.5 * scale}
            listening={false}
          />
          {/* End vertical line */}
          <Line
            points={[
              endX,
              endY,
              topLinePoints[topLinePoints.length - 2]!,
              topLinePoints[topLinePoints.length - 1]!,
            ]}
            stroke={color}
            strokeWidth={1.5 * scale}
            listening={false}
          />
        </>
      )}

      {/* Arrows */}
      {arrows}

      {/* Load value label */}
      <Text
        x={midX}
        y={midY}
        text={labelText}
        fontSize={fontSize}
        fill={color}
        listening={false}
      />
    </Group>
  );
}
