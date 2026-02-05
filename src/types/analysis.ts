/**
 * Analysis Result Types
 * 
 * All result values are in canonical units (kN, m, kPa)
 */

// ============================================================================
// ANALYSIS RUN
// ============================================================================

export interface AnalysisRun {
  id: string;
  timestamp: string;
  loadCaseId: string;
  solverVersion: string;
  status: 'success' | 'warning' | 'error';
  warnings: string[];
  results: AnalysisResults;
  metadata: AnalysisMetadata;
}

export interface AnalysisMetadata {
  solveTimeMs: number;
  totalDOFs: number;
  freeDOFs: number;
  diagramSamplingPoints: number;
  equilibriumError: EquilibriumError;
  // P-Delta analysis info
  pDeltaEnabled?: boolean;
  pDeltaIterations?: number;
  pDeltaConverged?: boolean;
}

export interface EquilibriumError {
  fx: number;
  fy: number;
  mz: number;
  passed: boolean;
}

// ============================================================================
// RESULTS
// ============================================================================

export interface AnalysisResults {
  reactions: ReactionResult[];
  nodeDisplacements: NodeDisplacement[];
  memberResults: MemberResult[];
}

export interface ReactionResult {
  nodeId: string;
  fx: number; // kN
  fy: number; // kN
  mz: number; // kN·m
}

export interface NodeDisplacement {
  nodeId: string;
  dx: number; // m
  dy: number; // m
  rz: number; // rad
}

export interface MemberResult {
  memberId: string;
  endForcesLocal: MemberEndForcesLocal;
  diagrams: MemberDiagrams;
}

// ============================================================================
// MEMBER END FORCES
// ============================================================================

/**
 * Member end forces in LOCAL coordinates.
 * 
 * These are the nodal forces that the element exerts ON the nodes.
 * 
 * Sign convention:
 * - Positive f1x/f2x: pushes node in local +x direction
 * - Positive f1y/f2y: pushes node in local +y direction
 * - Positive m1/m2: rotates node counter-clockwise
 */
export interface MemberEndForcesLocal {
  f1x: number; // Axial force at start (kN)
  f1y: number; // Shear force at start (kN)
  m1: number;  // Moment at start (kN·m)
  f2x: number; // Axial force at end (kN)
  f2y: number; // Shear force at end (kN)
  m2: number;  // Moment at end (kN·m)
}

// ============================================================================
// DIAGRAMS
// ============================================================================

export interface MemberDiagrams {
  axial: DiagramPoint[];
  shear: DiagramPoint[];
  moment: DiagramPoint[];
  deflection: DiagramPoint[];
}

/**
 * A point on a diagram along the member length.
 * 
 * x: position along member (0 to L) in meters
 * value: the diagram value at that position
 * 
 * For internal forces, sign convention:
 * - Axial (N): positive = tension
 * - Shear (V): positive = causes CW rotation of left segment
 * - Moment (M): positive = causes bottom fiber tension (sagging)
 * - Deflection (v): positive = in local +y direction
 */
export interface DiagramPoint {
  x: number;     // Position along member (m)
  value: number; // Diagram value at this position
}

// ============================================================================
// SOLVER ERROR TYPES
// ============================================================================

export type SolverResult =
  | { success: true; results: AnalysisResults; metadata: AnalysisMetadata; warnings: string[] }
  | { success: false; error: SolverError };

export interface SolverError {
  code: SolverErrorCode;
  message: string;
  details?: SolverErrorDetails;
}

export type SolverErrorCode =
  | 'VALIDATION_FAILED'
  | 'INSUFFICIENT_RESTRAINTS'
  | 'MECHANISM_DETECTED'
  | 'SINGULAR_MATRIX'
  | 'ILL_CONDITIONED'
  | 'NUMERICAL_FAILURE'
  | 'DOF_MAP_ERROR';

export interface SolverErrorDetails {
  problematicDOFs?: number[];
  problematicNodes?: string[];
  conditionNumber?: number;
  suggestedFixes?: string[];
  validationErrors?: ValidationMessage[];
}

// ============================================================================
// VALIDATION
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
}

export interface ValidationMessage {
  code: string;
  severity: 'error' | 'warning';
  message: string;
  entityType?: 'node' | 'member' | 'support' | 'load' | 'material' | 'section';
  entityId?: string;
}

// ============================================================================
// DOF MAP
// ============================================================================

export interface NodeDOFInfo {
  nodeId: string;
  hasRotationDOF: boolean;
  globalDOFIndices: number[]; // [ux, uy] or [ux, uy, rz]
}

export interface DOFMap {
  nodeInfo: Map<string, NodeDOFInfo>;
  totalDOFs: number;
}

export type DOFMapResult =
  | { success: true; dofMap: DOFMap }
  | { success: false; error: SolverError };

// ============================================================================
// LOAD COMBINATION RESULTS
// ============================================================================

/**
 * Results for a single load combination, combining scaled load case results.
 */
export interface CombinedResults {
  combinationId: string;
  combinationName: string;
  reactions: ReactionResult[];
  nodeDisplacements: NodeDisplacement[];
  memberResults: MemberResult[];
}

/**
 * Envelope results showing max/min values across all combinations.
 */
export interface EnvelopeResults {
  memberEnvelopes: MemberEnvelope[];
}

/**
 * Envelope diagrams for a single member, showing max and min values at each point.
 */
export interface MemberEnvelope {
  memberId: string;
  axialMax: DiagramPoint[];
  axialMin: DiagramPoint[];
  shearMax: DiagramPoint[];
  shearMin: DiagramPoint[];
  momentMax: DiagramPoint[];
  momentMin: DiagramPoint[];
  deflectionMax: DiagramPoint[];
  deflectionMin: DiagramPoint[];
}

/**
 * Result of running all load combinations.
 */
export type CombinationAnalysisResult = {
  success: true;
  combinedResults: CombinedResults[];
  envelopes: EnvelopeResults;
  warnings: string[];
} | {
  success: false;
  error: SolverError;
  failedLoadCases: string[];
}
