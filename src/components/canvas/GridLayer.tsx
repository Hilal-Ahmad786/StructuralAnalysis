/**
 * GridLayer - Renders the background grid
 */

'use client';

import React, { useMemo } from 'react';
import { Layer, Line, Text } from 'react-konva';

interface GridLayerProps {
  width: number;
  height: number;
  gridSize: number;
  zoom: number;
  panX: number;
  panY: number;
}

export function GridLayer({ width, height, gridSize, zoom, panX, panY }: GridLayerProps) {
  const gridLines = useMemo(() => {
    const lines: React.ReactNode[] = [];
    
    // Calculate visible area in world coordinates
    const left = -panX / zoom;
    const right = (width - panX) / zoom;
    const top = panY / zoom;
    const bottom = -(height - panY) / zoom;
    
    // Calculate grid bounds with some padding
    const startX = Math.floor(left / gridSize) * gridSize - gridSize;
    const endX = Math.ceil(right / gridSize) * gridSize + gridSize;
    const startY = Math.floor(bottom / gridSize) * gridSize - gridSize;
    const endY = Math.ceil(top / gridSize) * gridSize + gridSize;
    
    // Minor grid (lighter)
    const minorOpacity = zoom > 30 ? 0.15 : 0;
    const majorOpacity = 0.3;
    
    // Vertical lines
    for (let x = startX; x <= endX; x += gridSize) {
      const isMajor = Math.abs(x) < 0.001 || Math.abs(x % (gridSize * 5)) < 0.001;
      const screenX = x * zoom + panX;
      
      lines.push(
        <Line
          key={`v-${x}`}
          points={[screenX, 0, screenX, height]}
          stroke={isMajor ? '#4a4a6a' : '#2a2a4a'}
          strokeWidth={isMajor ? 1 : 0.5}
          opacity={isMajor ? majorOpacity : minorOpacity}
          listening={false}
        />
      );
      
      // Labels for major grid lines
      if (isMajor && zoom > 20 && Math.abs(x) > 0.001) {
        lines.push(
          <Text
            key={`vl-${x}`}
            x={screenX + 4}
            y={panY + 4}
            text={`${x}`}
            fontSize={10}
            fill="#6a6a8a"
            listening={false}
          />
        );
      }
    }
    
    // Horizontal lines
    for (let y = startY; y <= endY; y += gridSize) {
      const isMajor = Math.abs(y) < 0.001 || Math.abs(y % (gridSize * 5)) < 0.001;
      const screenY = -y * zoom + panY; // Flip Y
      
      lines.push(
        <Line
          key={`h-${y}`}
          points={[0, screenY, width, screenY]}
          stroke={isMajor ? '#4a4a6a' : '#2a2a4a'}
          strokeWidth={isMajor ? 1 : 0.5}
          opacity={isMajor ? majorOpacity : minorOpacity}
          listening={false}
        />
      );
      
      // Labels for major grid lines
      if (isMajor && zoom > 20 && Math.abs(y) > 0.001) {
        lines.push(
          <Text
            key={`hl-${y}`}
            x={panX + 4}
            y={screenY + 4}
            text={`${y}`}
            fontSize={10}
            fill="#6a6a8a"
            listening={false}
          />
        );
      }
    }
    
    // Origin axes (thicker)
    const originX = panX;
    const originY = panY;
    
    // X-axis
    lines.push(
      <Line
        key="x-axis"
        points={[0, originY, width, originY]}
        stroke="#5a5a8a"
        strokeWidth={1.5}
        opacity={0.5}
        listening={false}
      />
    );
    
    // Y-axis
    lines.push(
      <Line
        key="y-axis"
        points={[originX, 0, originX, height]}
        stroke="#5a5a8a"
        strokeWidth={1.5}
        opacity={0.5}
        listening={false}
      />
    );
    
    // Origin label
    lines.push(
      <Text
        key="origin"
        x={originX + 4}
        y={originY + 4}
        text="0"
        fontSize={11}
        fontStyle="bold"
        fill="#8a8aaa"
        listening={false}
      />
    );
    
    return lines;
  }, [width, height, gridSize, zoom, panX, panY]);
  
  return <Layer listening={false}>{gridLines}</Layer>;
}
