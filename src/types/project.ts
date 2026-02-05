/**
 * Structural Analysis App - Core Types
 * 
 * UNIT CONVENTIONS (Canonical Internal Units):
 * - Length: meters (m)
 * - Force: kilonewtons (kN)
 * - Moment: kilonewton-meters (kN·m)
 * - Stress/Modulus: kilopascals (kPa = kN/m²)
 * - Area: square meters (m²)
 * - Moment of Inertia: m⁴
 */

import type { AnalysisRun } from './analysis';

// ============================================================================
// UNITS
// ============================================================================

export type LengthUnit = 'm' | 'cm' | 'mm' | 'ft' | 'in';
export type ForceUnit = 'kN' | 'N' | 'kip' | 'lbf';
export type StressUnit = 'kPa' | 'MPa' | 'GPa' | 'psi' | 'ksi';
export type MomentUnit = 'kN·m' | 'N·m' | 'kip·ft' | 'lbf·ft';

export interface Units {
  length: LengthUnit;
  force: ForceUnit;
  stress: StressUnit;
}

// ============================================================================
// GEOMETRY
// ============================================================================

export interface Node {
  id: string;
  x: number; // meters (canonical)
  y: number; // meters (canonical)
}

export type MemberType = 'truss' | 'frame';

export interface Member {
  id: string;
  type: MemberType;
  startNodeId: string;
  endNodeId: string;
  materialId: string;
  sectionId: string;
  // Reserved for V1 - not supported in MVP
  releases?: MemberReleases;
}

export interface MemberReleases {
  startMoment?: boolean;
  endMoment?: boolean;
}

// ============================================================================
// MATERIALS & SECTIONS
// ============================================================================

export interface Material {
  id: string;
  name: string;
  E: number;       // Young's modulus in kPa (canonical)
  density?: number; // kN/m³ (for self-weight, future)
  alpha?: number;  // Thermal expansion coefficient (1/°C), e.g., 12e-6 for steel
}

export interface Section {
  id: string;
  name: string;
  A: number;  // Cross-sectional area in m² (canonical)
  I: number;  // Moment of inertia in m⁴ (canonical)
  h?: number; // Section depth in m (for thermal gradient calculations)
  shape?: SectionShape;
  dimensions?: Record<string, number>;
}

export type SectionShape = 'rectangle' | 'circle' | 'i-beam' | 'custom';

// ============================================================================
// SUPPORTS
// ============================================================================

export interface Support {
  nodeId: string;
  dx: boolean; // Restrained in X
  dy: boolean; // Restrained in Y
  rz: boolean; // Rotational restraint (2D)
  // Support settlements (prescribed displacements)
  settlementDx?: number; // Prescribed X displacement (m)
  settlementDy?: number; // Prescribed Y displacement (m)
  settlementRz?: number; // Prescribed rotation (rad)
}

export type SupportType = 'fixed' | 'pinned' | 'rollerX' | 'rollerY';

// Helper to create support from type
export function createSupport(nodeId: string, type: SupportType): Support {
  switch (type) {
    case 'fixed':
      return { nodeId, dx: true, dy: true, rz: true };
    case 'pinned':
      return { nodeId, dx: true, dy: true, rz: false };
    case 'rollerX':
      return { nodeId, dx: false, dy: true, rz: false };
    case 'rollerY':
      return { nodeId, dx: true, dy: false, rz: false };
  }
}

// ============================================================================
// LOADS
// ============================================================================

export type LoadTargetType = 'node' | 'member';

export type LoadDirection = 'localY' | 'localNegY' | 'globalY' | 'globalNegY';

export type LoadType = 'point' | 'distributed' | 'moment' | 'temperature';

export interface Load {
  id: string;
  type: LoadType;
  target: LoadTargetType;
  targetId: string;

  // Point load on node (in global coordinates)
  fx?: number; // kN
  fy?: number; // kN
  mz?: number; // kN·m

  // Distributed load on member
  w?: number;              // kN/m (magnitude for UDL)
  wStart?: number;         // kN/m (start value for triangular/trapezoidal)
  wEnd?: number;           // kN/m (end value for triangular/trapezoidal)
  direction?: LoadDirection;

  // Point load position along member (0 = start, 1 = end)
  position?: number;       // For point loads on members

  // Temperature load on member
  deltaT?: number;         // Uniform temperature change (°C)
  gradT?: number;          // Temperature gradient top-bottom (°C)
}

export type LoadCaseType = 'dead' | 'live' | 'wind' | 'snow' | 'seismic' | 'other';

export interface LoadCase {
  id: string;
  name: string;
  type: LoadCaseType;
  loads: Load[];
}

// ============================================================================
// LOAD COMBINATIONS
// ============================================================================

export interface LoadCombinationFactor {
  loadCaseId: string;
  factor: number;
}

export interface LoadCombination {
  id: string;
  name: string;
  code?: string; // e.g., "ASCE 7-22", "Eurocode 0"
  factors: LoadCombinationFactor[];
}

