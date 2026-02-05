/**
 * StructuralCanvas - Main canvas component for structural visualization
 * 
 * Uses React-Konva for rendering nodes, members, supports, loads, and results.
 * Handles pan, zoom, and user interactions.
 */

'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { Stage, Layer } from 'react-konva';
import type Konva from 'konva';
import { useModelStore } from '@/stores/modelStore';
import { GridLayer } from './GridLayer';
import { MemberLayer } from './MemberLayer';
import { NodeLayer } from './NodeLayer';
import { SupportLayer } from './SupportLayer';
import { LoadLayer } from './LoadLayer';
import { DiagramLayer } from './DiagramLayer';

interface StructuralCanvasProps {
  width: number;
  height: number;
}

export function StructuralCanvas({ width, height }: StructuralCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null);
  
  const {
    mode,
    view,
    canvasSettings,
    model,
    setZoom,
    setPan,
    addNode,
    addMember,
    addSupport,
    select,
    clearSelection,
    pendingMemberStartNodeId,
    setPendingMemberStartNode,
    defaultSupportType,
  } = useModelStore();
  
  const { zoom, panX, panY } = view;
  
  // Convert screen coordinates to world coordinates
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    const worldX = (screenX - panX) / zoom;
    const worldY = -(screenY - panY) / zoom; // Flip Y for engineering convention
    return { x: worldX, y: worldY };
  }, [zoom, panX, panY]);
  
  // Snap to grid
  const snapToGrid = useCallback((x: number, y: number) => {
    if (!canvasSettings.snapToGrid) return { x, y };
    const grid = canvasSettings.gridSize;
    return {
      x: Math.round(x / grid) * grid,
      y: Math.round(y / grid) * grid,
    };
  }, [canvasSettings.snapToGrid, canvasSettings.gridSize]);
  
  // Handle wheel zoom
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const oldZoom = zoom;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    
    const mousePointTo = {
      x: (pointer.x - panX) / oldZoom,
      y: (pointer.y - panY) / oldZoom,
    };
    
    // Zoom in/out
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const factor = 1.1;
    const newZoom = direction > 0 ? oldZoom * factor : oldZoom / factor;
    const clampedZoom = Math.max(5, Math.min(500, newZoom));
    
    const newPanX = pointer.x - mousePointTo.x * clampedZoom;
    const newPanY = pointer.y - mousePointTo.y * clampedZoom;
    
    setZoom(clampedZoom);
    setPan(newPanX, newPanY);
  }, [zoom, panX, panY, setZoom, setPan]);
  
  // Handle stage click
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Only handle clicks directly on the stage (not on shapes)
    if (e.target !== e.currentTarget) return;
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    
    const world = screenToWorld(pointer.x, pointer.y);
    const snapped = snapToGrid(world.x, world.y);
    
    switch (mode) {
      case 'node': {
        addNode(snapped.x, snapped.y);
        break;
      }
      case 'select': {
        clearSelection();
        break;
      }
      case 'member': {
        // If we have a pending start node, clicking empty space cancels
        if (pendingMemberStartNodeId) {
          setPendingMemberStartNode(null);
        }
        break;
      }
      default:
        break;
    }
  }, [mode, screenToWorld, snapToGrid, addNode, clearSelection, pendingMemberStartNodeId, setPendingMemberStartNode]);
  
  // Handle node click
  const handleNodeClick = useCallback((nodeId: string, e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    
    switch (mode) {
      case 'select': {
        if (e.evt.shiftKey) {
          useModelStore.getState().addToSelection({ type: 'node', id: nodeId });
        } else {
          select({ type: 'node', id: nodeId });
        }
        break;
      }
      case 'member': {
        if (!pendingMemberStartNodeId) {
          // First click - set start node
          setPendingMemberStartNode(nodeId);
        } else if (pendingMemberStartNodeId !== nodeId) {
          // Second click - create member
          addMember(pendingMemberStartNodeId, nodeId);
          // Continue chain - new member starts from this node
          setPendingMemberStartNode(nodeId);
        }
        break;
      }
      case 'support': {
        addSupport(nodeId, defaultSupportType);
        break;
      }
      case 'load': {
        // Emit event for load dialog
        window.dispatchEvent(new CustomEvent('structural:load-click', {
          detail: { type: 'node', id: nodeId }
        }));
        break;
      }
      default:
        break;
    }
  }, [mode, pendingMemberStartNodeId, setPendingMemberStartNode, addMember, addSupport, defaultSupportType, select]);
  
  // Handle member click
  const handleMemberClick = useCallback((memberId: string, e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    
    switch (mode) {
      case 'select': {
        if (e.evt.shiftKey) {
          useModelStore.getState().addToSelection({ type: 'member', id: memberId });
        } else {
          select({ type: 'member', id: memberId });
        }
        break;
      }
      case 'load': {
        // Check if member is a frame (distributed loads only on frames)
        const member = model.members.find(m => m.id === memberId);
        if (member?.type === 'truss') {
          // For truss, show warning or prevent
          console.warn('Distributed loads not supported on truss members');
          return;
        }
        // Emit event for load dialog
        window.dispatchEvent(new CustomEvent('structural:load-click', {
          detail: { type: 'member', id: memberId }
        }));
        break;
      }
      default:
        break;
    }
  }, [mode, select, model.members]);
  
  // Handle drag for panning
  const handleDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    if (mode === 'pan') {
      const stage = e.target as Konva.Stage;
      setPan(stage.x(), stage.y());
    }
  }, [mode, setPan]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z (or Cmd+Z on Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useModelStore.getState().undo();
        return;
      }
      
      // Redo: Ctrl+Y or Ctrl+Shift+Z (or Cmd+Shift+Z on Mac)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        useModelStore.getState().redo();
        return;
      }
      
      // Delete selected items
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const { selection, deleteNode, deleteMember, deleteSupport } = useModelStore.getState();
        selection.forEach((s) => {
          if (s.type === 'node') deleteNode(s.id);
          else if (s.type === 'member') deleteMember(s.id);
          else if (s.type === 'support') deleteSupport(s.id);
        });
      }
      
      // Escape to cancel current action
      if (e.key === 'Escape') {
        setPendingMemberStartNode(null);
        clearSelection();
      }
      
      // Mode shortcuts (only when not holding Ctrl/Cmd)
      if (!e.ctrlKey && !e.metaKey) {
        if (e.key === 'v' || e.key === 'V') useModelStore.getState().setMode('select');
        if (e.key === 'n' || e.key === 'N') useModelStore.getState().setMode('node');
        if (e.key === 'm' || e.key === 'M') useModelStore.getState().setMode('member');
        if (e.key === 's' || e.key === 'S') useModelStore.getState().setMode('support');
        if (e.key === 'l' || e.key === 'L') useModelStore.getState().setMode('load');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearSelection, setPendingMemberStartNode]);
  
  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      onWheel={handleWheel}
      onClick={handleStageClick}
      draggable={mode === 'pan'}
      onDragMove={handleDragMove}
      x={mode === 'pan' ? panX : 0}
      y={mode === 'pan' ? panY : 0}
      style={{ 
        cursor: mode === 'pan' ? 'grab' : mode === 'node' ? 'crosshair' : 'default',
        background: '#1a1a2e',
      }}
    >
      {/* Grid Layer */}
      {canvasSettings.showGrid && (
        <GridLayer
          width={width}
          height={height}
          gridSize={canvasSettings.gridSize}
          zoom={zoom}
          panX={mode === 'pan' ? 0 : panX}
          panY={mode === 'pan' ? 0 : panY}
        />
      )}
      
      {/* Main content layer */}
      <Layer
        x={mode === 'pan' ? 0 : panX}
        y={mode === 'pan' ? 0 : panY}
        scaleX={zoom}
        scaleY={zoom}
      >
        {/* Members */}
        <MemberLayer
          members={model.members}
          nodes={model.nodes}
          onMemberClick={handleMemberClick}
        />
        
        {/* Supports */}
        {canvasSettings.showSupports && (
          <SupportLayer
            supports={model.supports}
            nodes={model.nodes}
          />
        )}
        
        {/* Loads */}
        {canvasSettings.showLoads && (
          <LoadLayer />
        )}
        
        {/* Nodes */}
        <NodeLayer
          nodes={model.nodes}
          onNodeClick={handleNodeClick}
          pendingMemberStartNodeId={pendingMemberStartNodeId}
        />
        
        {/* Force Diagrams */}
        <DiagramLayer />
      </Layer>
    </Stage>
  );
}
