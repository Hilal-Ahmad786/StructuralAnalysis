/**
 * NodeLayer - Renders structural nodes
 */

'use client';

import React from 'react';
import { Group, Circle, Text } from 'react-konva';
import type Konva from 'konva';
import type { Node } from '@/types';
import { useModelStore } from '@/stores/modelStore';

interface NodeLayerProps {
  nodes: Node[];
  onNodeClick: (nodeId: string, e: Konva.KonvaEventObject<MouseEvent>) => void;
  pendingMemberStartNodeId: string | null;
}

export function NodeLayer({ nodes, onNodeClick, pendingMemberStartNodeId }: NodeLayerProps) {
  const { selection, hoveredEntity, setHoveredEntity, canvasSettings, view } = useModelStore();
  const { showNodeLabels } = canvasSettings;
  const nodeRadius = 6 / view.zoom; // Constant screen size
  const fontSize = 12 / view.zoom;
  
  return (
    <Group>
      {nodes.map((node) => {
        const isSelected = selection.some((s) => s.type === 'node' && s.id === node.id);
        const isHovered = hoveredEntity?.type === 'node' && hoveredEntity.id === node.id;
        const isPendingStart = pendingMemberStartNodeId === node.id;
        
        let fillColor = '#4a9eff'; // Default blue
        if (isPendingStart) fillColor = '#ff9f43'; // Orange for pending
        else if (isSelected) fillColor = '#00d9ff'; // Cyan for selected
        else if (isHovered) fillColor = '#7cb9ff'; // Light blue for hovered
        
        return (
          <Group key={node.id}>
            {/* Hit area (larger for easier clicking) */}
            <Circle
              x={node.x}
              y={-node.y} // Flip Y
              radius={nodeRadius * 2}
              fill="transparent"
              onClick={(e) => onNodeClick(node.id, e)}
              onMouseEnter={() => setHoveredEntity({ type: 'node', id: node.id })}
              onMouseLeave={() => setHoveredEntity(null)}
            />
            
            {/* Selection ring */}
            {isSelected && (
              <Circle
                x={node.x}
                y={-node.y}
                radius={nodeRadius * 1.6}
                fill="transparent"
                stroke="#00d9ff"
                strokeWidth={2 / view.zoom}
                listening={false}
              />
            )}
            
            {/* Main node circle */}
            <Circle
              x={node.x}
              y={-node.y}
              radius={nodeRadius}
              fill={fillColor}
              stroke={isSelected ? '#ffffff' : '#2a5a9e'}
              strokeWidth={1.5 / view.zoom}
              shadowColor={isPendingStart ? '#ff9f43' : '#000000'}
              shadowBlur={isPendingStart ? 10 / view.zoom : 0}
              listening={false}
            />
            
            {/* Node label */}
            {showNodeLabels && (
              <Text
                x={node.x + nodeRadius * 1.5}
                y={-node.y - nodeRadius * 1.5}
                text={node.id}
                fontSize={fontSize}
                fill="#aaaacc"
                listening={false}
              />
            )}
          </Group>
        );
      })}
    </Group>
  );
}
