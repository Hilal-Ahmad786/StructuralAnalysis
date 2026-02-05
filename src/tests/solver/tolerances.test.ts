import { describe, it, expect } from 'vitest';

import { isNumericallyEqual, isEffectivelyZero, SOLVER_TOLERANCES } from '@/lib/solver/tolerances';

describe('Solver Tolerances', () => {
  describe('isNumericallyEqual', () => {
    it('returns true for identical values', () => {
      expect(isNumericallyEqual(1.0, 1.0)).toBe(true);
      expect(isNumericallyEqual(0.0, 0.0)).toBe(true);
      expect(isNumericallyEqual(-5.5, -5.5)).toBe(true);
    });

    it('returns true for values within relative tolerance', () => {
      const a = 100.0;
      const b = 100.0 + 1e-10; // Within 1e-9 relative tolerance
      expect(isNumericallyEqual(a, b)).toBe(true);
    });

    it('returns false for values outside relative tolerance', () => {
      const a = 100.0;
      const b = 100.1; // 0.1% difference, outside 1e-9 tolerance
      expect(isNumericallyEqual(a, b)).toBe(false);
    });

    it('uses absolute tolerance for values near zero', () => {
      const a = 1e-13;
      const b = 2e-13;
      // Both are below absolute tolerance, so considered equal
      expect(isNumericallyEqual(a, b)).toBe(true);
    });

    it('handles negative numbers correctly', () => {
      expect(isNumericallyEqual(-100.0, -100.0 - 1e-10)).toBe(true);
      expect(isNumericallyEqual(-100.0, -100.1)).toBe(false);
    });
  });

  describe('isEffectivelyZero', () => {
    it('returns true for very small values', () => {
      expect(isEffectivelyZero(1e-15)).toBe(true);
      expect(isEffectivelyZero(-1e-15)).toBe(true);
    });

    it('returns false for non-zero values', () => {
      expect(isEffectivelyZero(0.001)).toBe(false);
      expect(isEffectivelyZero(-0.001)).toBe(false);
    });

    it('respects the reference value', () => {
      // With reference of 1e6, threshold is max(1e-12, 1e6 * 1e-14) = max(1e-12, 1e-8) = 1e-8
      expect(isEffectivelyZero(1e-9, 1e6)).toBe(true);
      expect(isEffectivelyZero(1e-5, 1e6)).toBe(false);
    });
  });

  describe('SOLVER_TOLERANCES constants', () => {
    it('has expected values', () => {
      expect(SOLVER_TOLERANCES.RELATIVE).toBe(1e-9);
      expect(SOLVER_TOLERANCES.ABSOLUTE).toBe(1e-12);
      expect(SOLVER_TOLERANCES.EQUILIBRIUM).toBe(1e-6);
      expect(SOLVER_TOLERANCES.DIAGRAM_SAMPLING_POINTS).toBe(21);
    });
  });
});
