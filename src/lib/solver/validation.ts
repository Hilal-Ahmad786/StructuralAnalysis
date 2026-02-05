/**
 * Model Validation
 * 
 * Pre-solve validation checks to catch errors before they cause
 * numerical failures or incorrect results.
 * 
 * Categories:
 * - Geometry: zero-length members, duplicate nodes, disconnected parts
 * - Properties: missing material/section, invalid values
 * - Supports: insufficient, duplicates
 * - Loads: missing targets, invalid types
 */

import type { 
  StructuralModel, 
  LoadCase, 
  Node 
} from '@/types';
import type { 
  ValidationResult, 
  ValidationMessage 
} from '@/types/analysis';
import { distanceBetweenNodes, getMemberLength } from './geometry';

/**
 * Validate a structural model before solving.
 */
export function validateModel(
  model: StructuralModel,
  loadCase: LoadCase
): ValidationResult {
  const errors: ValidationMessage[] = [];
  const warnings: ValidationMessage[] = [];

  // Geometry checks
  validateNodes(model.nodes, errors, warnings);
  validateMembers(model, errors, warnings);
  validateConnectivity(model, errors, warnings);

  // Property checks
  validateMaterials(model, errors, warnings);
  validateSections(model, errors, warnings);

  // Support checks
  validateSupports(model, errors, warnings);

  // Load checks
  validateLoads(model, loadCase, errors, warnings);

  // Member releases check (not supported in MVP)
  validateNoReleases(model, errors, warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate nodes.
 */
function validateNodes(
  nodes: Node[],
  errors: ValidationMessage[],
  warnings: ValidationMessage[]
): void {
  if (nodes.length === 0) {
    errors.push({
      code: 'NO_NODES',
      severity: 'error',
      message: 'Model has no nodes',
    });
    return;
  }

  // Check for duplicate nodes (same coordinates)
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const n1 = nodes[i];
      const n2 = nodes[j];
      if (n1 && n2 && distanceBetweenNodes(n1, n2) < 1e-10) {
        warnings.push({
          code: 'DUPLICATE_NODES',
          severity: 'warning',
          message: `Nodes ${n1.id} and ${n2.id} have identical coordinates. Consider merging.`,
          entityType: 'node',
          entityId: n1.id,
        });
      }
    }
  }
}

/**
 * Validate members.
 */
function validateMembers(
  model: StructuralModel,
  errors: ValidationMessage[],
  _warnings: ValidationMessage[]
): void {
  if (model.members.length === 0) {
    errors.push({
      code: 'NO_MEMBERS',
      severity: 'error',
      message: 'Model has no members',
    });
    return;
  }

  const nodeIds = new Set(model.nodes.map(n => n.id));

  for (const member of model.members) {
    // Check node references
    if (!nodeIds.has(member.startNodeId)) {
      errors.push({
        code: 'INVALID_START_NODE',
        severity: 'error',
        message: `Member ${member.id}: start node ${member.startNodeId} does not exist`,
        entityType: 'member',
        entityId: member.id,
      });
      continue;
    }

    if (!nodeIds.has(member.endNodeId)) {
      errors.push({
        code: 'INVALID_END_NODE',
        severity: 'error',
        message: `Member ${member.id}: end node ${member.endNodeId} does not exist`,
        entityType: 'member',
        entityId: member.id,
      });
      continue;
    }

    // Check for zero-length member
    try {
      const length = getMemberLength(member, model.nodes);
      if (length < 1e-10) {
        errors.push({
          code: 'ZERO_LENGTH_MEMBER',
          severity: 'error',
          message: `Member ${member.id} has zero length (nodes ${member.startNodeId} and ${member.endNodeId} are coincident)`,
          entityType: 'member',
          entityId: member.id,
        });
      }
    } catch {
      // Node lookup failed, already reported above
    }

    // Check self-reference
    if (member.startNodeId === member.endNodeId) {
      errors.push({
        code: 'SELF_REFERENCE_MEMBER',
        severity: 'error',
        message: `Member ${member.id} references the same node for start and end`,
        entityType: 'member',
        entityId: member.id,
      });
    }
  }
}

/**
 * Validate model connectivity.
 */
