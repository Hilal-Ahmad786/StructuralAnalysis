/**
 * Model Validation Utilities
 * 
 * High-level validation for structural models before analysis.
 * Uses Zod schemas for structure validation and custom rules for engineering checks.
 */

import { structuralModelSchema, loadCaseSchema } from '@/schemas';
import type { StructuralModel, LoadCase } from '@/types';

// ============================================================================
// Types
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  entityId?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  entityId?: string;
}

// ============================================================================
// Model Validation
// ============================================================================

/**
 * Validate a structural model for analysis
 */
export function validateModel(model: StructuralModel): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // 1. Schema validation
  const schemaResult = structuralModelSchema.safeParse(model);
  if (!schemaResult.success) {
    schemaResult.error.errors.forEach((err) => {
      errors.push({
        code: 'SCHEMA_ERROR',
        message: err.message,
        field: err.path.join('.'),
      });
    });
    return { valid: false, errors, warnings };
  }

  // 2. Check for minimum nodes
  if (model.nodes.length === 0) {
    errors.push({
      code: 'NO_NODES',
      message: 'Model must have at least one node',
    });
  }

  // 3. Check for members (can have 0 members for node-only models)
  if (model.members.length === 0 && model.nodes.length > 1) {
    warnings.push({
      code: 'NO_MEMBERS',
      message: 'Model has nodes but no members',
    });
  }

  // 4. Check for supports
  if (model.supports.length === 0) {
    errors.push({
      code: 'NO_SUPPORTS',
      message: 'Model must have at least one support',
    });
  }

  // 5. Validate member references
  const nodeIds = new Set(model.nodes.map((n) => n.id));
  const materialIds = new Set(model.materials.map((m) => m.id));
  const sectionIds = new Set(model.sections.map((s) => s.id));

  for (const member of model.members) {
    if (!nodeIds.has(member.startNodeId)) {
      errors.push({
        code: 'INVALID_NODE_REF',
        message: `Member ${member.id} references non-existent start node ${member.startNodeId}`,
        entityId: member.id,
      });
    }
    if (!nodeIds.has(member.endNodeId)) {
      errors.push({
        code: 'INVALID_NODE_REF',
        message: `Member ${member.id} references non-existent end node ${member.endNodeId}`,
        entityId: member.id,
      });
    }
    if (!materialIds.has(member.materialId)) {
      errors.push({
        code: 'INVALID_MATERIAL_REF',
        message: `Member ${member.id} references non-existent material ${member.materialId}`,
        entityId: member.id,
      });
    }
    if (!sectionIds.has(member.sectionId)) {
      errors.push({
        code: 'INVALID_SECTION_REF',
        message: `Member ${member.id} references non-existent section ${member.sectionId}`,
        entityId: member.id,
      });
    }
    if (member.startNodeId === member.endNodeId) {
      errors.push({
        code: 'ZERO_LENGTH_MEMBER',
        message: `Member ${member.id} has same start and end node`,
        entityId: member.id,
      });
    }
  }

  // 6. Validate support references
  for (const support of model.supports) {
    if (!nodeIds.has(support.nodeId)) {
      errors.push({
        code: 'INVALID_SUPPORT_NODE',
        message: `Support references non-existent node ${support.nodeId}`,
        entityId: support.nodeId,
      });
    }
  }

  // 7. Check for duplicate node IDs
  const seenNodeIds = new Set<string>();
  for (const node of model.nodes) {
    if (seenNodeIds.has(node.id)) {
      errors.push({
        code: 'DUPLICATE_NODE_ID',
        message: `Duplicate node ID: ${node.id}`,
        entityId: node.id,
      });
    }
    seenNodeIds.add(node.id);
  }

  // 8. Check for duplicate member IDs
  const seenMemberIds = new Set<string>();
  for (const member of model.members) {
    if (seenMemberIds.has(member.id)) {
      errors.push({
        code: 'DUPLICATE_MEMBER_ID',
        message: `Duplicate member ID: ${member.id}`,
        entityId: member.id,
      });
    }
    seenMemberIds.add(member.id);
  }

  // 9. Check for overlapping nodes
  for (let i = 0; i < model.nodes.length; i++) {
    for (let j = i + 1; j < model.nodes.length; j++) {
      const n1 = model.nodes[i]!;
      const n2 = model.nodes[j]!;
      const dist = Math.sqrt((n1.x - n2.x) ** 2 + (n1.y - n2.y) ** 2);
      if (dist < 1e-6) {
        warnings.push({
          code: 'OVERLAPPING_NODES',
          message: `Nodes ${n1.id} and ${n2.id} are at the same location`,
        });
      }
    }
  }

  // 10. Check member lengths
  for (const member of model.members) {
    const startNode = model.nodes.find((n) => n.id === member.startNodeId);
    const endNode = model.nodes.find((n) => n.id === member.endNodeId);
    if (startNode && endNode) {
      const length = Math.sqrt(
        (endNode.x - startNode.x) ** 2 + (endNode.y - startNode.y) ** 2
      );
      if (length < 0.001) {
        errors.push({
          code: 'VERY_SHORT_MEMBER',
          message: `Member ${member.id} is extremely short (${length.toExponential(2)} m)`,
          entityId: member.id,
        });
      }
    }
  }

  // 11. Check for truss members with zero moment of inertia
  for (const member of model.members) {
    if (member.type === 'frame') {
      const section = model.sections.find((s) => s.id === member.sectionId);
      if (section && section.I === 0) {
        warnings.push({
          code: 'FRAME_ZERO_INERTIA',
          message: `Frame member ${member.id} has zero moment of inertia`,
          entityId: member.id,
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// Load Case Validation
// ============================================================================

/**
 * Validate a load case
 */
export function validateLoadCase(
  loadCase: LoadCase,
  model: StructuralModel
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Schema validation
  const schemaResult = loadCaseSchema.safeParse(loadCase);
  if (!schemaResult.success) {
    schemaResult.error.errors.forEach((err) => {
      errors.push({
        code: 'SCHEMA_ERROR',
        message: err.message,
        field: err.path.join('.'),
      });
    });
    return { valid: false, errors, warnings };
  }

  const nodeIds = new Set(model.nodes.map((n) => n.id));
  const memberIds = new Set(model.members.map((m) => m.id));

  // Validate load references
  for (const load of loadCase.loads) {
    if (load.target === 'node' && !nodeIds.has(load.targetId)) {
      errors.push({
        code: 'INVALID_LOAD_TARGET',
        message: `Load references non-existent node ${load.targetId}`,
        entityId: load.id,
      });
    }
    if (load.target === 'member' && !memberIds.has(load.targetId)) {
      errors.push({
        code: 'INVALID_LOAD_TARGET',
        message: `Load references non-existent member ${load.targetId}`,
        entityId: load.id,
      });
    }
  }

  // Check for zero-magnitude loads
  for (const load of loadCase.loads) {
    if (load.type === 'point') {
      const fx = load.fx ?? 0;
      const fy = load.fy ?? 0;
      const mz = load.mz ?? 0;
      if (Math.abs(fx) + Math.abs(fy) + Math.abs(mz) < 1e-10) {
        warnings.push({
          code: 'ZERO_LOAD',
          message: `Point load on node ${load.targetId} has zero magnitude`,
          entityId: load.id,
        });
      }
    }
    if (load.type === 'distributed') {
      const w = load.w ?? 0;
      if (Math.abs(w) < 1e-10) {
        warnings.push({
          code: 'ZERO_LOAD',
          message: `Distributed load on member ${load.targetId} has zero intensity`,
          entityId: load.id,
        });
      }
    }
  }

  // Check for empty load case
  if (loadCase.loads.length === 0) {
    warnings.push({
      code: 'EMPTY_LOAD_CASE',
      message: 'Load case has no loads',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// Quick Checks
// ============================================================================

/**
 * Check if model is ready for analysis
 */
export function isModelReady(model: StructuralModel): boolean {
  return (
    model.nodes.length > 0 &&
    model.members.length > 0 &&
    model.supports.length > 0 &&
    model.materials.length > 0 &&
    model.sections.length > 0
  );
}

/**
 * Check minimum restraint requirements (quick check)
 */
export function hasMinimumRestraints(model: StructuralModel): boolean {
  let totalRestraints = 0;
  for (const support of model.supports) {
    if (support.dx) totalRestraints++;
    if (support.dy) totalRestraints++;
    if (support.rz) totalRestraints++;
  }
  // 2D requires at least 3 restraints to prevent rigid body motion
  return totalRestraints >= 3;
}
