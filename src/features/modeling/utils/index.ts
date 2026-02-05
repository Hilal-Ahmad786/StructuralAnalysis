/**
 * Modeling Utilities
 * 
 * Helper functions for geometry, coordinate transformation, and model operations.
 */

import type { Node, Member, StructuralModel } from '@/types';

// ============================================================================
// Geometry Utilities
// ============================================================================

/**
 * Calculate distance between two points
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Calculate member length
 */
export function getMemberLength(
  member: Member, 
  nodes: Node[]
): number {
  const startNode = nodes.find((n) => n.id === member.startNodeId);
  const endNode = nodes.find((n) => n.id === member.endNodeId);
  if (!startNode || !endNode) return 0;
  return distance(startNode.x, startNode.y, endNode.x, endNode.y);
}

/**
 * Calculate member angle (from start to end, relative to positive X axis)
 */
export function getMemberAngle(
  member: Member, 
  nodes: Node[]
): number {
  const startNode = nodes.find((n) => n.id === member.startNodeId);
  const endNode = nodes.find((n) => n.id === member.endNodeId);
  if (!startNode || !endNode) return 0;
  return Math.atan2(endNode.y - startNode.y, endNode.x - startNode.x);
}

/**
 * Calculate member midpoint
 */
export function getMemberMidpoint(
  member: Member, 
  nodes: Node[]
): { x: number; y: number } | null {
  const startNode = nodes.find((n) => n.id === member.startNodeId);
  const endNode = nodes.find((n) => n.id === member.endNodeId);
  if (!startNode || !endNode) return null;
  return {
    x: (startNode.x + endNode.x) / 2,
    y: (startNode.y + endNode.y) / 2,
  };
}

// ============================================================================
// Coordinate Snapping
// ============================================================================

/**
 * Snap a coordinate to the nearest grid point
 */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Snap both coordinates to grid
 */
export function snapPointToGrid(
  x: number, 
  y: number, 
  gridSize: number
): { x: number; y: number } {
  return {
    x: snapToGrid(x, gridSize),
    y: snapToGrid(y, gridSize),
  };
}

/**
 * Snap to nearest existing node if within tolerance
 */
export function snapToNode(
  x: number, 
  y: number, 
  nodes: Node[], 
  tolerance: number
): Node | null {
  for (const node of nodes) {
    if (distance(x, y, node.x, node.y) < tolerance) {
      return node;
    }
  }
  return null;
}

// ============================================================================
// Model Bounds
// ============================================================================

export interface ModelBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

/**
 * Calculate bounding box of model
 */
export function getModelBounds(nodes: Node[]): ModelBounds | null {
  if (nodes.length === 0) return null;

  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX || 1,
    height: maxY - minY || 1,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

// ============================================================================
// ID Generation
// ============================================================================

/**
 * Generate next available node ID
 */
export function generateNodeId(existingNodes: Node[]): string {
  const existingNumbers = existingNodes
    .map((n) => {
      const match = n.id.match(/^N(\d+)$/);
      return match ? parseInt(match[1]!, 10) : 0;
    })
    .filter((n) => n > 0);

  const maxNumber = Math.max(0, ...existingNumbers);
  return `N${maxNumber + 1}`;
}

/**
 * Generate next available member ID
 */
export function generateMemberId(existingMembers: Member[]): string {
  const existingNumbers = existingMembers
    .map((m) => {
      const match = m.id.match(/^M(\d+)$/);
      return match ? parseInt(match[1]!, 10) : 0;
    })
    .filter((n) => n > 0);

  const maxNumber = Math.max(0, ...existingNumbers);
  return `M${maxNumber + 1}`;
}

// ============================================================================
// Model Queries
// ============================================================================

/**
 * Get all members connected to a node
 */
export function getConnectedMembers(
  nodeId: string, 
  members: Member[]
): Member[] {
  return members.filter(
    (m) => m.startNodeId === nodeId || m.endNodeId === nodeId
  );
}

/**
 * Check if node is used by any member
 */
export function isNodeUsed(nodeId: string, members: Member[]): boolean {
  return members.some(
    (m) => m.startNodeId === nodeId || m.endNodeId === nodeId
  );
}

/**
 * Check if a member already exists between two nodes
 */
export function memberExists(
  startNodeId: string, 
  endNodeId: string, 
  members: Member[]
): boolean {
  return members.some(
    (m) =>
      (m.startNodeId === startNodeId && m.endNodeId === endNodeId) ||
      (m.startNodeId === endNodeId && m.endNodeId === startNodeId)
  );
}

/**
 * Find nodes at a specific location
 */
export function findNodesAtLocation(
  x: number, 
  y: number, 
  nodes: Node[], 
  tolerance: number = 0.001
): Node[] {
  return nodes.filter((n) => distance(n.x, n.y, x, y) < tolerance);
}

// ============================================================================
// Model Statistics
// ============================================================================

export interface ModelStatistics {
  nodeCount: number;
  memberCount: number;
  frameCount: number;
  trussCount: number;
  supportCount: number;
  fixedSupportCount: number;
  pinnedSupportCount: number;
  rollerSupportCount: number;
  totalLength: number;
  boundingBox: ModelBounds | null;
}

/**
 * Calculate model statistics
 */
export function getModelStatistics(model: StructuralModel): ModelStatistics {
  const frameMembers = model.members.filter((m) => m.type === 'frame');
  const trussMembers = model.members.filter((m) => m.type === 'truss');

  const fixedSupports = model.supports.filter((s) => s.dx && s.dy && s.rz);
  const pinnedSupports = model.supports.filter((s) => s.dx && s.dy && !s.rz);
  const rollerSupports = model.supports.filter(
    (s) => (s.dx && !s.dy && !s.rz) || (!s.dx && s.dy && !s.rz)
  );

  const totalLength = model.members.reduce(
    (sum, m) => sum + getMemberLength(m, model.nodes),
    0
  );

  return {
    nodeCount: model.nodes.length,
    memberCount: model.members.length,
    frameCount: frameMembers.length,
    trussCount: trussMembers.length,
    supportCount: model.supports.length,
    fixedSupportCount: fixedSupports.length,
    pinnedSupportCount: pinnedSupports.length,
    rollerSupportCount: rollerSupports.length,
    totalLength,
    boundingBox: getModelBounds(model.nodes),
  };
}
