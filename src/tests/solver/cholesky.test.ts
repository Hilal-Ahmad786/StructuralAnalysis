/**
 * Tests for Cholesky Decomposition
 */

import { describe, it, expect } from 'vitest';
import { Matrix } from '@/lib/math/matrix';
import { 
  choleskyDecompose, 
  choleskySolve, 
  forwardSubstitution,
  backwardSubstitution,
  isPositiveDefinite,
  NotPositiveDefiniteError 
} from '@/lib/math/cholesky';

describe('Cholesky Decomposition', () => {
  describe('choleskyDecompose', () => {
    it('decomposes a simple SPD matrix', () => {
      // A = [4, 2; 2, 5] is SPD
      const A = Matrix.from2D([
        [4, 2],
        [2, 5],
      ]);
      
      const L = choleskyDecompose(A);
      
      // Verify L * L^T = A
      const LLt = L.multiply(L.transpose());
      
      expect(Math.abs(LLt.get(0, 0) - 4)).toBeLessThan(1e-10);
      expect(Math.abs(LLt.get(0, 1) - 2)).toBeLessThan(1e-10);
      expect(Math.abs(LLt.get(1, 0) - 2)).toBeLessThan(1e-10);
      expect(Math.abs(LLt.get(1, 1) - 5)).toBeLessThan(1e-10);
    });

    it('decomposes a 3x3 SPD matrix', () => {
      // A well-conditioned SPD matrix
      const A = Matrix.from2D([
        [4, 2, 1],
        [2, 5, 2],
        [1, 2, 6],
      ]);
      
      const L = choleskyDecompose(A);
      const LLt = L.multiply(L.transpose());
      
      // Check all elements match
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          expect(Math.abs(LLt.get(i, j) - A.get(i, j))).toBeLessThan(1e-10);
        }
      }
    });

    it('produces lower triangular matrix', () => {
      const A = Matrix.from2D([
        [4, 2],
        [2, 5],
      ]);
      
      const L = choleskyDecompose(A);
      
      // Upper triangle should be zero
      expect(L.get(0, 1)).toBe(0);
    });

    it('throws for non-positive-definite matrix', () => {
      // A = [1, 2; 2, 1] is not positive definite
      const A = Matrix.from2D([
        [1, 2],
        [2, 1],
      ]);
      
      expect(() => choleskyDecompose(A)).toThrow(NotPositiveDefiniteError);
    });

    it('throws for non-square matrix', () => {
      const A = Matrix.zeros(2, 3);
      expect(() => choleskyDecompose(A)).toThrow();
    });
  });

  describe('forwardSubstitution', () => {
    it('solves L * y = b', () => {
      const L = Matrix.from2D([
        [2, 0],
        [1, 3],
      ]);
      const b = [4, 7];
      
      const y = forwardSubstitution(L, b);
      
      // L * y should equal b
      expect(Math.abs(y[0]! - 2)).toBeLessThan(1e-10); // 2*2 = 4
      expect(Math.abs(y[1]! - 5/3)).toBeLessThan(1e-10); // 1*2 + 3*y[1] = 7 => y[1] = 5/3
    });
  });

  describe('backwardSubstitution', () => {
    it('solves U * x = y', () => {
      const U = Matrix.from2D([
        [2, 1],
        [0, 3],
      ]);
      const y = [5, 6];
      
      const x = backwardSubstitution(U, y);
      
      // U * x should equal y
      // x[1] = 6/3 = 2
      // 2*x[0] + 1*2 = 5 => x[0] = 1.5
      expect(Math.abs(x[1]! - 2)).toBeLessThan(1e-10);
      expect(Math.abs(x[0]! - 1.5)).toBeLessThan(1e-10);
    });
  });

  describe('choleskySolve', () => {
    it('solves A * x = b for SPD matrix', () => {
      const A = Matrix.from2D([
        [4, 2],
        [2, 5],
      ]);
      const b = [8, 11];
      
      const x = choleskySolve(A, b);
      
      // Verify A * x = b
      const Ax = A.multiplyVector(x);
      expect(Math.abs(Ax[0]! - 8)).toBeLessThan(1e-10);
      expect(Math.abs(Ax[1]! - 11)).toBeLessThan(1e-10);
    });

    it('solves a larger system', () => {
      const A = Matrix.from2D([
        [10, 2, 1],
        [2, 8, 2],
        [1, 2, 6],
      ]);
      const b = [13, 12, 9];
      
      const x = choleskySolve(A, b);
      
      // Verify A * x = b
      const Ax = A.multiplyVector(x);
      for (let i = 0; i < 3; i++) {
        expect(Math.abs(Ax[i]! - b[i]!)).toBeLessThan(1e-9);
      }
    });
  });

  describe('isPositiveDefinite', () => {
    it('returns true for SPD matrix', () => {
      const A = Matrix.from2D([
        [4, 2],
        [2, 5],
      ]);
      expect(isPositiveDefinite(A)).toBe(true);
    });

    it('returns false for non-SPD matrix', () => {
      const A = Matrix.from2D([
        [1, 2],
        [2, 1],
      ]);
      expect(isPositiveDefinite(A)).toBe(false);
    });

    it('returns true for identity matrix', () => {
      const I = Matrix.identity(3);
      expect(isPositiveDefinite(I)).toBe(true);
    });
  });
});
