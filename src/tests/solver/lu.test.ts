/**
 * Tests for LU Decomposition
 */

import { describe, it, expect } from 'vitest';
import { Matrix } from '@/lib/math/matrix';
import { 
  luDecompose, 
  luSolve, 
  applyPermutation,
  estimateConditionNumber,
  SingularMatrixError 
} from '@/lib/math/lu';

describe('LU Decomposition', () => {
  describe('luDecompose', () => {
    it('decomposes a simple matrix', () => {
      const A = Matrix.from2D([
        [2, 1],
        [4, 3],
      ]);
      
      const { L, U, P } = luDecompose(A);
      
      // Verify P * A = L * U
      const LU = L.multiply(U);
      
      // Apply permutation to A
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          const pi = P[i]!;
          expect(Math.abs(LU.get(i, j) - A.get(pi, j))).toBeLessThan(1e-10);
        }
      }
    });

    it('handles matrix requiring pivoting', () => {
      // First pivot element is small, requires row swap
      const A = Matrix.from2D([
        [0.001, 1],
        [1, 1],
      ]);
      
      const { L, U, P } = luDecompose(A);
      const LU = L.multiply(U);
      
      // Verify P * A = L * U
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          const pi = P[i]!;
          expect(Math.abs(LU.get(i, j) - A.get(pi, j))).toBeLessThan(1e-10);
        }
      }
    });

    it('decomposes a 3x3 matrix', () => {
      const A = Matrix.from2D([
        [2, 1, 1],
        [4, 3, 3],
        [8, 7, 9],
      ]);
      
      const { L, U, P } = luDecompose(A);
      const LU = L.multiply(U);
      
      // Verify P * A = L * U
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const pi = P[i]!;
          expect(Math.abs(LU.get(i, j) - A.get(pi, j))).toBeLessThan(1e-10);
        }
      }
    });

    it('produces correct L and U structure', () => {
      const A = Matrix.from2D([
        [4, 2],
        [2, 5],
      ]);
      
      const { L, U } = luDecompose(A);
      
      // L should have unit diagonal
      expect(L.get(0, 0)).toBe(1);
      expect(L.get(1, 1)).toBe(1);
      
      // L should be lower triangular
      expect(L.get(0, 1)).toBe(0);
      
      // U should be upper triangular
      expect(U.get(1, 0)).toBe(0);
    });

    it('throws for singular matrix', () => {
      const A = Matrix.from2D([
        [1, 2],
        [2, 4], // Row 2 is multiple of row 1
      ]);
      
      expect(() => luDecompose(A)).toThrow(SingularMatrixError);
    });

    it('throws for non-square matrix', () => {
      const A = Matrix.zeros(2, 3);
      expect(() => luDecompose(A)).toThrow();
    });
  });

  describe('applyPermutation', () => {
    it('permutes a vector', () => {
      const P = [1, 0, 2]; // Swap first two elements
      const v = [10, 20, 30];
      
      const result = applyPermutation(P, v);
      
      expect(result).toEqual([20, 10, 30]);
    });

    it('handles identity permutation', () => {
      const P = [0, 1, 2];
      const v = [1, 2, 3];
      
      const result = applyPermutation(P, v);
      
      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe('luSolve', () => {
    it('solves A * x = b', () => {
      const A = Matrix.from2D([
        [2, 1],
        [4, 3],
      ]);
      const b = [3, 7];
      
      const x = luSolve(A, b);
      
      // Verify A * x = b
      const Ax = A.multiplyVector(x);
      expect(Math.abs(Ax[0]! - 3)).toBeLessThan(1e-10);
      expect(Math.abs(Ax[1]! - 7)).toBeLessThan(1e-10);
    });

    it('solves a system requiring pivoting', () => {
      const A = Matrix.from2D([
        [0.001, 1],
        [1, 1],
      ]);
      const b = [1.001, 2];
      
      const x = luSolve(A, b);
      
      // Verify A * x = b
      const Ax = A.multiplyVector(x);
      expect(Math.abs(Ax[0]! - b[0]!)).toBeLessThan(1e-9);
      expect(Math.abs(Ax[1]! - b[1]!)).toBeLessThan(1e-9);
    });

    it('solves a 3x3 system', () => {
      const A = Matrix.from2D([
        [2, 1, 1],
        [4, 3, 3],
        [8, 7, 9],
      ]);
      const b = [4, 10, 24];
      
      const x = luSolve(A, b);
      
      // Verify A * x = b
      const Ax = A.multiplyVector(x);
      for (let i = 0; i < 3; i++) {
        expect(Math.abs(Ax[i]! - b[i]!)).toBeLessThan(1e-9);
      }
    });
  });

  describe('estimateConditionNumber', () => {
    it('returns low condition number for well-conditioned matrix', () => {
      const A = Matrix.identity(3);
      const cond = estimateConditionNumber(A);
      
      // Identity matrix has condition number 1
      expect(cond).toBeCloseTo(1, 5);
    });

    it('returns higher condition number for ill-conditioned matrix', () => {
      // Hilbert-like matrix (ill-conditioned)
      const A = Matrix.from2D([
        [1, 0.5],
        [0.5, 0.334],
      ]);
      const cond = estimateConditionNumber(A);
      
      // Should be significantly greater than 1
      expect(cond).toBeGreaterThan(10);
    });

    it('scales with matrix conditioning', () => {
      const wellConditioned = Matrix.from2D([
        [10, 1],
        [1, 10],
      ]);
      
      const poorlyConditioned = Matrix.from2D([
        [10, 9.9],
        [9.9, 10],
      ]);
      
      const condWell = estimateConditionNumber(wellConditioned);
      const condPoor = estimateConditionNumber(poorlyConditioned);
      
      expect(condPoor).toBeGreaterThan(condWell);
    });
  });
});
