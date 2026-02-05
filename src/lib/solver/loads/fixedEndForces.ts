/**
 * Fixed-End Forces (FEF) Calculation
 * 
 * Fixed-end forces are the nodal forces required to keep the ends of
 * a member "fixed" (zero displacement/rotation) when loads are applied.
 * 
 * SIGN CONVENTIONS (per spec addendum v2.2):
 * 
 * - w > 0: load in local +y direction (upward in local coords)
 * - For gravity (downward in global Y) on horizontal member: w < 0
 * 
 * - FEF are forces that the element exerts ON the nodes to keep them fixed
 * - f1y > 0: pushes start node in local +y direction
 * - m1 > 0: rotates start node counter-clockwise
 */

import { frameTransformationMatrix } from '../elements/frame';

/**
 * Fixed-end forces for a uniform distributed load (UDL) on a frame element.
 * 
 * @param w - Load magnitude in local +y direction (kN/m)
 *            Positive = upward in local coords
 *            For gravity on horizontal member: w < 0
 * @param L - Member length (m)
 * @returns [f1x, f1y, m1, f2x, f2y, m2] - fixed-end forces in local coords
 * 
 * Standard formulas (reactions to make ends fixed):
 * - f1y = f2y = -wL/2 (opposite to load direction)
 * - m1 = -wL²/12 (CW at start for upward load)
 * - m2 = +wL²/12 (CCW at end for upward load)
 */
export function udlFixedEndForces(w: number, L: number): number[] {
  if (L <= 0) throw new Error(`L must be positive, got ${L}`);

  const wL = w * L;
  const wL2 = w * L * L;

  // Fixed-end forces (reactions to restrain the member)
  // These oppose the applied load
  const f1x = 0;
  const f1y = -wL / 2;        // Reaction at start
  const m1 = -wL2 / 12;       // Moment at start (CW for w > 0)
  const f2x = 0;
  const f2y = -wL / 2;        // Reaction at end
  const m2 = wL2 / 12;        // Moment at end (CCW for w > 0)

  return [f1x, f1y, m1, f2x, f2y, m2];
}

/**
 * Fixed-end forces for a point load on a frame element.
 * (V1 feature - included for completeness)
 * 
 * @param P - Load magnitude in local +y direction (kN)
 * @param a - Distance from start node to load point (m)
 * @param L - Member length (m)
 * @returns [f1x, f1y, m1, f2x, f2y, m2] - fixed-end forces in local coords
 */
export function pointLoadFixedEndForces(P: number, a: number, L: number): number[] {
  if (L <= 0) throw new Error(`L must be positive, got ${L}`);
  if (a < 0 || a > L) throw new Error(`a must be in [0, L], got ${a}`);

  const b = L - a;
  const L2 = L * L;
  const L3 = L * L * L;

  // Standard fixed-end force formulas for point load at distance a
  const f1x = 0;
  const f1y = -P * b * b * (3 * a + b) / L3;
  const m1 = -P * a * b * b / L2;
  const f2x = 0;
  const f2y = -P * a * a * (a + 3 * b) / L3;
  const m2 = P * a * a * b / L2;

  return [f1x, f1y, m1, f2x, f2y, m2];
}

/**
 * Direction types for load specification
 */
export type LoadDirection = 'localY' | 'localNegY' | 'globalY' | 'globalNegY';

/**
 * Convert a distributed load from global/UI direction to local w value.
 * 
 * @param magnitude - Load magnitude (always positive in UI)
 * @param direction - Load direction enum
 * @param memberAngle - Member angle from global +X (radians)
 * @returns w - Load in local +y direction (can be negative)
 */
export function convertLoadToLocalW(
  magnitude: number,
  direction: LoadDirection,
  memberAngle: number
): number {
  switch (direction) {
    case 'localY':
      return magnitude;
    case 'localNegY':
      return -magnitude;
    case 'globalY':
      // Project global +Y onto local +y
      // Local +y direction in global coords: (-sin(θ), cos(θ))
      // Global +Y is (0, 1)
      // Projection: cos(θ)
      return magnitude * Math.cos(memberAngle);
    case 'globalNegY':
      // Gravity load (global -Y)
      return -magnitude * Math.cos(memberAngle);
  }
}

/**
 * Transform fixed-end forces from local to global coordinates.
 */
export function transformFEFToGlobal(fef_local: number[], memberAngle: number): number[] {
  const T = frameTransformationMatrix(memberAngle);
  const T_t = T.transpose();
  return T_t.multiplyVector(fef_local);
}

/**
 * Compute equivalent nodal loads from fixed-end forces.
 * 
 * Equivalent nodal loads = -FEF
 * 
 * These are the loads that go into the global force vector F
 * to represent member loads as equivalent nodal actions.
 */
export function computeEquivalentNodalLoads(fef_global: number[]): number[] {
  return fef_global.map(f => -f);
}

/**
 * Combined function: compute equivalent nodal loads for a UDL.
 * 
 * @param w_local - Load in local +y direction (kN/m)
 * @param L - Member length (m)
 * @param memberAngle - Member angle (radians)
 * @returns Equivalent nodal loads in global coords [f1x, f1y, m1, f2x, f2y, m2]
 */
