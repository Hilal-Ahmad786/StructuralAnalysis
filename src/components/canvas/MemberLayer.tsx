/**
 * MemberLayer - Renders structural members (beams/trusses)
 */

'use client';

import React from 'react';
import { Group, Line, Text } from 'react-konva';
import type Konva from 'konva';
import type { Member, Node } from '@/types';
import { useModelStore } from '@/stores/modelStore';

interface MemberLayerProps {
  members: Member[];
  nodes: Node[];
  onMemberClick: (memberId: string, e: Konva.KonvaEventObject<MouseEvent>) => void;
}

export function MemberLayer({ members, nodes, onMemberClick }: MemberLayerProps) {
  const { selection, hoveredEntity, setHoveredEntity, canvasSettings, view } = useModelStore();
  const { showMemberLabels } = canvasSettings;
  const strokeWidth = 3 / view.zoom;
  const fontSize = 11 / view.zoom;
  
  const getNode = (id: string) => nodes.find((n) => n.id === id);
  
  return (
    <Group>
      {members.map((member) => {
        const startNode = getNode(member.startNodeId);
        const endNode = getNode(member.endNodeId);
        
        if (!startNode || !endNode) return null;
        
        const isSelected = selection.some((s) => s.type === 'member' && s.id === member.id);
        const isHovered = hoveredEntity?.type === 'member' && hoveredEntity.id === member.id;
        
        // Member styling based on type
        let strokeColor = member.type === 'frame' ? '#22c55e' : '#f59e0b'; // Green for frame, orange for truss
        if (isSelected) strokeColor = '#00d9ff'; // Cyan for selected
        else if (isHovered) strokeColor = '#86efac'; // Light green for hovered
        
        const points = [
          startNode.x, -startNode.y,
          endNode.x, -endNode.y,
        ];
        
        // Calculate midpoint and angle for label
        const midX = (startNode.x + endNode.x) / 2;
        const midY = (-startNode.y + -endNode.y) / 2;
        const dx = endNode.x - startNode.x;
        const dy = -endNode.y - (-startNode.y);
        const length = Math.sqrt(dx * dx + dy * dy);
        
        // Offset label perpendicular to member
        const offsetDist = 10 / view.zoom;
        const perpX = -dy / length * offsetDist;
        const perpY = dx / length * offsetDist;
        
        return (
          <Group key={member.id}>
            {/* Hit area (thicker for easier clicking) */}
            <Line
              points={points}
              stroke="transparent"
              strokeWidth={strokeWidth * 4}
              onClick={(e) => onMemberClick(member.id, e)}
              onMouseEnter={() => setHoveredEntity({ type: 'member', id: member.id })}
              onMouseLeave={() => setHoveredEntity(null)}
              hitStrokeWidth={20 / view.zoom}
            />
            
            {/* Selection highlight */}
            {isSelected && (
              <Line
                points={points}
                stroke="#00d9ff"
                strokeWidth={strokeWidth * 2}
                opacity={0.3}
                listening={false}
              />
            )}
            
            {/* Main member line */}
            <Line
              points={points}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              lineCap="round"
              listening={false}
            />
            
            {/* Truss diagonal pattern */}
            {member.type === 'truss' && (
              <Line
                points={points}
                stroke={strokeColor}
                strokeWidth={strokeWidth * 0.6}
                dash={[8 / view.zoom, 4 / view.zoom]}
                opacity={0.5}
                listening={false}
              />
            )}
            
            {/* Member label */}
            {showMemberLabels && (
              <Text
                x={midX + perpX}
                y={midY + perpY}
                text={member.id}
                fontSize={fontSize}
                fill="#aaaacc"
                offsetX={fontSize}
                offsetY={fontSize / 2}
                listening={false}
              />
            )}
          </Group>
        );
      })}
    </Group>
  );
}
