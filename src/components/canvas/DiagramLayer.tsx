/**
 * DiagramLayer - Renders force diagrams (axial, shear, moment) and deformed shape
 *
 * Sign Conventions (matching solver):
 * - N > 0: tension (drawn above member by default)
 * - V > 0: positive shear (drawn above member)
 * - M > 0: sagging, tension at bottom (drawn on TENSION side = below for positive)
 */

'use client';

import React from 'react';
import { Group, Line, Text, Circle } from 'react-konva';
import { useModelStore } from '@/stores/modelStore';
import type { MemberResult, DiagramPoint } from '@/lib/solver';

export function DiagramLayer() {
  const {
    model,
    analysisResult,
    canvasSettings,
    view
  } = useModelStore();

  if (!analysisResult || !analysisResult.success) return null;

  const { results } = analysisResult;
  const scale = 1 / view.zoom;
  const {
    showDeformed,
    deformationScale,
    showAxialDiagram,
    showShearDiagram,
    showMomentDiagram,
    diagramScale,
  } = canvasSettings;

  const getNode = (id: string) => model.nodes.find((n) => n.id === id);

  // Calculate a good base scale for diagrams based on member lengths
  const avgMemberLength = model.members.length > 0
    ? model.members.reduce((sum, m) => {
        const sn = getNode(m.startNodeId);
        const en = getNode(m.endNodeId);
        if (!sn || !en) return sum;
        return sum + Math.sqrt((en.x - sn.x) ** 2 + (en.y - sn.y) ** 2);
      }, 0) / model.members.length
    : 5;

  // Base scale factor: diagram offset = value * baseScale * diagramScale
  const baseScale = avgMemberLength * 0.05;

  return (
    <Group>
      {/* Deformed Shape */}
      {showDeformed && (
        <DeformedShape
          nodes={model.nodes}
          members={model.members}
          nodeDisplacements={results.nodeDisplacements}
          deformationScale={deformationScale}
          scale={scale}
        />
      )}

      {/* Force Diagrams */}
      {results.memberResults.map((mr: MemberResult) => {
        const member = model.members.find((m) => m.id === mr.memberId);
        if (!member) return null;

        const startNode = getNode(member.startNodeId);
        const endNode = getNode(member.endNodeId);
        if (!startNode || !endNode) return null;

        // Get member geometry
        const memberLength = Math.sqrt(
          (endNode.x - startNode.x) ** 2 + (endNode.y - startNode.y) ** 2
        );

        return (
          <Group key={mr.memberId}>
            {/* Axial Diagram */}
            {showAxialDiagram && mr.diagrams.axial.length > 0 && (
              <ForceDiagram
                startX={startNode.x}
                startY={-startNode.y}
                endX={endNode.x}
                endY={-endNode.y}
                memberLength={memberLength}
                points={mr.diagrams.axial}
                diagramScale={baseScale * diagramScale * scale}
                color="#f59e0b"
                fillColor="rgba(245, 158, 11, 0.15)"
                negativeColor="#dc2626"
                negativeFillColor="rgba(220, 38, 38, 0.15)"
                label="N"
                unit="kN"
                scale={scale}
                drawOnPositiveSide={true}
              />
            )}

            {/* Shear Diagram */}
            {showShearDiagram && mr.diagrams.shear.length > 0 && (
              <ForceDiagram
                startX={startNode.x}
                startY={-startNode.y}
                endX={endNode.x}
                endY={-endNode.y}
                memberLength={memberLength}
                points={mr.diagrams.shear}
                diagramScale={baseScale * diagramScale * scale}
                color="#3b82f6"
                fillColor="rgba(59, 130, 246, 0.15)"
                negativeColor="#8b5cf6"
                negativeFillColor="rgba(139, 92, 246, 0.15)"
                label="V"
                unit="kN"
                scale={scale}
                drawOnPositiveSide={true}
              />
            )}

            {/* Moment Diagram - drawn on TENSION side */}
            {showMomentDiagram && mr.diagrams.moment.length > 0 && (
              <ForceDiagram
                startX={startNode.x}
                startY={-startNode.y}
                endX={endNode.x}
                endY={-endNode.y}
                memberLength={memberLength}
                points={mr.diagrams.moment}
                diagramScale={baseScale * diagramScale * scale * 0.5}
                color="#ef4444"
                fillColor="rgba(239, 68, 68, 0.15)"
                negativeColor="#14b8a6"
                negativeFillColor="rgba(20, 184, 166, 0.15)"
                label="M"
                unit="kN·m"
                scale={scale}
                drawOnPositiveSide={false} // Moment on tension side (positive = below)
              />
            )}
          </Group>
        );
      })}

      {/* Reaction Arrows */}
      {showDeformed && (
        <ReactionArrows
          reactions={results.reactions}
          nodes={model.nodes}
          scale={scale}
        />
      )}
    </Group>
  );
}