export function udlEquivalentNodalLoads(
  w_local: number,
  L: number,
  memberAngle: number
): number[] {
  const fef_local = udlFixedEndForces(w_local, L);
  const fef_global = transformFEFToGlobal(fef_local, memberAngle);
  return computeEquivalentNodalLoads(fef_global);
}

/**
 * Fixed-end forces for a trapezoidal (linearly varying) distributed load.
 *
 * The load varies linearly from w1 at start (x=0) to w2 at end (x=L):
 * w(x) = w1 + (w2 - w1) * x / L
 *
 * @param w1 - Load at start in local +y direction (kN/m)
 * @param w2 - Load at end in local +y direction (kN/m)
 * @param L - Member length (m)
 * @returns [f1x, f1y, m1, f2x, f2y, m2] - fixed-end forces in local coords
 *
 * Standard formulas for trapezoidal load:
 * f1y = -(L/20) * (7*w1 + 3*w2)
 * f2y = -(L/20) * (3*w1 + 7*w2)
 * m1  = -(L²/60) * (3*w1 + 2*w2)
 * m2  = +(L²/60) * (2*w1 + 3*w2)
 */
export function trapezoidalFixedEndForces(w1: number, w2: number, L: number): number[] {
  if (L <= 0) throw new Error(`L must be positive, got ${L}`);

  const L2 = L * L;

  // Fixed-end forces for trapezoidal load
  const f1x = 0;
  const f1y = -(L / 20) * (7 * w1 + 3 * w2);
  const m1 = -(L2 / 60) * (3 * w1 + 2 * w2);
  const f2x = 0;
  const f2y = -(L / 20) * (3 * w1 + 7 * w2);
  const m2 = (L2 / 60) * (2 * w1 + 3 * w2);

  return [f1x, f1y, m1, f2x, f2y, m2];
}

/**
 * Combined function: compute equivalent nodal loads for a trapezoidal load.
 *
 * @param w1_local - Load at start in local +y direction (kN/m)
 * @param w2_local - Load at end in local +y direction (kN/m)
 * @param L - Member length (m)
 * @param memberAngle - Member angle (radians)
 * @returns Equivalent nodal loads in global coords [f1x, f1y, m1, f2x, f2y, m2]
 */
export function trapezoidalEquivalentNodalLoads(
  w1_local: number,
  w2_local: number,
  L: number,
  memberAngle: number
): number[] {
  const fef_local = trapezoidalFixedEndForces(w1_local, w2_local, L);
  const fef_global = transformFEFToGlobal(fef_local, memberAngle);
  return computeEquivalentNodalLoads(fef_global);
}

/**
 * Fixed-end forces for temperature loading on a frame element.
 *
 * Temperature effects cause equivalent forces at the restrained ends:
 * - Uniform temperature change (deltaT): causes axial strain ε = α * ΔT
 *   If restrained, this produces axial force N = E * A * α * ΔT
 * - Temperature gradient (gradT): causes curvature κ = α * ΔT_grad / h
 *   If restrained, this produces moment M = E * I * α * ΔT_grad / h
 *
 * @param E - Young's modulus (kPa)
 * @param A - Cross-sectional area (m²)
 * @param I - Moment of inertia (m⁴)
 * @param alpha - Thermal expansion coefficient (1/°C)
 * @param deltaT - Uniform temperature change (°C), positive = heating
 * @param gradT - Temperature gradient top-bottom (°C), positive = top hotter
 * @param h - Section depth (m)
 * @returns [f1x, f1y, m1, f2x, f2y, m2] - fixed-end forces in local coords
 */
export function temperatureFixedEndForces(
  E: number,
  A: number,
  I: number,
  alpha: number,
  deltaT: number,
  gradT: number,
  h: number
): number[] {
  // Axial force due to uniform temperature change
  // If member tries to expand but is restrained, compressive force develops
  // f1x = -N (reaction at start), f2x = +N (reaction at end)
  const N = E * A * alpha * deltaT;

  // Moment due to temperature gradient
  // If top is hotter, it expands more, causing member to bend concave up
  // Restrained moments resist this curvature
  const M = h > 0 ? E * I * alpha * gradT / h : 0;

  // Fixed-end forces (forces to restrain the thermal effects)
  const f1x = -N;
  const f1y = 0;
  const m1 = -M;
  const f2x = N;
  const f2y = 0;
  const m2 = M;

  return [f1x, f1y, m1, f2x, f2y, m2];
}

/**
 * Combined function: compute equivalent nodal loads for temperature loading.
 */
export function temperatureEquivalentNodalLoads(
  E: number,
  A: number,
  I: number,
  alpha: number,
  deltaT: number,
  gradT: number,
  h: number,
  memberAngle: number
): number[] {
  const fef_local = temperatureFixedEndForces(E, A, I, alpha, deltaT, gradT, h);
  const fef_global = transformFEFToGlobal(fef_local, memberAngle);
  return computeEquivalentNodalLoads(fef_global);
}
