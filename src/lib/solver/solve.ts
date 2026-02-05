/**
 * Main Solver Entry Point
 * 
 * Orchestrates the complete structural analysis:
 * 1. Validate model
 * 2. Build DOF map
 * 3. Assemble global system
 * 4. Apply boundary conditions
 * 5. Check stability
 * 6. Solve linear system
 * 7. Post-process results
 * 8. Check equilibrium
 */

import type { StructuralModel, LoadCase, SolverSettings, LoadCombination } from '@/types';
import type {
  SolverResult,
  SolverError,
  SolverErrorDetails,
  AnalysisResults,
  AnalysisMetadata,
  CombinedResults,
  CombinationAnalysisResult,
} from '@/types/analysis';

import { choleskySolve, NotPositiveDefiniteError } from '../math/cholesky';
import { luSolve, SingularMatrixError } from '../math/lu';

import { buildDOFMap } from './dofMap';
import { assembleSystem, assembleGeometricStiffnessMatrix } from './assembly';
import { partitionSystem, expandSolution } from './boundary';
import { checkStability, checkMinimumRestraints, formatInstabilityError } from './stability';
import { 
  computeMemberResults, 
  computeReactions, 
  extractNodeDisplacements,
  checkEquilibrium 
} from './postprocess';
import { validateModel } from './validation';
import { SOLVER_TOLERANCES } from './tolerances';
import { computeCharacteristicLength } from './geometry';
import { combineResults, computeEnvelope } from './combinations';

/** Current solver version for reproducibility tracking */
export const SOLVER_VERSION = '1.0.0';

/**
 * Solve a structural analysis problem.
 * 
 * @param model - Structural model with nodes, members, materials, sections, supports
 * @param loadCase - Load case to analyze
 * @returns SolverResult with success/failure and results or error
 */
