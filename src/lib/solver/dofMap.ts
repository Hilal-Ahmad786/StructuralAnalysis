/**
 * DOF (Degrees of Freedom) Mapping
 * 
 * Handles assignment of DOF indices to nodes based on element types.
 * 
 * KEY RULES (per spec addendum v2.1):
 * 
 * 1. A node has rotation DOF (rz) if and only if:
 *    - It is connected to at least one FRAME element, OR
 *    - It has a support with rotational restraint (rz = true), OR
 *    - It has an applied nodal moment (Mz ≠ 0)
 * 
 * 2. Otherwise, the node has only translational DOFs (ux, uy)
 * 
 * 3. DOF indices are assigned in sorted order by node ID (for determinism)
 */

import type { 
  Member, 
  Support, 
  LoadCase, 
  StructuralModel 
} from '@/types';
import type { 
  DOFMap, 
  NodeDOFInfo, 
  DOFMapResult, 
  SolverError 
} from '@/types/analysis';

// Re-export the type for use in other modules
export type { DOFMap };

/**
 * Determine which nodes need a rotation DOF.
 */
function identifyNodesNeedingRotation(
  model: StructuralModel,
  loadCase: LoadCase
): Set<string> {
  const nodesNeedingRotation = new Set<string>();

  // 1. Nodes connected to frame elements
  for (const member of model.members) {
    if (member.type === 'frame') {
      nodesNeedingRotation.add(member.startNodeId);
      nodesNeedingRotation.add(member.endNodeId);
    }
  }

  // 2. Nodes with rotational support restraint
  for (const support of model.supports) {
    if (support.rz === true) {
      nodesNeedingRotation.add(support.nodeId);
    }
  }

  // 3. Nodes with applied moment loads
  for (const load of loadCase.loads) {
    if (
      load.target === 'node' &&
      load.mz !== undefined &&
      Math.abs(load.mz) > 1e-15
    ) {
      nodesNeedingRotation.add(load.targetId);
    }
  }

  return nodesNeedingRotation;
}

/**
 * Check for invalid moment loads on truss-only nodes.
 * Returns an error if a moment is applied to a node with no frame members.
 */
function validateMomentLoads(
  model: StructuralModel,
  loadCase: LoadCase
): SolverError | null {
  // Build set of nodes connected to frame members
  const nodesWithFrames = new Set<string>();
  for (const member of model.members) {
    if (member.type === 'frame') {
      nodesWithFrames.add(member.startNodeId);
      nodesWithFrames.add(member.endNodeId);
    }
  }

  // Check each moment load
  for (const load of loadCase.loads) {
    if (
      load.target === 'node' &&
      load.mz !== undefined &&
      Math.abs(load.mz) > 1e-15
    ) {
      if (!nodesWithFrames.has(load.targetId)) {
        return {
          code: 'DOF_MAP_ERROR',
          message: `Cannot apply moment (Mz = ${load.mz.toFixed(2)}) at Node ${load.targetId}: ` +
                   `no connected frame members provide rotational stiffness. ` +
                   `Convert at least one connected member to FRAME type.`,
          details: {
            problematicNodes: [load.targetId],
            suggestedFixes: [
              `Convert a member connected to ${load.targetId} from TRUSS to FRAME`,
              `Remove the moment load if not needed`,
            ],
          },
        };
      }
    }
  }

  return null;
}

/**
 * Build the DOF map for a structural model.
 * 
 * @param model - Structural model with nodes, members, supports
 * @param loadCase - Load case (needed to check for moment loads)
 * @returns DOFMapResult with success/failure and DOF map or error
 */
export function buildDOFMap(
  model: StructuralModel,
  loadCase: LoadCase
): DOFMapResult {
  // Validate moment loads first
  const momentError = validateMomentLoads(model, loadCase);
  if (momentError) {
    return { success: false, error: momentError };
  }

  // Identify nodes needing rotation DOF
  const nodesNeedingRotation = identifyNodesNeedingRotation(model, loadCase);

  // Sort nodes by ID for deterministic ordering
  const sortedNodes = [...model.nodes].sort((a, b) => a.id.localeCompare(b.id));

  // Assign DOF indices
  const nodeInfo = new Map<string, NodeDOFInfo>();
  let currentDOF = 0;

  for (const node of sortedNodes) {
    const hasRotationDOF = nodesNeedingRotation.has(node.id);
    const dofCount = hasRotationDOF ? 3 : 2;

    const globalDOFIndices: number[] = [];
    for (let i = 0; i < dofCount; i++) {
      globalDOFIndices.push(currentDOF++);
    }

    nodeInfo.set(node.id, {
      nodeId: node.id,
      hasRotationDOF,
      globalDOFIndices,
    });
  }

  return {
    success: true,
    dofMap: {
      nodeInfo,
      totalDOFs: currentDOF,
    },
  };
}

/**
 * Get the global DOF indices for a truss element.
 * 
 * Truss elements only use translational DOFs (ux, uy) at each node.
 * Returns [ux1, uy1, ux2, uy2] indices.
 */