function validateConnectivity(
  model: StructuralModel,
  errors: ValidationMessage[],
  warnings: ValidationMessage[]
): void {
  if (model.nodes.length === 0 || model.members.length === 0) {
    return;  // Already caught above
  }

  // Build adjacency list
  const adjacency = new Map<string, Set<string>>();
  for (const node of model.nodes) {
    adjacency.set(node.id, new Set());
  }

  for (const member of model.members) {
    const startAdj = adjacency.get(member.startNodeId);
    const endAdj = adjacency.get(member.endNodeId);
    if (startAdj) startAdj.add(member.endNodeId);
    if (endAdj) endAdj.add(member.startNodeId);
  }

  // Find disconnected nodes
  const connectedNodes = new Set<string>();
  for (const member of model.members) {
    connectedNodes.add(member.startNodeId);
    connectedNodes.add(member.endNodeId);
  }

  for (const node of model.nodes) {
    if (!connectedNodes.has(node.id)) {
      warnings.push({
        code: 'DISCONNECTED_NODE',
        severity: 'warning',
        message: `Node ${node.id} is not connected to any member`,
        entityType: 'node',
        entityId: node.id,
      });
    }
  }

  // Check for multiple disconnected components using BFS
  const visited = new Set<string>();
  const components: Set<string>[] = [];

  for (const node of model.nodes) {
    if (visited.has(node.id) || !connectedNodes.has(node.id)) continue;

    const component = new Set<string>();
    const queue = [node.id];

    while (queue.length > 0) {
      const current = queue.shift();
      if (current === undefined || visited.has(current)) continue;
      
      visited.add(current);
      component.add(current);

      const neighbors = adjacency.get(current);
      if (neighbors) {
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            queue.push(neighbor);
          }
        }
      }
    }

    components.push(component);
  }

  if (components.length > 1) {
    errors.push({
      code: 'DISCONNECTED_STRUCTURE',
      severity: 'error',
      message: `Structure has ${components.length} disconnected parts. All nodes must be connected.`,
    });
  }
}

/**
 * Validate materials.
 */
function validateMaterials(
  model: StructuralModel,
  errors: ValidationMessage[],
  warnings: ValidationMessage[]
): void {
  const materialIds = new Set(model.materials.map(m => m.id));

  for (const material of model.materials) {
    if (material.E <= 0) {
      errors.push({
        code: 'INVALID_MODULUS',
        severity: 'error',
        message: `Material ${material.id}: Young's modulus (E = ${material.E}) must be positive`,
        entityType: 'material',
        entityId: material.id,
      });
    }

    // Check for unrealistic values
    if (material.E < 1000) {  // Less than 1 MPa
      warnings.push({
        code: 'LOW_MODULUS',
        severity: 'warning',
        message: `Material ${material.id}: E = ${material.E} kPa seems unusually low`,
        entityType: 'material',
        entityId: material.id,
      });
    }

    if (material.E > 1e12) {  // More than 1000 GPa
      warnings.push({
        code: 'HIGH_MODULUS',
        severity: 'warning',
        message: `Material ${material.id}: E = ${material.E} kPa seems unusually high`,
        entityType: 'material',
        entityId: material.id,
      });
    }
  }

  // Check member material references
  for (const member of model.members) {
    if (!materialIds.has(member.materialId)) {
      errors.push({
        code: 'MISSING_MATERIAL',
        severity: 'error',
        message: `Member ${member.id}: material ${member.materialId} not found`,
        entityType: 'member',
        entityId: member.id,
      });
    }
  }
}

/**
 * Validate sections.
 */
function validateSections(
  model: StructuralModel,
  errors: ValidationMessage[],
  _warnings: ValidationMessage[]
): void {
  const sectionIds = new Set(model.sections.map(s => s.id));

  for (const section of model.sections) {
    if (section.A <= 0) {
      errors.push({
        code: 'INVALID_AREA',
        severity: 'error',
        message: `Section ${section.id}: Area (A = ${section.A}) must be positive`,
        entityType: 'section',
        entityId: section.id,
      });
    }

    if (section.I <= 0) {
      errors.push({
        code: 'INVALID_INERTIA',
        severity: 'error',
        message: `Section ${section.id}: Moment of inertia (I = ${section.I}) must be positive`,
        entityType: 'section',
        entityId: section.id,
      });
    }
  }

  // Check member section references
  for (const member of model.members) {
    if (!sectionIds.has(member.sectionId)) {
      errors.push({
        code: 'MISSING_SECTION',
        severity: 'error',
        message: `Member ${member.id}: section ${member.sectionId} not found`,
        entityType: 'member',
        entityId: member.id,
      });
    }
  }
}

/**
 * Validate supports.
 */
