/**
 * Cholesky Decomposition
 * 
 * For symmetric positive-definite (SPD) matrices.
 * Decomposes A = L * L^T where L is lower triangular.
 * 
 * This is the preferred factorization for structural stiffness matrices
 * because they are SPD for stable structures.
 */

import { Matrix } from './matrix';

export class NotPositiveDefiniteError extends Error {
  readonly failedAtIndex: number;

  constructor(index: number) {
    super(`Matrix is not positive definite (failed at index ${index})`);
    this.name = 'NotPositiveDefiniteError';
    this.failedAtIndex = index;
  }
}

/**
 * Perform Cholesky decomposition: A = L * L^T
 * 
 * @param A - Symmetric positive-definite matrix
 * @returns L - Lower triangular matrix
 * @throws NotPositiveDefiniteError if matrix is not SPD
 */
export function choleskyDecompose(A: Matrix): Matrix {
  if (!A.isSquare()) {
    throw new Error('Cholesky decomposition requires a square matrix');
  }

  const n = A.rows;
  const L = Matrix.zeros(n, n);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;

      if (j === i) {
        // Diagonal elements
        for (let k = 0; k < j; k++) {
          sum += L.get(j, k) * L.get(j, k);
        }
        const diag = A.get(i, i) - sum;
        
        if (diag <= 0) {
          throw new NotPositiveDefiniteError(i);
        }
        
        L.set(i, j, Math.sqrt(diag));
      } else {
        // Off-diagonal elements
        for (let k = 0; k < j; k++) {
          sum += L.get(i, k) * L.get(j, k);
        }
        
        const Ljj = L.get(j, j);
        if (Math.abs(Ljj) < 1e-15) {
          throw new NotPositiveDefiniteError(j);
        }
        
        L.set(i, j, (A.get(i, j) - sum) / Ljj);
      }
    }
  }

  return L;
}

/**
 * Forward substitution: Solve L * y = b for y
 * where L is lower triangular
 */
export function forwardSubstitution(L: Matrix, b: number[]): number[] {
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
    
    const Lii = L.get(i, i);
    if (Math.abs(Lii) < 1e-15) {
      throw new Error(`Zero diagonal element at index ${i}`);
    }
    
    y[i] = ((b[i] ?? 0) - sum) / Lii;
  }

  return y;
}

/**
 * Backward substitution: Solve U * x = y for x
 * where U is upper triangular
 */
export function backwardSubstitution(U: Matrix, y: number[]): number[] {
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
      throw new Error(`Zero diagonal element at index ${i}`);
    }
    
    x[i] = ((y[i] ?? 0) - sum) / Uii;
  }

  return x;
}

/**
 * Solve A * x = b using Cholesky decomposition
 * where A is symmetric positive-definite
 * 
 * Steps:
 * 1. Decompose A = L * L^T
 * 2. Solve L * y = b (forward substitution)
 * 3. Solve L^T * x = y (backward substitution)
 */
export function choleskySolve(A: Matrix, b: number[]): number[] {
  const L = choleskyDecompose(A);
  const y = forwardSubstitution(L, b);
  const x = backwardSubstitution(L.transpose(), y);
  return x;
}

/**
 * Check if a matrix is positive definite by attempting Cholesky decomposition
 */
export function isPositiveDefinite(A: Matrix): boolean {
  try {
    choleskyDecompose(A);
    return true;
  } catch (e) {
    if (e instanceof NotPositiveDefiniteError) {
      return false;
    }
    throw e;
  }
}
