/**
 * Truss Element (2D)
 * 
 * DOFs per node: 2 (ux, uy)
 * Total DOFs per element: 4
 * 
 * Truss elements carry only axial force (no shear, no moment).
 * 
 * Local coordinate system:
 * - x-axis: along member, from start node to end node
 * - y-axis: perpendicular, 90° CCW from x-axis
 */

import { Matrix } from '../../math/matrix';

/**
 * Compute local stiffness matrix for a 2D truss element.
 * 
 * @param E - Young's modulus (kPa)
 * @param A - Cross-sectional area (m²)
 * @param L - Member length (m)
 * @returns 4x4 local stiffness matrix
 * 
 * DOF order: [u1, v1, u2, v2] in local coordinates
 * u = axial displacement (along member)
 * v = transverse displacement (perpendicular)
 * 
 * Note: In local coords, only axial stiffness exists.
 * The v DOFs have zero stiffness but are included for transformation.
 */
export function trussLocalStiffness(E: number, A: number, L: number): Matrix {
  if (E <= 0) throw new Error(`E must be positive, got ${E}`);
  if (A <= 0) throw new Error(`A must be positive, got ${A}`);
  if (L <= 0) throw new Error(`L must be positive, got ${L}`);

  const k = (E * A) / L;

  // Local stiffness matrix
  // [  k   0  -k   0 ]   [ u1 ]
  // [  0   0   0   0 ] * [ v1 ]
  // [ -k   0   k   0 ]   [ u2 ]
  // [  0   0   0   0 ]   [ v2 ]
  
  return Matrix.from2D([
    [ k,  0, -k,  0],
    [ 0,  0,  0,  0],
    [-k,  0,  k,  0],
    [ 0,  0,  0,  0],
  ]);
}

/**
 * Compute transformation matrix for a 2D truss element.
 * Transforms from global to local coordinates.
 * 
 * @param angle - Member angle (radians), from global +X to local +x, CCW positive
 * @returns 4x4 transformation matrix T
 * 
 * Usage: d_local = T * d_global
 *        k_global = T^T * k_local * T
 */
export function trussTransformationMatrix(angle: number): Matrix {
  const c = Math.cos(angle);
  const s = Math.sin(angle);

  // T transforms global [ux, uy] to local [u, v]
  // [ u ]   [ c  s ] [ ux ]
  // [ v ] = [-s  c ] [ uy ]
  
  return Matrix.from2D([
    [ c,  s,  0,  0],
    [-s,  c,  0,  0],
    [ 0,  0,  c,  s],
    [ 0,  0, -s,  c],
  ]);
}

/**
 * Compute global stiffness matrix for a 2D truss element.
 * 
 * @param E - Young's modulus (kPa)
 * @param A - Cross-sectional area (m²)
 * @param L - Member length (m)
 * @param angle - Member angle (radians)
 * @returns 4x4 global stiffness matrix
 * 
 * DOF order: [ux1, uy1, ux2, uy2] in global coordinates
 */
export function trussGlobalStiffness(E: number, A: number, L: number, angle: number): Matrix {
  const k_local = trussLocalStiffness(E, A, L);
  const T = trussTransformationMatrix(angle);
  const T_t = T.transpose();

  // k_global = T^T * k_local * T
  return T_t.multiply(k_local).multiply(T);
}

/**
 * Compute global stiffness matrix using direct formula (optimized).
 * 
 * This avoids explicit matrix multiplication and is numerically
 * equivalent to T^T * k_local * T but faster.
 */
export function trussGlobalStiffnessDirect(E: number, A: number, L: number, angle: number): Matrix {
  if (E <= 0) throw new Error(`E must be positive, got ${E}`);
  if (A <= 0) throw new Error(`A must be positive, got ${A}`);
  if (L <= 0) throw new Error(`L must be positive, got ${L}`);

  const k = (E * A) / L;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const c2 = c * c;
  const s2 = s * s;
  const cs = c * s;

  // Expanded form of T^T * k_local * T
  return Matrix.from2D([
    [ k * c2,   k * cs,  -k * c2,  -k * cs],
    [ k * cs,   k * s2,  -k * cs,  -k * s2],
    [-k * c2,  -k * cs,   k * c2,   k * cs],
    [-k * cs,  -k * s2,   k * cs,   k * s2],
  ]);
}

/**
 * Extract axial force from local displacements for truss element.
 * 
 * @param E - Young's modulus (kPa)
 * @param A - Cross-sectional area (m²)
 * @param L - Member length (m)
 * @param d_local - Local displacements [u1, v1, u2, v2]
 * @returns Axial force N (positive = tension)
 */
export function trussAxialForce(E: number, A: number, L: number, d_local: number[]): number {
  const u1 = d_local[0] ?? 0;
  const u2 = d_local[2] ?? 0;
  
  // Axial strain: ε = (u2 - u1) / L
  // Axial stress: σ = E * ε
  // Axial force:  N = σ * A = E * A * (u2 - u1) / L
  const N = (E * A / L) * (u2 - u1);
  
  return N;  // Positive = tension
}

/**
 * Transform global displacements to local for truss element.
 */
export function trussGlobalToLocalDisp(d_global: number[], angle: number): number[] {
  const T = trussTransformationMatrix(angle);
  return T.multiplyVector(d_global);
}
