/**
 * Zod Validation Schemas
 * 
 * Runtime validation for API inputs and form data.
 */

import { z } from 'zod';

// ============================================================================
// Primitive Schemas
// ============================================================================

export const nodeIdSchema = z.string().min(1).max(20);
export const memberIdSchema = z.string().min(1).max(20);
export const materialIdSchema = z.string().min(1).max(20);
export const sectionIdSchema = z.string().min(1).max(20);
export const loadCaseIdSchema = z.string().uuid();

// ============================================================================
// Geometry Schemas
// ============================================================================

export const coordinateSchema = z.number().finite();

export const nodeSchema = z.object({
  id: nodeIdSchema,
  x: coordinateSchema,
  y: coordinateSchema,
});

export const memberTypeSchema = z.enum(['frame', 'truss']);

export const memberSchema = z.object({
  id: memberIdSchema,
  type: memberTypeSchema,
  startNodeId: nodeIdSchema,
  endNodeId: nodeIdSchema,
  materialId: materialIdSchema,
  sectionId: sectionIdSchema,
});

// ============================================================================
// Material & Section Schemas
// ============================================================================

export const materialSchema = z.object({
  id: materialIdSchema,
  name: z.string().min(1).max(50),
  E: z.number().positive().describe('Elastic modulus in kPa'),
});

export const sectionSchema = z.object({
  id: sectionIdSchema,
  name: z.string().min(1).max(50),
  A: z.number().positive().describe('Cross-sectional area in m²'),
  I: z.number().nonnegative().describe('Moment of inertia in m⁴'),
});

// ============================================================================
// Support Schemas
// ============================================================================

export const supportSchema = z.object({
  nodeId: nodeIdSchema,
  dx: z.boolean().describe('Restrain X translation'),
  dy: z.boolean().describe('Restrain Y translation'),
  rz: z.boolean().describe('Restrain Z rotation'),
});

// Predefined support types
export const supportTypeSchema = z.enum(['fixed', 'pinned', 'roller-x', 'roller-y', 'custom']);

// ============================================================================
// Load Schemas
// ============================================================================

export const loadTypeSchema = z.enum(['point', 'distributed']);
export const loadTargetSchema = z.enum(['node', 'member']);
export const loadDirectionSchema = z.enum(['local-x', 'local-y', 'global-x', 'global-y']);

export const pointLoadSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('point'),
  target: z.literal('node'),
  targetId: nodeIdSchema,
  fx: z.number().optional().describe('Force in X direction (kN)'),
  fy: z.number().optional().describe('Force in Y direction (kN)'),
  mz: z.number().optional().describe('Moment about Z axis (kN·m)'),
});

export const distributedLoadSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('distributed'),
  target: z.literal('member'),
  targetId: memberIdSchema,
  w: z.number().describe('Load intensity (kN/m)'),
  direction: loadDirectionSchema.default('local-y'),
});

export const loadSchema = z.discriminatedUnion('type', [
  pointLoadSchema,
  distributedLoadSchema,
]);

export const loadCaseTypeSchema = z.enum(['dead', 'live', 'wind', 'snow', 'seismic', 'other']);

export const loadCaseSchema = z.object({
  id: loadCaseIdSchema,
  name: z.string().min(1).max(50),
  type: loadCaseTypeSchema,
  loads: z.array(loadSchema),
});

// ============================================================================
// Model Schemas
// ============================================================================

export const structuralModelSchema = z.object({
  nodes: z.array(nodeSchema).min(1).describe('Must have at least one node'),
  members: z.array(memberSchema),
  materials: z.array(materialSchema).min(1).describe('Must have at least one material'),
  sections: z.array(sectionSchema).min(1).describe('Must have at least one section'),
  supports: z.array(supportSchema),
});

// ============================================================================
// Project Schemas
// ============================================================================

export const projectDataSchema = z.object({
  model: structuralModelSchema,
  loadCases: z.array(loadCaseSchema),
  units: z.object({
    length: z.string(),
    force: z.string(),
    stress: z.string(),
  }).optional(),
  settings: z.object({
    maxIterations: z.number().int().positive().default(100),
    tolerance: z.number().positive().default(1e-10),
    includeShearDeformation: z.boolean().default(false),
  }).optional(),
});

export const createProjectSchema = z.object({
  name: z.string().min(1).max(100).default('Untitled Project'),
  data: projectDataSchema.optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  data: projectDataSchema.optional(),
});

// ============================================================================
// Share Link Schemas
// ============================================================================

export const createShareLinkSchema = z.object({
  projectId: z.string().uuid(),
  expiresAt: z.string().datetime().nullable().optional(),
});

// ============================================================================
// API Response Schemas
// ============================================================================

export const apiErrorSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  details: z.record(z.unknown()).optional(),
});

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

// ============================================================================
// Type Exports
// ============================================================================

export type Node = z.infer<typeof nodeSchema>;
export type Member = z.infer<typeof memberSchema>;
export type Material = z.infer<typeof materialSchema>;
export type Section = z.infer<typeof sectionSchema>;
export type Support = z.infer<typeof supportSchema>;
export type PointLoad = z.infer<typeof pointLoadSchema>;
export type DistributedLoad = z.infer<typeof distributedLoadSchema>;
export type Load = z.infer<typeof loadSchema>;
export type LoadCase = z.infer<typeof loadCaseSchema>;
export type StructuralModel = z.infer<typeof structuralModelSchema>;
export type ProjectData = z.infer<typeof projectDataSchema>;
export type CreateProject = z.infer<typeof createProjectSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;