// Deformed shape overlay
function DeformedShape({
  nodes,
  members,
  nodeDisplacements,
  deformationScale,
  scale,
}: {
  nodes: { id: string; x: number; y: number }[];
  members: { id: string; startNodeId: string; endNodeId: string }[];
  nodeDisplacements: { nodeId: string; dx: number; dy: number; rz: number }[];
  deformationScale: number;
  scale: number;
}) {
  const getDisplacement = (nodeId: string) =>
    nodeDisplacements.find((d) => d.nodeId === nodeId);

  const getDeformedPos = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    const disp = getDisplacement(nodeId);
    if (!node) return null;

    const dx = (disp?.dx ?? 0) * deformationScale;
    const dy = (disp?.dy ?? 0) * deformationScale;

    return {
      x: node.x + dx,
      y: -node.y - dy, // Flip Y for screen coords
    };
  };

  return (
    <Group>
      {/* Deformed members */}
      {members.map((member) => {
        const start = getDeformedPos(member.startNodeId);
        const end = getDeformedPos(member.endNodeId);
        if (!start || !end) return null;

        return (
          <Line
            key={`deformed-${member.id}`}
            points={[start.x, start.y, end.x, end.y]}
            stroke="#22d3ee"
            strokeWidth={2 * scale}
            opacity={0.7}
            dash={[5 * scale, 3 * scale]}
            listening={false}
          />
        );
      })}

      {/* Deformed nodes */}
      {nodes.map((node) => {
        const pos = getDeformedPos(node.id);
        if (!pos) return null;

        return (
          <Circle
            key={`deformed-node-${node.id}`}
            x={pos.x}
            y={pos.y}
            radius={4 * scale}
            fill="#22d3ee"
            opacity={0.8}
            listening={false}
          />
        );
      })}
    </Group>
  );
}