export function solve(model: StructuralModel, loadCase: LoadCase): SolverResult {
  const startTime = performance.now();
  const warnings: string[] = [];

  try {
    // Step 1: Validate model
    const validation = validateModel(model, loadCase);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Model validation failed',
          details: {
            validationErrors: validation.errors,
          },
        },
      };
    }
    
    // Add validation warnings
    for (const w of validation.warnings) {
      warnings.push(w.message);
    }

    // Step 2: Build DOF map
    const dofMapResult = buildDOFMap(model, loadCase);
    if (!dofMapResult.success) {
      return { success: false, error: dofMapResult.error };
    }
    const dofMap = dofMapResult.dofMap;

    // Step 3: Assemble global system
    const { K, F } = assembleSystem(model, loadCase, dofMap);

    // Step 4: Apply boundary conditions
    let partition;
    try {
      partition = partitionSystem(K, F, model.supports, dofMap);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      return {
        success: false,
        error: {
          code: 'INSUFFICIENT_RESTRAINTS',
          message,
          details: {
            suggestedFixes: [
              'Add supports to restrain the structure',
              'A 2D structure needs at least 3 restrained DOFs',
            ],
          },
        },
      };
    }

    // Step 5: Check minimum restraints
    const restraintCheck = checkMinimumRestraints(
      partition.restrainedDOFs,
      partition.totalDOFs
    );
    if (!restraintCheck.stable) {
      const errorObj: SolverError = {
        code: restraintCheck.errorCode ?? 'INSUFFICIENT_RESTRAINTS',
        message: restraintCheck.message ?? 'Insufficient restraints',
      };
      if (restraintCheck.suggestions) {
        errorObj.details = { suggestedFixes: restraintCheck.suggestions };
      }
      return { success: false, error: errorObj };
    }

    // Step 6: Check stability
    const stabilityCheck = checkStability(
      partition.Kff,
      partition.freeDOFs,
      dofMap
    );
    if (!stabilityCheck.stable) {
      const errorObj: SolverError = {
        code: stabilityCheck.errorCode ?? 'MECHANISM_DETECTED',
        message: stabilityCheck.message ?? 'Structure is unstable',
      };
      const errorDetails: SolverErrorDetails = {};
      if (stabilityCheck.problematicDOFs) errorDetails.problematicDOFs = stabilityCheck.problematicDOFs;
      if (stabilityCheck.problematicNodes) errorDetails.problematicNodes = stabilityCheck.problematicNodes;
      if (stabilityCheck.suggestions) errorDetails.suggestedFixes = stabilityCheck.suggestions;
      if (Object.keys(errorDetails).length > 0) {
        errorObj.details = errorDetails;
      }
      return { success: false, error: errorObj };
    }

    // Step 7: Solve linear system
    let df: number[];

    try {
      // Try Cholesky first (preferred for SPD matrices)
      df = choleskySolve(partition.Kff, partition.Ff);
    } catch (e) {
      if (e instanceof NotPositiveDefiniteError) {
        // Fall back to LU
        warnings.push(
          `Cholesky factorization failed at index ${e.failedAtIndex}; using LU decomposition`
        );
        
        try {
          df = luSolve(partition.Kff, partition.Ff);
        } catch (luError) {
          if (luError instanceof SingularMatrixError) {
            return {
              success: false,
              error: formatInstabilityError(
                [partition.freeDOFs[luError.failedAtIndex] ?? 0],
                dofMap
              ),
            };
          }
          throw luError;
        }
      } else {
        throw e;
      }
    }

    // Verify solution is finite
    for (let i = 0; i < df.length; i++) {
      const val = df[i];
      if (val === undefined || !Number.isFinite(val)) {
        return {
          success: false,
          error: {
            code: 'NUMERICAL_FAILURE',
            message: `Non-finite value in solution at index ${i}`,
            details: {
              suggestedFixes: [
                'Check model for very large or very small property values',
                'Verify all members have valid materials and sections',
              ],
            },
          },
        };
      }
    }

    // Check for large displacements (warning)
    const charLength = computeCharacteristicLength(model);
    const maxDisp = Math.max(...df.map(Math.abs));
    if (maxDisp > charLength * SOLVER_TOLERANCES.LARGE_DISPLACEMENT) {
      warnings.push(
        `Large displacements detected (max: ${maxDisp.toExponential(2)} m). ` +
        `Results may be inaccurate for linear analysis.`
      );
    }

    // Step 8: Expand solution to full DOF vector
    const displacements = expandSolution(df, partition);

    // Step 9: Post-process results
    const memberResults = computeMemberResults(
      model,
      loadCase,
      displacements,
      dofMap
    );

    const reactions = computeReactions(
      model,
      displacements,
      F,
      K,
      partition,
      dofMap
    );

    const nodeDisplacements = extractNodeDisplacements(displacements, dofMap);

    // Step 10: Check equilibrium
    const equilibriumCheck = checkEquilibrium(reactions, loadCase, model);
    if (!equilibriumCheck.passed) {
      warnings.push(
        `Equilibrium check warning: ΣFx=${equilibriumCheck.fx.toExponential(2)}, ` +
        `ΣFy=${equilibriumCheck.fy.toExponential(2)}, ΣMz=${equilibriumCheck.mz.toExponential(2)}`
      );
    }

    // Compute metadata
    const endTime = performance.now();
    const metadata: AnalysisMetadata = {
      solveTimeMs: endTime - startTime,
      totalDOFs: dofMap.totalDOFs,
      freeDOFs: partition.freeDOFs.length,
      diagramSamplingPoints: SOLVER_TOLERANCES.DIAGRAM_SAMPLING_POINTS,
      equilibriumError: equilibriumCheck,
    };

    // Build results
    const results: AnalysisResults = {
      reactions,
      nodeDisplacements,
      memberResults,
    };

    return {
      success: true,
      results,
      metadata,
      warnings,
    };

  } catch (e) {
    // Unexpected error
    const message = e instanceof Error ? e.message : 'Unknown error';
    return {
      success: false,
      error: {
        code: 'NUMERICAL_FAILURE',
        message: `Solver failed: ${message}`,
      },
    };
  }
}

/**
 * Solve a structural analysis problem with P-Delta (second-order) effects.
 *
 * This performs an iterative analysis where:
 * 1. Linear analysis is performed to get initial axial forces
 * 2. Geometric stiffness matrix is built from axial forces
 * 3. System is resolved with combined stiffness (K + Kg)
 * 4. Process repeats until displacement convergence
 *
 * @param model - Structural model
 * @param loadCase - Load case to analyze
 * @param settings - Solver settings including P-Delta parameters
 * @returns SolverResult with P-Delta metadata
 */
