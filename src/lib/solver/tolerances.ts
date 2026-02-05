/**
 * Solver Tolerances and Numerical Constants
 * 
 * These values are locked and should not be changed without
 * updating all dependent tests.
 */

export const SOLVER_TOLERANCES = {
  /**
   * Relative tolerance for comparing numerical results.
   * Two values a, b are equal if |a-b| / max(|a|,|b|) < RELATIVE
   */
  RELATIVE: 1e-9,

  /**
   * Absolute tolerance for values near zero.
   * Used when both values are smaller than this threshold.
   */
  ABSOLUTE: 1e-12,

  /**
   * Equilibrium check tolerance as fraction of total load.
   * ΣForces / TotalLoad < EQUILIBRIUM passes the check.
   */
  EQUILIBRIUM: 1e-6,

  /**
   * Condition number warning threshold.
   * Systems with κ(K) > this value trigger a warning.
   */
  CONDITION_NUMBER_WARNING: 1e10,

  /**
   * Near-zero diagonal detection threshold.
   * K[i,i] < maxDiag * ZERO_DIAGONAL is considered zero.
   */
  ZERO_DIAGONAL: 1e-14,

  /**
   * Large displacement warning threshold.
   * δ / L > LARGE_DISPLACEMENT triggers a warning.
   */
  LARGE_DISPLACEMENT: 0.1,

  /**
   * Number of sampling points for diagram computation.
   * Fixed for deterministic results.
   */
  DIAGRAM_SAMPLING_POINTS: 21,

  /**
   * P-Delta convergence tolerance.
   * ||d_new - d_old|| / ||d_old|| < PDELTA_CONVERGENCE to converge.
   */
  PDELTA_CONVERGENCE: 1e-4,

  /**
   * Maximum P-Delta iterations.
   * Analysis stops after this many iterations even if not converged.
   */
  PDELTA_MAX_ITERATIONS: 10,
} as const;

/**
 * Check if two numbers are numerically equal within tolerance.
 */
export function isNumericallyEqual(a: number, b: number): boolean {
  const diff = Math.abs(a - b);
  const maxAbs = Math.max(Math.abs(a), Math.abs(b));

  if (maxAbs < SOLVER_TOLERANCES.ABSOLUTE) {
    // Both values near zero - use absolute tolerance
    return diff < SOLVER_TOLERANCES.ABSOLUTE;
  }

  // Use relative tolerance
  return diff / maxAbs < SOLVER_TOLERANCES.RELATIVE;
}

/**
 * Check if a value is effectively zero.
 */
export function isEffectivelyZero(value: number, reference: number = 1): boolean {
  const threshold = Math.max(
    SOLVER_TOLERANCES.ABSOLUTE,
    Math.abs(reference) * SOLVER_TOLERANCES.ZERO_DIAGONAL
  );
  return Math.abs(value) < threshold;
}

/**
 * Assert that all values in an array are finite (not NaN or Infinity).
 */
export function assertAllFinite(values: number[], context: string): void {
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v === undefined || !Number.isFinite(v)) {
      throw new Error(`Non-finite value at index ${i} in ${context}: ${v}`);
    }
  }
}
