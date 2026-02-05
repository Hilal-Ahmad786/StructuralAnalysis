/**
 * Tests for Matrix operations
 */

import { describe, it, expect } from 'vitest';
import { 
  Matrix, 
  vectorAdd, 
  vectorSubtract, 
  vectorScale, 
  vectorDot, 
  vectorNorm 
} from '@/lib/math/matrix';

describe('Matrix', () => {
  describe('construction', () => {
    it('creates zero matrix', () => {
      const m = Matrix.zeros(3, 4);
      expect(m.rows).toBe(3);
      expect(m.cols).toBe(4);
      expect(m.get(0, 0)).toBe(0);
      expect(m.get(2, 3)).toBe(0);
    });

    it('creates identity matrix', () => {
      const m = Matrix.identity(3);
      expect(m.get(0, 0)).toBe(1);
      expect(m.get(1, 1)).toBe(1);
      expect(m.get(2, 2)).toBe(1);
      expect(m.get(0, 1)).toBe(0);
      expect(m.get(1, 0)).toBe(0);
    });

    it('creates from 2D array', () => {
      const m = Matrix.from2D([
        [1, 2, 3],
        [4, 5, 6],
      ]);
      expect(m.rows).toBe(2);
      expect(m.cols).toBe(3);
      expect(m.get(0, 0)).toBe(1);
      expect(m.get(0, 2)).toBe(3);
      expect(m.get(1, 1)).toBe(5);
    });

    it('throws on invalid dimensions', () => {
      expect(() => new Matrix(0, 3)).toThrow();
      expect(() => new Matrix(3, -1)).toThrow();
    });
  });

  describe('get/set', () => {
    it('sets and gets values', () => {
      const m = Matrix.zeros(2, 2);
      m.set(0, 1, 5);
      expect(m.get(0, 1)).toBe(5);
    });

    it('throws on out of bounds', () => {
      const m = Matrix.zeros(2, 2);
      expect(() => m.get(2, 0)).toThrow();
      expect(() => m.set(0, 2, 1)).toThrow();
    });
  });

  describe('operations', () => {
    it('transposes correctly', () => {
      const m = Matrix.from2D([
        [1, 2, 3],
        [4, 5, 6],
      ]);
      const t = m.transpose();
      expect(t.rows).toBe(3);
      expect(t.cols).toBe(2);
      expect(t.get(0, 0)).toBe(1);
      expect(t.get(2, 0)).toBe(3);
      expect(t.get(0, 1)).toBe(4);
    });

    it('adds matrices', () => {
      const a = Matrix.from2D([[1, 2], [3, 4]]);
      const b = Matrix.from2D([[5, 6], [7, 8]]);
      const c = a.addMatrix(b);
      expect(c.get(0, 0)).toBe(6);
      expect(c.get(1, 1)).toBe(12);
    });

    it('multiplies matrices', () => {
      const a = Matrix.from2D([[1, 2], [3, 4]]);
      const b = Matrix.from2D([[5, 6], [7, 8]]);
      const c = a.multiply(b);
      // [1,2] * [5,6; 7,8] = [1*5+2*7, 1*6+2*8] = [19, 22]
      // [3,4] * [5,6; 7,8] = [3*5+4*7, 3*6+4*8] = [43, 50]
      expect(c.get(0, 0)).toBe(19);
      expect(c.get(0, 1)).toBe(22);
      expect(c.get(1, 0)).toBe(43);
      expect(c.get(1, 1)).toBe(50);
    });

    it('multiplies matrix by vector', () => {
      const m = Matrix.from2D([[1, 2], [3, 4]]);
      const v = [5, 6];
      const result = m.multiplyVector(v);
      expect(result[0]).toBe(17); // 1*5 + 2*6
      expect(result[1]).toBe(39); // 3*5 + 4*6
    });

    it('scales matrix', () => {
      const m = Matrix.from2D([[1, 2], [3, 4]]);
      const scaled = m.scale(2);
      expect(scaled.get(0, 0)).toBe(2);
      expect(scaled.get(1, 1)).toBe(8);
    });
  });

  describe('properties', () => {
    it('detects square matrix', () => {
      expect(Matrix.zeros(3, 3).isSquare()).toBe(true);
      expect(Matrix.zeros(3, 4).isSquare()).toBe(false);
    });

    it('detects symmetric matrix', () => {
      const sym = Matrix.from2D([
        [1, 2, 3],
        [2, 4, 5],
        [3, 5, 6],
      ]);
      expect(sym.isSymmetric()).toBe(true);

      const nonsym = Matrix.from2D([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ]);
      expect(nonsym.isSymmetric()).toBe(false);
    });

    it('computes diagonal', () => {
      const m = Matrix.from2D([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ]);
      expect(m.diagonal()).toEqual([1, 5, 9]);
    });

    it('extracts submatrix', () => {
      const m = Matrix.from2D([
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 10, 11, 12],
      ]);
      const sub = m.extractSubmatrix([0, 2], [1, 3]);
      expect(sub.rows).toBe(2);
      expect(sub.cols).toBe(2);
      expect(sub.get(0, 0)).toBe(2);  // m[0][1]
      expect(sub.get(0, 1)).toBe(4);  // m[0][3]
      expect(sub.get(1, 0)).toBe(10); // m[2][1]
      expect(sub.get(1, 1)).toBe(12); // m[2][3]
    });
  });
});

describe('Vector operations', () => {
  it('adds vectors', () => {
    const result = vectorAdd([1, 2, 3], [4, 5, 6]);
    expect(result).toEqual([5, 7, 9]);
  });

  it('subtracts vectors', () => {
    const result = vectorSubtract([4, 5, 6], [1, 2, 3]);
    expect(result).toEqual([3, 3, 3]);
  });

  it('scales vectors', () => {
    const result = vectorScale([1, 2, 3], 2);
    expect(result).toEqual([2, 4, 6]);
  });

  it('computes dot product', () => {
    const result = vectorDot([1, 2, 3], [4, 5, 6]);
    expect(result).toBe(32); // 1*4 + 2*5 + 3*6
  });

  it('computes norm', () => {
    const result = vectorNorm([3, 4]);
    expect(result).toBe(5); // sqrt(9 + 16)
  });
});