// Improved force diagram with proper baseline and separate positive/negative regions
function ForceDiagram({
  startX,
  startY,
  endX,
  endY,
  memberLength,
  points,
  diagramScale,
  color,
  fillColor,
  negativeColor,
  negativeFillColor,
  label,
  unit,
  scale,
  drawOnPositiveSide,
}: {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  memberLength: number;
  points: DiagramPoint[];
  diagramScale: number;
  color: string;
  fillColor: string;
  negativeColor: string;
  negativeFillColor: string;
  label: string;
  unit: string;
  scale: number;
  drawOnPositiveSide: boolean;
}) {
  if (points.length === 0) return null;

  // Calculate member direction
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length < 0.001) return null;

  const unitX = dx / length;
  const unitY = dy / length;

  // Perpendicular direction (90° CCW rotation)
  // For horizontal beam: unitX=1, unitY=0 → perpX=0, perpY=1 (pointing down on screen)
  let perpX = -unitY;
  let perpY = unitX;

  // For positive side drawing, we want positive values to go "above" the member
  // "Above" in screen coords means negative Y direction
  // So we need to flip the perpendicular for positive side drawing
  if (drawOnPositiveSide) {
    perpX = -perpX;
    perpY = -perpY;
  }

  // Helper to get position along member
  const getBasePosition = (x: number) => {
    const t = x / memberLength;
    return {
      x: startX + t * dx,
      y: startY + t * dy,
    };
  };

  // Helper to get diagram position (base + offset)
  const getDiagramPosition = (x: number, value: number) => {
    const base = getBasePosition(x);
    const offset = value * diagramScale;
    return {
      x: base.x + perpX * offset,
      y: base.y + perpY * offset,
    };
  };

  // Build separate positive and negative filled regions
  const positivePolygon: number[] = [];
  const negativePolygon: number[] = [];
  const outlinePoints: number[] = [];

  // Start from member start on baseline
  positivePolygon.push(startX, startY);
  negativePolygon.push(startX, startY);

  // Build outline and track zero crossings
  let prevPoint: DiagramPoint | null = null;

  points.forEach((pt) => {
    const pos = getDiagramPosition(pt.x, pt.value);
    outlinePoints.push(pos.x, pos.y);

    // Handle zero crossings for proper fill
    if (prevPoint !== null && prevPoint.value * pt.value < 0) {
      // Zero crossing - find intersection point
      const t = Math.abs(prevPoint.value) / (Math.abs(prevPoint.value) + Math.abs(pt.value));
      const crossX = prevPoint.x + t * (pt.x - prevPoint.x);
      const crossPos = getBasePosition(crossX);

      if (prevPoint.value > 0) {
        positivePolygon.push(crossPos.x, crossPos.y);
        negativePolygon.push(crossPos.x, crossPos.y);
      } else {
        negativePolygon.push(crossPos.x, crossPos.y);
        positivePolygon.push(crossPos.x, crossPos.y);
      }
    }

    // Add point to appropriate polygon
    if (pt.value >= 0) {
      positivePolygon.push(pos.x, pos.y);
      // Keep negative polygon on baseline
      const base = getBasePosition(pt.x);
      if (negativePolygon.length >= 2) {
        const lastX = negativePolygon[negativePolygon.length - 2];
        const lastY = negativePolygon[negativePolygon.length - 1];
        if (Math.abs(lastX! - base.x) > 0.001 || Math.abs(lastY! - base.y) > 0.001) {
          negativePolygon.push(base.x, base.y);
        }
      }
    } else {
      negativePolygon.push(pos.x, pos.y);
      // Keep positive polygon on baseline
      const base = getBasePosition(pt.x);
      if (positivePolygon.length >= 2) {
        const lastX = positivePolygon[positivePolygon.length - 2];
        const lastY = positivePolygon[positivePolygon.length - 1];
        if (Math.abs(lastX! - base.x) > 0.001 || Math.abs(lastY! - base.y) > 0.001) {
          positivePolygon.push(base.x, base.y);
        }
      }
    }

    prevPoint = pt;
  });

  // Close polygons back to end
  positivePolygon.push(endX, endY);
  negativePolygon.push(endX, endY);

  // Find max and min values for labels
  let maxPoint = points[0]!;
  let minPoint = points[0]!;

  points.forEach((pt) => {
    if (pt.value > maxPoint.value) maxPoint = pt;
    if (pt.value < minPoint.value) minPoint = pt;
  });

  const maxPos = getDiagramPosition(maxPoint.x, maxPoint.value);
  const minPos = getDiagramPosition(minPoint.x, minPoint.value);

  // Get end values for labels
  const startValue = points[0]?.value ?? 0;
  const endValue = points[points.length - 1]?.value ?? 0;
  const startLabelPos = getDiagramPosition(0, startValue);
  const endLabelPos = getDiagramPosition(memberLength, endValue);

  const fontSize = 10 * scale;
  const labelOffset = 12 * scale;

  return (
    <Group>
      {/* Baseline (member axis reference) */}
      <Line
        points={[startX, startY, endX, endY]}
        stroke={color}
        strokeWidth={0.5 * scale}
        opacity={0.3}
        dash={[2 * scale, 2 * scale]}
        listening={false}
      />

      {/* Positive filled region */}
      {positivePolygon.length >= 6 && (
        <Line
          points={positivePolygon}
          fill={fillColor}
          closed
          listening={false}
        />
      )}

      {/* Negative filled region */}
      {negativePolygon.length >= 6 && (
        <Line
          points={negativePolygon}
          fill={negativeFillColor}
          closed
          listening={false}
        />
      )}

      {/* Diagram outline */}
      <Line
        points={outlinePoints}
        stroke={color}
        strokeWidth={1.5 * scale}
        listening={false}
      />

      {/* Vertical lines at ends connecting to baseline */}
      {Math.abs(startValue) > 0.001 && (
        <Line
          points={[startX, startY, startLabelPos.x, startLabelPos.y]}
          stroke={startValue >= 0 ? color : negativeColor}
          strokeWidth={1 * scale}
          listening={false}
        />
      )}
      {Math.abs(endValue) > 0.001 && (
        <Line
          points={[endX, endY, endLabelPos.x, endLabelPos.y]}
          stroke={endValue >= 0 ? color : negativeColor}
          strokeWidth={1 * scale}
          listening={false}
        />
      )}

      {/* Start value label */}
      {Math.abs(startValue) > 0.01 && (
        <Text
          x={startLabelPos.x + perpX * labelOffset}
          y={startLabelPos.y + perpY * labelOffset - fontSize / 2}
          text={`${startValue.toFixed(1)}`}
          fontSize={fontSize}
          fill={startValue >= 0 ? color : negativeColor}
          listening={false}
        />
      )}

      {/* End value label */}
      {Math.abs(endValue) > 0.01 && (
        <Text
          x={endLabelPos.x + perpX * labelOffset}
          y={endLabelPos.y + perpY * labelOffset - fontSize / 2}
          text={`${endValue.toFixed(1)}`}
          fontSize={fontSize}
          fill={endValue >= 0 ? color : negativeColor}
          listening={false}
        />
      )}

      {/* Max value label (if different from ends) */}
      {Math.abs(maxPoint.value) > 0.01 &&
       maxPoint.x > 0.1 * memberLength &&
       maxPoint.x < 0.9 * memberLength && (
        <Group>
          <Line
            points={[
              getBasePosition(maxPoint.x).x,
              getBasePosition(maxPoint.x).y,
              maxPos.x,
              maxPos.y,
            ]}
            stroke={color}
            strokeWidth={0.5 * scale}
            dash={[2 * scale, 2 * scale]}
            listening={false}
          />
          <Text
            x={maxPos.x + perpX * labelOffset}
            y={maxPos.y + perpY * labelOffset - fontSize / 2}
            text={`${label}max=${maxPoint.value.toFixed(1)} ${unit}`}
            fontSize={fontSize}
            fill={color}
            listening={false}
          />
        </Group>
      )}

      {/* Min value label (if significantly negative and different from max) */}
      {Math.abs(minPoint.value) > 0.01 &&
       minPoint.value < -0.01 &&
       minPoint.x > 0.1 * memberLength &&
       minPoint.x < 0.9 * memberLength &&
       Math.abs(minPoint.x - maxPoint.x) > 0.1 * memberLength && (
        <Group>
          <Line
            points={[
              getBasePosition(minPoint.x).x,
              getBasePosition(minPoint.x).y,
              minPos.x,
              minPos.y,
            ]}
            stroke={negativeColor}
            strokeWidth={0.5 * scale}
            dash={[2 * scale, 2 * scale]}
            listening={false}
          />
          <Text
            x={minPos.x - perpX * labelOffset}
            y={minPos.y - perpY * labelOffset - fontSize / 2}
            text={`${label}min=${minPoint.value.toFixed(1)} ${unit}`}
            fontSize={fontSize}
            fill={negativeColor}
            listening={false}
          />
        </Group>
      )}

      {/* Diagram type label at midpoint */}
      <Text
        x={(startX + endX) / 2 + perpX * (Math.max(Math.abs(maxPoint.value), Math.abs(minPoint.value)) * diagramScale + labelOffset * 2)}
        y={(startY + endY) / 2 + perpY * (Math.max(Math.abs(maxPoint.value), Math.abs(minPoint.value)) * diagramScale + labelOffset * 2) - fontSize / 2}
        text={label}
        fontSize={fontSize * 1.2}
        fontStyle="bold"
        fill={color}
        listening={false}
      />
    </Group>
  );
}