export function getTrussElementDOFs(
  member: Member,
  dofMap: DOFMap
): number[] {
  const startInfo = dofMap.nodeInfo.get(member.startNodeId);
  const endInfo = dofMap.nodeInfo.get(member.endNodeId);

  if (!startInfo) {
    throw new Error(`Node ${member.startNodeId} not found in DOF map`);
  }
  if (!endInfo) {
    throw new Error(`Node ${member.endNodeId} not found in DOF map`);
  }

  // Truss elements only use first 2 DOFs (ux, uy) at each node
  const startUx = startInfo.globalDOFIndices[0];
  const startUy = startInfo.globalDOFIndices[1];
  const endUx = endInfo.globalDOFIndices[0];
  const endUy = endInfo.globalDOFIndices[1];

  if (startUx === undefined || startUy === undefined ||
      endUx === undefined || endUy === undefined) {
    throw new Error(`Invalid DOF indices for truss element ${member.id}`);
  }

  return [startUx, startUy, endUx, endUy];
}

/**
 * Get the global DOF indices for a frame element.
 * 
 * Frame elements use all 3 DOFs (ux, uy, rz) at each node.
 * Returns [ux1, uy1, rz1, ux2, uy2, rz2] indices.
 */
export function getFrameElementDOFs(
  member: Member,
  dofMap: DOFMap
): number[] {
  const startInfo = dofMap.nodeInfo.get(member.startNodeId);
  const endInfo = dofMap.nodeInfo.get(member.endNodeId);

  if (!startInfo) {
    throw new Error(`Node ${member.startNodeId} not found in DOF map`);
  }
  if (!endInfo) {
    throw new Error(`Node ${member.endNodeId} not found in DOF map`);
  }

  // Frame elements require rotation DOF at both ends
  if (!startInfo.hasRotationDOF) {
    throw new Error(
      `Frame element ${member.id} requires rotation DOF at start node ${member.startNodeId}`
    );
  }
  if (!endInfo.hasRotationDOF) {
    throw new Error(
      `Frame element ${member.id} requires rotation DOF at end node ${member.endNodeId}`
    );
  }

  const startUx = startInfo.globalDOFIndices[0];
  const startUy = startInfo.globalDOFIndices[1];
  const startRz = startInfo.globalDOFIndices[2];
  const endUx = endInfo.globalDOFIndices[0];
  const endUy = endInfo.globalDOFIndices[1];
  const endRz = endInfo.globalDOFIndices[2];

  if (startUx === undefined || startUy === undefined || startRz === undefined ||
      endUx === undefined || endUy === undefined || endRz === undefined) {
    throw new Error(`Invalid DOF indices for frame element ${member.id}`);
  }

  return [startUx, startUy, startRz, endUx, endUy, endRz];
}

/**
 * Get element DOF indices based on member type.
 */
export function getElementDOFs(member: Member, dofMap: DOFMap): number[] {
  if (member.type === 'truss') {
    return getTrussElementDOFs(member, dofMap);
  } else {
    return getFrameElementDOFs(member, dofMap);
  }
}

/**
 * Get restrained DOF indices from supports.
 */
export function getRestrainedDOFs(
  supports: Support[],
  dofMap: DOFMap
): number[] {
  const restrainedDOFs: number[] = [];

  for (const support of supports) {
    const nodeInfo = dofMap.nodeInfo.get(support.nodeId);
    if (!nodeInfo) {
      throw new Error(`Support node ${support.nodeId} not found in DOF map`);
    }

    const [uxIdx, uyIdx, rzIdx] = nodeInfo.globalDOFIndices;

    if (support.dx && uxIdx !== undefined) {
      restrainedDOFs.push(uxIdx);
    }
    if (support.dy && uyIdx !== undefined) {
      restrainedDOFs.push(uyIdx);
    }
    if (support.rz && rzIdx !== undefined && nodeInfo.hasRotationDOF) {
      restrainedDOFs.push(rzIdx);
    }
  }

  // Sort for consistency
  restrainedDOFs.sort((a, b) => a - b);

  return restrainedDOFs;
}

/**
 * Get free (unrestrained) DOF indices.
 */
export function getFreeDOFs(totalDOFs: number, restrainedDOFs: number[]): number[] {
  const restrainedSet = new Set(restrainedDOFs);
  const freeDOFs: number[] = [];

  for (let i = 0; i < totalDOFs; i++) {
    if (!restrainedSet.has(i)) {
      freeDOFs.push(i);
    }
  }

  return freeDOFs;
}

/**
 * Get the node ID and DOF direction from a global DOF index.
 */
export function getDOFInfo(
  dofIndex: number,
  dofMap: DOFMap
): { nodeId: string; direction: 'ux' | 'uy' | 'rz' } | null {
  for (const [nodeId, info] of dofMap.nodeInfo) {
    const idx = info.globalDOFIndices.indexOf(dofIndex);
    if (idx !== -1) {
      const directions: Array<'ux' | 'uy' | 'rz'> = ['ux', 'uy', 'rz'];
      const direction = directions[idx];
      if (direction) {
        return { nodeId, direction };
      }
    }
  }
  return null;
}