// Common load combination presets
export const LOAD_COMBINATION_PRESETS = {
  'ASCE7-LRFD': [
    { name: '1.4D', factors: { dead: 1.4 } },
    { name: '1.2D + 1.6L', factors: { dead: 1.2, live: 1.6 } },
    { name: '1.2D + 1.0L + 1.0W', factors: { dead: 1.2, live: 1.0, wind: 1.0 } },
    { name: '1.2D + 1.0L + 1.0E', factors: { dead: 1.2, live: 1.0, seismic: 1.0 } },
    { name: '0.9D + 1.0W', factors: { dead: 0.9, wind: 1.0 } },
    { name: '0.9D + 1.0E', factors: { dead: 0.9, seismic: 1.0 } },
  ],
  'ASCE7-ASD': [
    { name: 'D', factors: { dead: 1.0 } },
    { name: 'D + L', factors: { dead: 1.0, live: 1.0 } },
    { name: 'D + 0.75L + 0.75W', factors: { dead: 1.0, live: 0.75, wind: 0.75 } },
    { name: 'D + 0.7E', factors: { dead: 1.0, seismic: 0.7 } },
    { name: '0.6D + 0.7E', factors: { dead: 0.6, seismic: 0.7 } },
  ],
  'Eurocode': [
    { name: '1.35G', factors: { dead: 1.35 } },
    { name: '1.35G + 1.5Q', factors: { dead: 1.35, live: 1.5 } },
    { name: '1.35G + 1.5Q + 0.9W', factors: { dead: 1.35, live: 1.5, wind: 0.9 } },
    { name: '1.0G + 1.5W', factors: { dead: 1.0, wind: 1.5 } },
    { name: '1.0G + 1.0E', factors: { dead: 1.0, seismic: 1.0 } },
  ],
} as const;

// ============================================================================
// SOLVER SETTINGS
// ============================================================================

export interface SolverSettings {
  maxIterations: number;
  tolerance: number;
  includeShearDeformation: boolean;
  // P-Delta (second-order) analysis settings
  pDeltaEnabled: boolean;
  pDeltaMaxIterations: number;
  pDeltaConvergenceTol: number;
}

export const DEFAULT_SOLVER_SETTINGS: SolverSettings = {
  maxIterations: 100,
  tolerance: 1e-10,
  includeShearDeformation: false,
  pDeltaEnabled: false,
  pDeltaMaxIterations: 10,
  pDeltaConvergenceTol: 1e-4,
};

// ============================================================================
// MODEL STRUCTURE
// ============================================================================

export interface StructuralModel {
  nodes: Node[];
  members: Member[];
  materials: Material[];
  sections: Section[];
  supports: Support[];
}

// ============================================================================
// PROJECT
// ============================================================================

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  version: number; // Schema version for migrations
  units: Units;
  settings: SolverSettings;
  model: StructuralModel;
  loadCases: LoadCase[];
  loadCombinations: LoadCombination[];
  analysisRuns: AnalysisRun[];
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_UNITS: Units = {
  length: 'm',
  force: 'kN',
  stress: 'MPa',
};

export const DEFAULT_MATERIALS: Material[] = [
  { id: 'steel-s235', name: 'Steel S235', E: 210_000_000, alpha: 12e-6 }, // 210 GPa in kPa, 12×10⁻⁶ /°C
  { id: 'steel-s355', name: 'Steel S355', E: 210_000_000, alpha: 12e-6 },
  { id: 'concrete-c30', name: 'Concrete C30/37', E: 33_000_000, alpha: 10e-6 }, // ~33 GPa, 10×10⁻⁶ /°C
  { id: 'aluminum-6061', name: 'Aluminum 6061', E: 68_900_000, alpha: 23e-6 }, // ~69 GPa, 23×10⁻⁶ /°C
];

export const DEFAULT_SECTIONS: Section[] = [
  { id: 'ipe-200', name: 'IPE 200', A: 0.002848, I: 0.0000194, h: 0.200 },
  { id: 'ipe-300', name: 'IPE 300', A: 0.005382, I: 0.0000836, h: 0.300 },
  { id: 'heb-200', name: 'HEB 200', A: 0.007808, I: 0.0000570, h: 0.200 },
  { id: 'rect-200x300', name: 'Rectangle 200×300', A: 0.06, I: 0.00045, h: 0.300 },
];

export function createEmptyProject(ownerId: string): Project {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: 'Untitled Project',
    createdAt: now,
    updatedAt: now,
    ownerId,
    version: 1,
    units: DEFAULT_UNITS,
    settings: DEFAULT_SOLVER_SETTINGS,
    model: {
      nodes: [],
      members: [],
      materials: [...DEFAULT_MATERIALS],
      sections: [...DEFAULT_SECTIONS],
      supports: [],
    },
    loadCases: [
      {
        id: crypto.randomUUID(),
        name: 'Dead Load',
        type: 'dead',
        loads: [],
      },
    ],
    loadCombinations: [],
    analysisRuns: [],
  };
}
