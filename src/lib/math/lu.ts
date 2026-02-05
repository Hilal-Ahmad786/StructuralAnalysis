/**
 * LU Decomposition with Partial Pivoting
 * 
 * Decomposes P * A = L * U where:
 * - P is a permutation matrix
 * - L is lower triangular with unit diagonal
 * - U is upper triangular
 * 
 * This is a fallback for when Cholesky fails (matrix not SPD).
 */

import { Matrix } from './matrix';

export class SingularMatrixError extends Error {
  readonly failedAtIndex: number;

  constructor(index: number) {
    super(`Matrix is singular (zero pivot at index ${index})`);
    this.name = 'SingularMatrixError';
    this.failedAtIndex = index;
  }
}

export interface LUDecomposition {
  L: Matrix;
  U: Matrix;
  P: number[];  // Permutation array (P[i] = j means row i was originally row j)
}

/**
 * Perform LU decomposition with partial pivoting: P * A = L * U
 * 
 * @param A - Square matrix to decompose
 * @returns { L, U, P } decomposition
 * @throws SingularMatrixError if matrix is singular
 */
export function luDecompose(A: Matrix): LUDecomposition {
  if (!A.isSquare()) {
    throw new Error('LU decomposition requires a square matrix');
  }

  const n = A.rows;
  const L = Matrix.zeros(n, n);
  const U = A.clone();
  
  // Initialize permutation as identity
  const P: number[] = [];
  for (let i = 0; i < n; i++) {
    P.push(i);
  }

  for (let k = 0; k < n; k++) {
    // Find pivot (maximum absolute value in column k, from row k down)
    let maxVal = Math.abs(U.get(k, k));
    let maxRow = k;
    
    for (let i = k + 1; i < n; i++) {
      const absVal = Math.abs(U.get(i, k));
      if (absVal > maxVal) {
        maxVal = absVal;
        maxRow = i;
      }
    }

    // Check for singularity
    if (maxVal < 1e-15) {
      throw new SingularMatrixError(k);
    }

    // Swap rows if necessary
    if (maxRow !== k) {
      // Swap rows in U
      for (let j = 0; j < n; j++) {
        const temp = U.get(k, j);
        U.set(k, j, U.get(maxRow, j));
        U.set(maxRow, j, temp);
      }
      
      // Swap rows in L (only the part that's been computed)
      for (let j = 0; j < k; j++) {
        const temp = L.get(k, j);
        L.set(k, j, L.get(maxRow, j));
        L.set(maxRow, j, temp);
      }
      
      // Update permutation
      const tempP = P[k];
      P[k] = P[maxRow] ?? maxRow;
      P[maxRow] = tempP ?? k;
    }

    // Compute L and U entries
    L.set(k, k, 1);  // Unit diagonal in L
    
    for (let i = k + 1; i < n; i++) {
      const Ukk = U.get(k, k);
      if (Math.abs(Ukk) < 1e-15) {
        throw new SingularMatrixError(k);
      }
      
      const factor = U.get(i, k) / Ukk;
      L.set(i, k, factor);
      
      for (let j = k; j < n; j++) {
        U.set(i, j, U.get(i, j) - factor * U.get(k, j));
      }
    }
  }

  return { L, U, P };
}

/**
 * Apply permutation to a vector: result[i] = v[P[i]]
 */
export function applyPermutation(P: number[], v: number[]): number[] {
  const result = new Array<number>(v.length);
  for (let i = 0; i < v.length; i++) {
    const pi = P[i];
    if (pi === undefined || pi < 0 || pi >= v.length) {
      throw new Error(`Invalid permutation index at ${i}: ${pi}`);
    }
    result[i] = v[pi] ?? 0;
  }
  return result;
}

/**
 * Solve L * y = b where L is lower triangular with unit diagonal
 */
export function forwardSubstitutionUnit(L: Matrix, b: number[]): number[] {
  const n = L.rows;
  
  if (n !== b.length) {
    throw new Error(`Dimension mismatch: L is ${n}x${n}, b has length ${b.length}`);
  }

  const y = new Array<number>(n).fill(0);

  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < i; j++) {
      sum += L.get(i, j) * (y[j] ?? 0);
    }
    // L has unit diagonal, so no division needed
    y[i] = (b[i] ?? 0) - sum;
  }

  return y;
}

/**
 * Solve U * x = y where U is upper triangular
 */
export function backwardSubstitutionLU(U: Matrix, y: number[]): number[] {
  const n = U.rows;
  
  if (n !== y.length) {
    throw new Error(`Dimension mismatch: U is ${n}x${n}, y has length ${y.length}`);
  }

  const x = new Array<number>(n).fill(0);

  for (let i = n - 1; i >= 0; i--) {
    let sum = 0;
    for (let j = i + 1; j < n; j++) {
      sum += U.get(i, j) * (x[j] ?? 0);
    }
    
    const Uii = U.get(i, i);
    if (Math.abs(Uii) < 1e-15) {
      throw new SingularMatrixError(i);
    }
    
    x[i] = ((y[i] ?? 0) - sum) / Uii;
  }

  return x;
}

/**
 * Solve A * x = b using LU decomposition with partial pivoting
 * 
 * Steps:
 * 1. Decompose P * A = L * U
 * 2. Solve L * y = P * b (forward substitution)
 * 3. Solve U * x = y (backward substitution)
 */
export function luSolve(A: Matrix, b: number[]): number[] {
  const { L, U, P } = luDecompose(A);
  const Pb = applyPermutation(P, b);
  const y = forwardSubstitutionUnit(L, Pb);
  const x = backwardSubstitutionLU(U, y);
  return x;
}

/**
 * Estimate condition number using LU decomposition
 * This is a rough estimate: ||A|| * ||A^-1|| using 1-norm
 */
export function estimateConditionNumber(A: Matrix): number {
  const n = A.rows;
  
  // Compute 1-norm of A (max column sum)
  let normA = 0;
  for (let j = 0; j < n; j++) {
    let colSum = 0;
    for (let i = 0; i < n; i++) {
      colSum += Math.abs(A.get(i, j));
    }
    normA = Math.max(normA, colSum);
  }

  // Estimate ||A^-1|| using LU solve on unit vectors
  let normAinv = 0;
  const { L, U, P } = luDecompose(A);
  
  for (let j = 0; j < n; j++) {
    // Create unit vector e_j
    const e = new Array<number>(n).fill(0);
    e[j] = 1;
    
    // Solve A * x = e_j
    const Pb = applyPermutation(P, e);
    const y = forwardSubstitutionUnit(L, Pb);
    const x = backwardSubstitutionLU(U, y);
    
    // Compute 1-norm of x (column j of A^-1)
    let colSum = 0;
    for (let i = 0; i < n; i++) {
      colSum += Math.abs(x[i] ?? 0);
    }
    normAinv = Math.max(normAinv, colSum);
  }

  return normA * normAinv;
}
