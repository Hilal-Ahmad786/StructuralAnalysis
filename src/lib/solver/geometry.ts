/**
 * Geometry Utilities for Structural Analysis
 * 
 * Coordinates and angles follow the spec conventions:
 * - Global X: horizontal, positive right
 * - Global Y: vertical, positive up
 * - Member angle θ: from global +X to member axis, CCW positive
 */

import type { Node, Member, StructuralModel } from '@/types';

/**
 * Compute member length from node coordinates.
 */
export function computeMemberLength(
  startNode: Node,
  endNode: Node
): number {
  const dx = endNode.x - startNode.x;
  const dy = endNode.y - startNode.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Compute member length from member and model.
 */
export function getMemberLength(
  member: Member,
  nodes: Node[]
): number {
  const startNode = nodes.find(n => n.id === member.startNodeId);
  const endNode = nodes.find(n => n.id === member.endNodeId);
  
  if (!startNode) {
    throw new Error(`Start node ${member.startNodeId} not found for member ${member.id}`);
  }
  if (!endNode) {
    throw new Error(`End node ${member.endNodeId} not found for member ${member.id}`);
  }
  
  return computeMemberLength(startNode, endNode);
}

/**
 * Compute member angle from node coordinates.
 * 
 * @returns Angle in radians, from global +X to member axis, CCW positive
 *          Range: (-π, π]
 */
export function computeMemberAngle(
  startNode: Node,
  endNode: Node
): number {
  const dx = endNode.x - startNode.x;
  const dy = endNode.y - startNode.y;
  return Math.atan2(dy, dx);
}

/**
 * Compute member angle from member and model.
 */
export function getMemberAngle(
  member: Member,
  nodes: Node[]
): number {
  const startNode = nodes.find(n => n.id === member.startNodeId);
  const endNode = nodes.find(n => n.id === member.endNodeId);
  
  if (!startNode) {
    throw new Error(`Start node ${member.startNodeId} not found for member ${member.id}`);
  }
  if (!endNode) {
    throw new Error(`End node ${member.endNodeId} not found for member ${member.id}`);
  }
  
  return computeMemberAngle(startNode, endNode);
}

/**
 * Get nodes for a member.
 */
export function getMemberNodes(
  member: Member,
  nodes: Node[]
): { startNode: Node; endNode: Node } {
  const startNode = nodes.find(n => n.id === member.startNodeId);
  const endNode = nodes.find(n => n.id === member.endNodeId);
  
  if (!startNode) {
    throw new Error(`Start node ${member.startNodeId} not found for member ${member.id}`);
  }
  if (!endNode) {
    throw new Error(`End node ${member.endNodeId} not found for member ${member.id}`);
  }
  
  return { startNode, endNode };
}

/**
 * Get material properties for a member.
 */
export function getMemberMaterial(
  member: Member,
  model: StructuralModel
): { E: number } {
  const material = model.materials.find(m => m.id === member.materialId);
  
  if (!material) {
    throw new Error(`Material ${member.materialId} not found for member ${member.id}`);
  }
  
  return { E: material.E };
}

/**
 * Get section properties for a member.
 */
export function getMemberSection(
  member: Member,
  model: StructuralModel
): { A: number; I: number } {
  const section = model.sections.find(s => s.id === member.sectionId);
  
  if (!section) {
    throw new Error(`Section ${member.sectionId} not found for member ${member.id}`);
  }
  
  return { A: section.A, I: section.I };
}

/**
 * Compute distance between two nodes.
 */
export function distanceBetweenNodes(node1: Node, node2: Node): number {
  const dx = node2.x - node1.x;
  const dy = node2.y - node1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if two nodes are coincident (within tolerance).
 */
export function nodesAreCoincident(
  node1: Node,
  node2: Node,
  tolerance: number = 1e-10
): boolean {
  return distanceBetweenNodes(node1, node2) < tolerance;
}

/**
 * Find the centroid of a set of nodes.
 */
export function computeCentroid(nodes: Node[]): { x: number; y: number } {
  if (nodes.length === 0) {
    return { x: 0, y: 0 };
  }
  
  let sumX = 0;
  let sumY = 0;
  
  for (const node of nodes) {
    sumX += node.x;
    sumY += node.y;
  }
  
  return {
    x: sumX / nodes.length,
    y: sumY / nodes.length,
  };
}

/**
 * Compute bounding box of nodes.
 */
export function computeBoundingBox(nodes: Node[]): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  if (nodes.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }
  
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  
  for (const node of nodes) {
    minX = Math.min(minX, node.x);
    maxX = Math.max(maxX, node.x);
    minY = Math.min(minY, node.y);
    maxY = Math.max(maxY, node.y);
  }
  
  return { minX, maxX, minY, maxY };
}

/**
 * Compute characteristic length of the structure (for scaling).
 */
export function computeCharacteristicLength(model: StructuralModel): number {
  if (model.members.length === 0) {
    // Use bounding box diagonal
    const bbox = computeBoundingBox(model.nodes);
    const dx = bbox.maxX - bbox.minX;
    const dy = bbox.maxY - bbox.minY;
    return Math.sqrt(dx * dx + dy * dy) || 1;
  }
  
  // Use average member length
  let totalLength = 0;
  for (const member of model.members) {
    try {
      totalLength += getMemberLength(member, model.nodes);
    } catch {
      // Skip members with missing nodes
    }
  }
  
  return totalLength / model.members.length || 1;
}
