/**
 * Stability Detection
 * 
 * Detects unstable structures (mechanisms) before they cause
 * numerical failures in the solver.
 * 
 * Multi-layer detection:
 * 1. Zero diagonal entries (definite mechanism)
 * 2. Near-zero diagonals (near-mechanism)
 * 3. Cholesky failure (not positive definite)
 */

import { Matrix } from '../math/matrix';
import { getDOFInfo } from './dofMap';
import type { DOFMap } from './dofMap';
import { SOLVER_TOLERANCES } from './tolerances';
import type { SolverError, SolverErrorCode } from '@/types/analysis';

/**
 * Result of stability check.
 */
export interface StabilityCheckResult {
  stable: boolean;
  errorCode?: SolverErrorCode;
  message?: string;
  problematicDOFs?: number[];
  problematicNodes?: string[];
  suggestions?: string[];
}

/**
 * Check if the free stiffness matrix indicates a stable structure.
 */
export function checkStability(
  Kff: Matrix,
  freeDOFs: number[],
  dofMap: DOFMap
): StabilityCheckResult {
  const n = Kff.rows;

  // Get diagonal elements
  const diag: number[] = [];
  for (let i = 0; i < n; i++) {
    diag.push(Kff.get(i, i));
  }

  const maxDiag = Math.max(...diag.map(Math.abs));
  
  // Handle case where all diagonals are zero
  if (maxDiag < SOLVER_TOLERANCES.ABSOLUTE) {
    return {
      stable: false,
      errorCode: 'MECHANISM_DETECTED',
      message: 'Structure has no stiffness - all diagonal elements are zero',
      problematicDOFs: freeDOFs,
      problematicNodes: getNodesFromDOFs(freeDOFs, dofMap),
      suggestions: [
        'Check that members are properly connected',
        'Verify material and section properties are defined',
      ],
    };
  }

  // Check 1: Zero diagonal entries (definite mechanism)
  const zeroDiags: number[] = [];
  for (let i = 0; i < n; i++) {
    const d = diag[i];
    if (d !== undefined && Math.abs(d) < SOLVER_TOLERANCES.ABSOLUTE) {
      const globalDOF = freeDOFs[i];
      if (globalDOF !== undefined) {
        zeroDiags.push(globalDOF);
      }
    }
  }

  if (zeroDiags.length > 0) {
    const nodes = getNodesFromDOFs(zeroDiags, dofMap);
    const directions = getDirectionsFromDOFs(zeroDiags, dofMap);

    return {
      stable: false,
      errorCode: 'MECHANISM_DETECTED',
      message: `Structure is unstable: ${zeroDiags.length} DOF(s) have zero stiffness`,
      problematicDOFs: zeroDiags,
      problematicNodes: nodes,
      suggestions: [
        `Add support restraints at: ${nodes.join(', ')}`,
        `Affected directions: ${directions.join(', ')}`,
        'Or add members to provide stiffness in these directions',
      ],
    };
  }

  // Check 2: Near-zero diagonals (near-mechanism, warning level)
  const threshold = maxDiag * SOLVER_TOLERANCES.ZERO_DIAGONAL;
  const nearZeroDiags: number[] = [];

  for (let i = 0; i < n; i++) {
    const d = diag[i];
    if (d !== undefined && Math.abs(d) < threshold && Math.abs(d) >= SOLVER_TOLERANCES.ABSOLUTE) {
      const globalDOF = freeDOFs[i];
      if (globalDOF !== undefined) {
        nearZeroDiags.push(globalDOF);
      }
    }
  }

  if (nearZeroDiags.length > 0) {
    return {
      stable: false,
      errorCode: 'ILL_CONDITIONED',
      message: `Structure is nearly unstable: ${nearZeroDiags.length} DOF(s) have very low stiffness`,
      problematicDOFs: nearZeroDiags,
      problematicNodes: getNodesFromDOFs(nearZeroDiags, dofMap),
      suggestions: [
        'Check member connectivity',
        'Verify support conditions',
        'Consider adding bracing',
      ],
    };
  }

  return { stable: true };
}

/**
 * Get unique node IDs from DOF indices.
 */
function getNodesFromDOFs(dofs: number[], dofMap: DOFMap): string[] {
  const nodes = new Set<string>();
  
  for (const dof of dofs) {
    const info = getDOFInfo(dof, dofMap);
    if (info) {
      nodes.add(info.nodeId);
    }
  }
  
  return Array.from(nodes);
}

/**
 * Get DOF directions from DOF indices.
 */
function getDirectionsFromDOFs(dofs: number[], dofMap: DOFMap): string[] {
  const directions: string[] = [];
  
  for (const dof of dofs) {
    const info = getDOFInfo(dof, dofMap);
    if (info) {
      directions.push(`${info.nodeId}:${info.direction}`);
    }
  }
  
  return directions;
}

/**
 * Format an instability error with detailed information.
 */
export function formatInstabilityError(
  problematicDOFs: number[],
  dofMap: DOFMap
): SolverError {
  const nodes = getNodesFromDOFs(problematicDOFs, dofMap);
  const directions = getDirectionsFromDOFs(problematicDOFs, dofMap);

  return {
    code: 'MECHANISM_DETECTED',
    message: 'Structure is unstable (mechanism detected)',
    details: {
      problematicDOFs,
      problematicNodes: nodes,
      suggestedFixes: [
        `The following nodes can move freely: ${nodes.join(', ')}`,
        `Unconstrained directions: ${directions.join(', ')}`,
        'Add supports or bracing to stabilize the structure',
      ],
    },
  };
}

/**
 * Quick check: does the structure have minimum supports for 2D stability?
 * 
 * Minimum requirements for 2D:
 * - At least 3 restrained DOFs to prevent rigid body motion
 * - At least 2 nodes must have supports (typically)
 */
export function checkMinimumRestraints(
  restrainedDOFs: number[],
  totalDOFs: number
): StabilityCheckResult {
  if (restrainedDOFs.length === 0) {
    return {
      stable: false,
      errorCode: 'INSUFFICIENT_RESTRAINTS',
      message: 'No supports defined - structure will undergo rigid body motion',
      suggestions: [
        'Add at least one pinned support (restrains 2 DOFs)',
        'Add at least one roller support (restrains 1 DOF)',
        'A typical frame needs at least 3 restrained DOFs total',
      ],
    };
  }

  if (restrainedDOFs.length < 3) {
    return {
      stable: false,
      errorCode: 'INSUFFICIENT_RESTRAINTS',
      message: `Only ${restrainedDOFs.length} DOF(s) restrained - minimum 3 required for 2D stability`,
      suggestions: [
        'Add more support restraints',
        'A pinned support provides 2 restrained DOFs',
        'A roller provides 1 restrained DOF',
        'A fixed support provides 3 restrained DOFs',
      ],
    };
  }

  if (totalDOFs > 0 && restrainedDOFs.length >= totalDOFs) {
    return {
      stable: false,
      errorCode: 'MECHANISM_DETECTED',
      message: 'All DOFs are restrained - no free DOFs to solve',
      suggestions: [
        'Check support conditions',
        'At least one node should be free to move or rotate',
      ],
    };
  }

  return { stable: true };
}