export function solvePDelta(
  model: StructuralModel,
  loadCase: LoadCase,
  settings: SolverSettings
): SolverResult {
  const startTime = performance.now();
  const warnings: string[] = [];

  const maxIterations = settings.pDeltaMaxIterations;
  const convergenceTol = settings.pDeltaConvergenceTol;

  try {
    // Step 1: Validate model
    const validation = validateModel(model, loadCase);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Model validation failed',
          details: {
            validationErrors: validation.errors,
          },
        },
      };
    }

    for (const w of validation.warnings) {
      warnings.push(w.message);
    }

    // Step 2: Build DOF map
    const dofMapResult = buildDOFMap(model, loadCase);
    if (!dofMapResult.success) {
      return { success: false, error: dofMapResult.error };
    }
    const dofMap = dofMapResult.dofMap;

    // Step 3: Assemble initial global system
    const { K, F } = assembleSystem(model, loadCase, dofMap);

    // Step 4: Apply boundary conditions
    let partition;
    try {
      partition = partitionSystem(K, F, model.supports, dofMap);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      return {
        success: false,
        error: {
          code: 'INSUFFICIENT_RESTRAINTS',
          message,
          details: {
            suggestedFixes: [
              'Add supports to restrain the structure',
              'A 2D structure needs at least 3 restrained DOFs',
            ],
          },
        },
      };
    }

    // Step 5: Check minimum restraints
    const restraintCheck = checkMinimumRestraints(
      partition.restrainedDOFs,
      partition.totalDOFs
    );
    if (!restraintCheck.stable) {
      const errorObj: SolverError = {
        code: restraintCheck.errorCode ?? 'INSUFFICIENT_RESTRAINTS',
        message: restraintCheck.message ?? 'Insufficient restraints',
      };
      if (restraintCheck.suggestions) {
        errorObj.details = { suggestedFixes: restraintCheck.suggestions };
      }
      return { success: false, error: errorObj };
    }

    // Step 6: Check stability
    const stabilityCheck = checkStability(
      partition.Kff,
      partition.freeDOFs,
      dofMap
    );
    if (!stabilityCheck.stable) {
      const errorObj: SolverError = {
        code: stabilityCheck.errorCode ?? 'MECHANISM_DETECTED',
        message: stabilityCheck.message ?? 'Structure is unstable',
      };
      const errorDetails: SolverErrorDetails = {};
      if (stabilityCheck.problematicDOFs) errorDetails.problematicDOFs = stabilityCheck.problematicDOFs;
      if (stabilityCheck.problematicNodes) errorDetails.problematicNodes = stabilityCheck.problematicNodes;
      if (stabilityCheck.suggestions) errorDetails.suggestedFixes = stabilityCheck.suggestions;
      if (Object.keys(errorDetails).length > 0) {
        errorObj.details = errorDetails;
      }
      return { success: false, error: errorObj };
    }

    // P-Delta iteration loop
    let df: number[] = [];
    let displacements: number[] = [];
    let converged = false;
    let iteration = 0;
    let memberAxialForces = new Map<string, number>();

    // First linear solve
    try {
      df = choleskySolve(partition.Kff, partition.Ff);
    } catch (e) {
      if (e instanceof NotPositiveDefiniteError) {
        warnings.push(
          `Cholesky factorization failed at index ${e.failedAtIndex}; using LU decomposition`
        );
        try {
          df = luSolve(partition.Kff, partition.Ff);
        } catch (luError) {
          if (luError instanceof SingularMatrixError) {
            return {
              success: false,
              error: formatInstabilityError(
                [partition.freeDOFs[luError.failedAtIndex] ?? 0],
                dofMap
              ),
            };
          }
          throw luError;
        }
      } else {
        throw e;
      }
    }

    displacements = expandSolution(df, partition);

    // Extract axial forces from initial analysis
    const initialMemberResults = computeMemberResults(
      model,
      loadCase,
      displacements,
      dofMap
    );
    memberAxialForces = extractMemberAxialForces(initialMemberResults);

    let prevDisplacements = [...displacements];

    // P-Delta iterations
    for (iteration = 1; iteration <= maxIterations; iteration++) {
      // Build geometric stiffness matrix from current axial forces
      const Kg = assembleGeometricStiffnessMatrix(model, memberAxialForces, dofMap);

      // Combined stiffness: K_total = K + Kg
      const K_total = K.clone();
      for (let i = 0; i < K_total.rows; i++) {
        for (let j = 0; j < K_total.cols; j++) {
          K_total.add(i, j, Kg.get(i, j));
        }
      }

      // Re-partition with combined stiffness
      const Kff_total = K_total.extractSubmatrix(partition.freeDOFs, partition.freeDOFs);

      // Solve with combined stiffness
      try {
        df = choleskySolve(Kff_total, partition.Ff);
      } catch (e) {
        if (e instanceof NotPositiveDefiniteError) {
          // Structure may have buckled (combined stiffness not positive definite)
          warnings.push(
            `P-Delta iteration ${iteration}: Structure approaching buckling condition`
          );
          try {
            df = luSolve(Kff_total, partition.Ff);
          } catch (luError) {
            if (luError instanceof SingularMatrixError) {
              return {
                success: false,
                error: {
                  code: 'MECHANISM_DETECTED',
                  message: `P-Delta analysis: Structure buckled at iteration ${iteration}`,
                  details: {
                    suggestedFixes: [
                      'Reduce applied loads',
                      'Increase member sections',
                      'Add bracing to improve stability',
                    ],
                  },
                },
              };
            }
            throw luError;
          }
        } else {
          throw e;
        }
      }

      displacements = expandSolution(df, partition);

      // Check convergence: ||d_new - d_old|| / ||d_old|| < tol
      const dispChange = computeDisplacementNorm(displacements, prevDisplacements);
      const dispNorm = computeVectorNorm(prevDisplacements);

      if (dispNorm > 1e-10 && dispChange / dispNorm < convergenceTol) {
        converged = true;
        break;
      }

      // Update for next iteration
      prevDisplacements = [...displacements];

      // Recompute member results and axial forces
      const iterMemberResults = computeMemberResults(
        model,
        loadCase,
        displacements,
        dofMap
      );
      memberAxialForces = extractMemberAxialForces(iterMemberResults);
    }

    if (!converged) {
      warnings.push(
        `P-Delta analysis did not converge after ${maxIterations} iterations`
      );
    }

    // Verify solution is finite
    for (let i = 0; i < df.length; i++) {
      const val = df[i];
      if (val === undefined || !Number.isFinite(val)) {
        return {
          success: false,
          error: {
            code: 'NUMERICAL_FAILURE',
            message: `Non-finite value in solution at index ${i}`,
            details: {
              suggestedFixes: [
                'Check model for very large or very small property values',
                'Verify all members have valid materials and sections',
              ],
            },
          },
        };
      }
    }

    // Check for large displacements (warning)
    const charLength = computeCharacteristicLength(model);
    const maxDisp = Math.max(...df.map(Math.abs));
    if (maxDisp > charLength * SOLVER_TOLERANCES.LARGE_DISPLACEMENT) {
      warnings.push(
        `Large displacements detected (max: ${maxDisp.toExponential(2)} m). ` +
        `Second-order analysis may require geometric nonlinearity.`
      );
    }

    // Final post-processing
    const memberResults = computeMemberResults(
      model,
      loadCase,
      displacements,
      dofMap
    );

    // Build Kg for final reaction calculation
    const finalKg = assembleGeometricStiffnessMatrix(model, memberAxialForces, dofMap);
    const K_final = K.clone();
    for (let i = 0; i < K_final.rows; i++) {
      for (let j = 0; j < K_final.cols; j++) {
        K_final.add(i, j, finalKg.get(i, j));
      }
    }

    const reactions = computeReactions(
      model,
      displacements,
      F,
      K_final,
      partition,
      dofMap
    );

    const nodeDisplacements = extractNodeDisplacements(displacements, dofMap);

    // Check equilibrium
    const equilibriumCheck = checkEquilibrium(reactions, loadCase, model);
    if (!equilibriumCheck.passed) {
      warnings.push(
        `Equilibrium check warning: ΣFx=${equilibriumCheck.fx.toExponential(2)}, ` +
        `ΣFy=${equilibriumCheck.fy.toExponential(2)}, ΣMz=${equilibriumCheck.mz.toExponential(2)}`
      );
    }

    // Compute metadata
    const endTime = performance.now();
    const metadata: AnalysisMetadata = {
      solveTimeMs: endTime - startTime,
      totalDOFs: dofMap.totalDOFs,
      freeDOFs: partition.freeDOFs.length,
      diagramSamplingPoints: SOLVER_TOLERANCES.DIAGRAM_SAMPLING_POINTS,
      equilibriumError: equilibriumCheck,
      pDeltaEnabled: true,
      pDeltaIterations: iteration,
      pDeltaConverged: converged,
    };

    // Build results
    const results: AnalysisResults = {
      reactions,
      nodeDisplacements,
      memberResults,
    };

    return {
      success: true,
      results,
      metadata,
      warnings,
    };

  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return {
      success: false,
      error: {
        code: 'NUMERICAL_FAILURE',
        message: `P-Delta solver failed: ${message}`,
      },
    };
  }
}