// Reaction arrows
function ReactionArrows({
  reactions,
  nodes,
  scale,
}: {
  reactions: { nodeId: string; fx: number; fy: number; mz: number }[];
  nodes: { id: string; x: number; y: number }[];
  scale: number;
}) {
  const arrowLength = 35 * scale;
  const arrowHeadSize = 8 * scale;
  const fontSize = 9 * scale;
  const color = '#10b981'; // Green for reactions

  const getNode = (id: string) => nodes.find((n) => n.id === id);

  return (
    <Group>
      {reactions.map((r) => {
        const node = getNode(r.nodeId);
        if (!node) return null;

        const x = node.x;
        const y = -node.y;
        const elements: React.ReactNode[] = [];

        // Horizontal reaction
        // Standard convention: positive Rx = rightward force from support
        if (Math.abs(r.fx) > 0.001) {
          const sign = r.fx > 0 ? 1 : -1;
          // Arrow starts away from node and points toward node
          const tailX = x - sign * arrowLength;
          const tipX = x;

          elements.push(
            <Group key={`rx-${r.nodeId}`}>
              {/* Arrow shaft */}
              <Line
                points={[tailX, y, tipX, y]}
                stroke={color}
                strokeWidth={2 * scale}
                listening={false}
              />
              {/* Arrow head pointing toward node */}
              <Line
                points={[
                  tipX - sign * arrowHeadSize, y - arrowHeadSize * 0.5,
                  tipX, y,
                  tipX - sign * arrowHeadSize, y + arrowHeadSize * 0.5,
                ]}
                stroke={color}
                strokeWidth={2 * scale}
                lineCap="round"
                lineJoin="round"
                listening={false}
              />
              <Text
                x={tailX - (sign > 0 ? fontSize * 4 : -fontSize * 0.5)}
                y={y - fontSize * 1.2}
                text={`Rx=${r.fx.toFixed(1)} kN`}
                fontSize={fontSize}
                fill={color}
                listening={false}
              />
            </Group>
          );
        }

        // Vertical reaction
        // Standard convention: positive Ry = upward force from support
        if (Math.abs(r.fy) > 0.001) {
          const sign = r.fy > 0 ? -1 : 1; // -1 for upward (negative screen Y)
          // Arrow starts away from node and points toward node
          const tailY = y - sign * arrowLength;
          const tipY = y;

          elements.push(
            <Group key={`ry-${r.nodeId}`}>
              {/* Arrow shaft */}
              <Line
                points={[x, tailY, x, tipY]}
                stroke={color}
                strokeWidth={2 * scale}
                listening={false}
              />
              {/* Arrow head pointing toward node */}
              <Line
                points={[
                  x - arrowHeadSize * 0.5, tipY - sign * arrowHeadSize,
                  x, tipY,
                  x + arrowHeadSize * 0.5, tipY - sign * arrowHeadSize,
                ]}
                stroke={color}
                strokeWidth={2 * scale}
                lineCap="round"
                lineJoin="round"
                listening={false}
              />
              <Text
                x={x + fontSize * 0.5}
                y={tailY + (sign > 0 ? -fontSize * 0.5 : fontSize * 0.5)}
                text={`Ry=${r.fy.toFixed(1)} kN`}
                fontSize={fontSize}
                fill={color}
                listening={false}
              />
            </Group>
          );
        }

        // Moment reaction (curved arrow)
        if (Math.abs(r.mz) > 0.001) {
          const radius = 20 * scale;
          const isPositive = r.mz > 0; // Positive = CCW

          // Create arc points
          const arcPoints: number[] = [];
          const startAngle = isPositive ? Math.PI * 0.75 : -Math.PI * 0.25;
          const endAngle = isPositive ? -Math.PI * 0.25 : Math.PI * 0.75;
          const steps = 20;

          for (let i = 0; i <= steps; i++) {
            const angle = startAngle + (endAngle - startAngle) * (i / steps);
            arcPoints.push(x + radius * Math.cos(angle), y + radius * Math.sin(angle));
          }

          // Arrow head at end of arc
          const endAngleRad = endAngle;
          const tangentAngle = endAngleRad + (isPositive ? -Math.PI / 2 : Math.PI / 2);
          const headX = arcPoints[arcPoints.length - 2]!;
          const headY = arcPoints[arcPoints.length - 1]!;

          elements.push(
            <Group key={`rz-${r.nodeId}`}>
              <Line
                points={arcPoints}
                stroke={color}
                strokeWidth={1.5 * scale}
                listening={false}
              />
              {/* Arrow head */}
              <Line
                points={[
                  headX + Math.cos(tangentAngle + 0.5) * arrowHeadSize * 0.6,
                  headY + Math.sin(tangentAngle + 0.5) * arrowHeadSize * 0.6,
                  headX,
                  headY,
                  headX + Math.cos(tangentAngle - 0.5) * arrowHeadSize * 0.6,
                  headY + Math.sin(tangentAngle - 0.5) * arrowHeadSize * 0.6,
                ]}
                stroke={color}
                strokeWidth={1.5 * scale}
                lineCap="round"
                lineJoin="round"
                listening={false}
              />
              <Text
                x={x + radius * 1.4}
                y={y - fontSize * 0.5}
                text={`Mz=${r.mz.toFixed(1)} kN·m`}
                fontSize={fontSize}
                fill={color}
                listening={false}
              />
            </Group>
          );
        }

        return <Group key={r.nodeId}>{elements}</Group>;
      })}
    </Group>
  );
}