function validateSupports(
  model: StructuralModel,
  errors: ValidationMessage[],
  warnings: ValidationMessage[]
): void {
  if (model.supports.length === 0) {
    errors.push({
      code: 'NO_SUPPORTS',
      severity: 'error',
      message: 'No supports defined. Structure will be unstable.',
    });
    return;
  }

  const nodeIds = new Set(model.nodes.map(n => n.id));
  const supportedNodes = new Set<string>();

  for (const support of model.supports) {
    if (!nodeIds.has(support.nodeId)) {
      errors.push({
        code: 'INVALID_SUPPORT_NODE',
        severity: 'error',
        message: `Support references non-existent node ${support.nodeId}`,
        entityType: 'support',
        entityId: support.nodeId,
      });
      continue;
    }

    if (supportedNodes.has(support.nodeId)) {
      warnings.push({
        code: 'DUPLICATE_SUPPORT',
        severity: 'warning',
        message: `Multiple supports defined for node ${support.nodeId}`,
        entityType: 'support',
        entityId: support.nodeId,
      });
    }
    supportedNodes.add(support.nodeId);

    // Check if support provides any restraint
    if (!support.dx && !support.dy && !support.rz) {
      warnings.push({
        code: 'EMPTY_SUPPORT',
        severity: 'warning',
        message: `Support at node ${support.nodeId} provides no restraints`,
        entityType: 'support',
        entityId: support.nodeId,
      });
    }
  }

  // Count restrained DOFs
  let restrainedDOFs = 0;
  for (const support of model.supports) {
    if (support.dx) restrainedDOFs++;
    if (support.dy) restrainedDOFs++;
    if (support.rz) restrainedDOFs++;
  }

  if (restrainedDOFs < 3) {
    warnings.push({
      code: 'FEW_RESTRAINTS',
      severity: 'warning',
      message: `Only ${restrainedDOFs} DOF(s) restrained. A 2D structure typically needs at least 3 for stability.`,
    });
  }
}

/**
 * Validate loads.
 */
function validateLoads(
  model: StructuralModel,
  loadCase: LoadCase,
  errors: ValidationMessage[],
  warnings: ValidationMessage[]
): void {
  if (loadCase.loads.length === 0) {
    warnings.push({
      code: 'NO_LOADS',
      severity: 'warning',
      message: 'No loads defined. Results will be zero.',
    });
    return;
  }

  const nodeIds = new Set(model.nodes.map(n => n.id));
  const memberIds = new Set(model.members.map(m => m.id));
  const trussIds = new Set(
    model.members.filter(m => m.type === 'truss').map(m => m.id)
  );

  for (const load of loadCase.loads) {
    if (load.target === 'node') {
      if (!nodeIds.has(load.targetId)) {
        errors.push({
          code: 'INVALID_LOAD_NODE',
          severity: 'error',
          message: `Load references non-existent node ${load.targetId}`,
          entityType: 'load',
          entityId: load.id,
        });
      }

      // Check for zero load
      const fx = load.fx ?? 0;
      const fy = load.fy ?? 0;
      const mz = load.mz ?? 0;
      if (Math.abs(fx) < 1e-15 && Math.abs(fy) < 1e-15 && Math.abs(mz) < 1e-15) {
        warnings.push({
          code: 'ZERO_LOAD',
          severity: 'warning',
          message: `Load ${load.id} has zero magnitude`,
          entityType: 'load',
          entityId: load.id,
        });
      }
    } else if (load.target === 'member') {
      if (!memberIds.has(load.targetId)) {
        errors.push({
          code: 'INVALID_LOAD_MEMBER',
          severity: 'error',
          message: `Load references non-existent member ${load.targetId}`,
          entityType: 'load',
          entityId: load.id,
        });
      }

      // Distributed loads not allowed on truss members
      if (trussIds.has(load.targetId)) {
        errors.push({
          code: 'DISTRIBUTED_LOAD_ON_TRUSS',
          severity: 'error',
          message: `Distributed loads not supported on truss members (member ${load.targetId})`,
          entityType: 'load',
          entityId: load.id,
        });
      }

      // Check for zero load
      if (Math.abs(load.w ?? 0) < 1e-15) {
        warnings.push({
          code: 'ZERO_LOAD',
          severity: 'warning',
          message: `Load ${load.id} has zero magnitude`,
          entityType: 'load',
          entityId: load.id,
        });
      }
    }
  }
}

/**
 * Validate that no member releases are used (not supported in MVP).
 */
function validateNoReleases(
  model: StructuralModel,
  errors: ValidationMessage[],
  _warnings: ValidationMessage[]
): void {
  for (const member of model.members) {
    if (member.releases) {
      if (member.releases.startMoment || member.releases.endMoment) {
        errors.push({
          code: 'RELEASES_NOT_SUPPORTED',
          severity: 'error',
          message: `Member ${member.id}: End releases (hinges) are not supported in this version. ` +
                   `To model a hinge, split the member at the hinge location.`,
          entityType: 'member',
          entityId: member.id,
        });
      }
    }
  }
}