/**
 * Extract axial forces from member results.
 * Axial force is taken as the average of start and end axial forces.
 */
function extractMemberAxialForces(
  memberResults: { memberId: string; endForcesLocal: { f1x: number; f2x: number } }[]
): Map<string, number> {
  const axialForces = new Map<string, number>();

  for (const result of memberResults) {
    // Axial force N = -f1x (tension positive)
    // f1x is the force the element exerts on the start node
    // For a member in tension, f1x is negative (pulling the node)
    const N = -result.endForcesLocal.f1x;
    axialForces.set(result.memberId, N);
  }

  return axialForces;
}

/**
 * Compute the Euclidean norm of the difference between two vectors.
 */
function computeDisplacementNorm(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Compute the Euclidean norm of a vector.
 */
function computeVectorNorm(v: number[]): number {
  let sum = 0;
  for (const val of v) {
    sum += val * val;
  }
  return Math.sqrt(sum);
}

/**
 * Solve all load cases for a structural model.
 *
 * @param model - Structural model
 * @param loadCases - Array of load cases to solve
 * @param settings - Solver settings (optional, for P-Delta)
 * @returns Map of load case ID to solver result
 */
export function solveAllLoadCases(
  model: StructuralModel,
  loadCases: LoadCase[],
  settings?: SolverSettings
): Map<string, SolverResult> {
  const results = new Map<string, SolverResult>();

  for (const loadCase of loadCases) {
    // Use P-Delta solver if enabled in settings
    const result = settings?.pDeltaEnabled
      ? solvePDelta(model, loadCase, settings)
      : solve(model, loadCase);

    results.set(loadCase.id, result);
  }

  return results;
}

/**
 * Solve all load combinations for a structural model.
 *
 * This function:
 * 1. Solves all load cases
 * 2. Combines results according to each load combination's factors
 * 3. Computes envelope results across all combinations
 *
 * @param model - Structural model
 * @param loadCases - Array of load cases
 * @param loadCombinations - Array of load combinations
 * @param settings - Solver settings (optional, for P-Delta)
 * @returns Combined results for each combination and envelope results
 */
export function solveCombinations(
  model: StructuralModel,
  loadCases: LoadCase[],
  loadCombinations: LoadCombination[],
  settings?: SolverSettings
): CombinationAnalysisResult {
  const warnings: string[] = [];
  const failedLoadCases: string[] = [];

  // Step 1: Solve all load cases
  const loadCaseResults = solveAllLoadCases(model, loadCases, settings);

  // Extract successful results
  const successfulResults = new Map<string, AnalysisResults>();

  for (const [loadCaseId, result] of loadCaseResults) {
    if (result.success) {
      successfulResults.set(loadCaseId, result.results);

      // Collect warnings
      if (result.warnings && result.warnings.length > 0) {
        const loadCase = loadCases.find((lc) => lc.id === loadCaseId);
        for (const w of result.warnings) {
          warnings.push(`[${loadCase?.name ?? loadCaseId}] ${w}`);
        }
      }
    } else {
      failedLoadCases.push(loadCaseId);
      const loadCase = loadCases.find((lc) => lc.id === loadCaseId);
      warnings.push(`Load case "${loadCase?.name ?? loadCaseId}" failed: ${result.error.message}`);
    }
  }

  // Check if any load cases failed
  if (failedLoadCases.length > 0) {
    // If all failed, return error
    if (failedLoadCases.length === loadCases.length) {
      return {
        success: false,
        error: {
          code: 'NUMERICAL_FAILURE',
          message: 'All load cases failed to solve',
        },
        failedLoadCases,
      };
    }
    // Otherwise, continue with successful cases but warn
    warnings.push(
      `${failedLoadCases.length} of ${loadCases.length} load cases failed. ` +
      `Combinations using these load cases may be incomplete.`
    );
  }

  // Step 2: Combine results for each load combination
  const combinedResults: CombinedResults[] = [];

  for (const combination of loadCombinations) {
    const combined = combineResults(successfulResults, combination);
    if (combined) {
      combinedResults.push(combined);
    } else {
      warnings.push(`Could not compute combination "${combination.name}" - no valid load case results`);
    }
  }

  // Step 3: Compute envelope results
  const envelopes = computeEnvelope(combinedResults);

  return {
    success: true,
    combinedResults,
    envelopes,
    warnings,
  };
}
