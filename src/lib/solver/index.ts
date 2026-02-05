// Main solver exports
export { solve, solvePDelta, solveAllLoadCases, solveCombinations, SOLVER_VERSION } from './solve';

// Combination utilities
export * from './combinations';
export { validateModel } from './validation';
export { buildDOFMap, getElementDOFs, getRestrainedDOFs, getFreeDOFs } from './dofMap';
export { assembleSystem, assembleStiffnessMatrix, assembleLoadVector, assembleGeometricStiffnessMatrix } from './assembly';
export { partitionSystem, expandSolution } from './boundary';
export { checkStability, checkMinimumRestraints } from './stability';
export { 
  computeMemberResults, 
  computeReactions, 
  extractNodeDisplacements,
  checkEquilibrium 
} from './postprocess';

// Geometry
export * from './geometry';

// Tolerances
export * from './tolerances';

// Elements
export * from './elements';

// Loads
export * from './loads';

// Types re-exports
export type {
  DOFMap,
  NodeDOFInfo,
  DOFMapResult,
  SolverResult,
  SolverError,
  AnalysisResults,
  AnalysisMetadata,
  MemberResult,
  MemberEndForcesLocal,
  MemberDiagrams,
  DiagramPoint,
  ReactionResult,
  NodeDisplacement,
  EquilibriumError,
  CombinedResults,
  EnvelopeResults,
  MemberEnvelope,
  CombinationAnalysisResult,
} from '@/types/analysis';
