/**
 * Frame Element (2D)
 * 
 * DOFs per node: 3 (ux, uy, rz)
 * Total DOFs per element: 6
 * 
 * Frame elements carry axial force, shear, and bending moment.
 * 
 * Local coordinate system:
 * - x-axis: along member, from start node to end node
 * - y-axis: perpendicular, 90° CCW from x-axis
 * - z-axis: out of page (rotation axis)
 * 
 * Sign conventions (per spec addendum v2.2):
 * - Positive local +y: 90° CCW from +x
 * - Positive rotation θz: counter-clockwise
 */

import { Matrix } from '../../math/matrix';

/**
 * Compute local stiffness matrix for a 2D frame element.
 * 
 * @param E - Young's modulus (kPa)
 * @param A - Cross-sectional area (m²)
 * @param I - Moment of inertia (m⁴)
 * @param L - Member length (m)
 * @returns 6x6 local stiffness matrix
 * 
 * DOF order: [u1, v1, θ1, u2, v2, θ2] in local coordinates
 * u = axial displacement (along member)
 * v = transverse displacement (perpendicular, +y direction)
 * θ = rotation (CCW positive)
 */
export function frameLocalStiffness(E: number, A: number, I: number, L: number): Matrix {
  if (E <= 0) throw new Error(`E must be positive, got ${E}`);
  if (A <= 0) throw new Error(`A must be positive, got ${A}`);
  if (I <= 0) throw new Error(`I must be positive, got ${I}`);
  if (L <= 0) throw new Error(`L must be positive, got ${L}`);

  const L2 = L * L;
  const L3 = L2 * L;

  // Axial stiffness coefficient
  const EA_L = (E * A) / L;

  // Flexural stiffness coefficients
  const EI_L3 = (E * I) / L3;
  const EI_L2 = (E * I) / L2;
  const EI_L = (E * I) / L;

  // Standard 6x6 frame element stiffness matrix
  // Row/col order: [u1, v1, θ1, u2, v2, θ2]
  return Matrix.from2D([
    [ EA_L,           0,           0,    -EA_L,           0,           0],
    [    0,  12 * EI_L3,   6 * EI_L2,        0, -12 * EI_L3,   6 * EI_L2],
    [    0,   6 * EI_L2,   4 * EI_L,         0,  -6 * EI_L2,   2 * EI_L ],
    [-EA_L,           0,           0,     EA_L,           0,           0],
    [    0, -12 * EI_L3,  -6 * EI_L2,        0,  12 * EI_L3,  -6 * EI_L2],
    [    0,   6 * EI_L2,   2 * EI_L,         0,  -6 * EI_L2,   4 * EI_L ],
  ]);
}

/**
 * Compute transformation matrix for a 2D frame element.
 * Transforms from global to local coordinates.
 * 
 * @param angle - Member angle (radians), from global +X to local +x, CCW positive
 * @returns 6x6 transformation matrix T
 * 
 * Usage: d_local = T * d_global
 *        k_global = T^T * k_local * T
 */
export function frameTransformationMatrix(angle: number): Matrix {
  const c = Math.cos(angle);
  const s = Math.sin(angle);

  // T transforms global [ux, uy, θ] to local [u, v, θ]
  // [ u ]   [ c  s  0 ] [ ux ]
  // [ v ] = [-s  c  0 ] [ uy ]
  // [ θ ]   [ 0  0  1 ] [ θ  ]

  return Matrix.from2D([
    [ c,  s,  0,  0,  0,  0],
    [-s,  c,  0,  0,  0,  0],
    [ 0,  0,  1,  0,  0,  0],
    [ 0,  0,  0,  c,  s,  0],
    [ 0,  0,  0, -s,  c,  0],
    [ 0,  0,  0,  0,  0,  1],
  ]);
}

/**
 * Compute global stiffness matrix for a 2D frame element.
 * 
 * @param E - Young's modulus (kPa)
 * @param A - Cross-sectional area (m²)
 * @param I - Moment of inertia (m⁴)
 * @param L - Member length (m)
 * @param angle - Member angle (radians)
 * @returns 6x6 global stiffness matrix
 * 
 * DOF order: [ux1, uy1, θ1, ux2, uy2, θ2] in global coordinates
 */
export function frameGlobalStiffness(
  E: number,
  A: number,
  I: number,
  L: number,
  angle: number
): Matrix {
  const k_local = frameLocalStiffness(E, A, I, L);
  const T = frameTransformationMatrix(angle);
  const T_t = T.transpose();

  // k_global = T^T * k_local * T
  return T_t.multiply(k_local).multiply(T);
}

/**
 * Transform global displacements to local for frame element.
 */
export function frameGlobalToLocalDisp(d_global: number[], angle: number): number[] {
  const T = frameTransformationMatrix(angle);
  return T.multiplyVector(d_global);
}

/**
 * Transform local forces to global for frame element.
 */
export function frameLocalToGlobalForces(f_local: number[], angle: number): number[] {
  const T = frameTransformationMatrix(angle);
  const T_t = T.transpose();
  return T_t.multiplyVector(f_local);
}

/**
 * Compute member end forces in local coordinates from global displacements.
 * 
 * This computes f_local = k_local * T * d_global
 * 
 * @returns [f1x, f1y, m1, f2x, f2y, m2] - nodal forces in local coords
 * 
 * These are forces that the element exerts ON the nodes.
 */
export function frameEndForcesLocal(
  E: number,
  A: number,
  I: number,
  L: number,
  angle: number,
  d_global: number[]
): number[] {
  const k_local = frameLocalStiffness(E, A, I, L);
  const d_local = frameGlobalToLocalDisp(d_global, angle);
  return k_local.multiplyVector(d_local);
}

/**
 * Add fixed-end forces to get total member end forces.
 * 
 * f_total = k_local * d_local + fef_local
 * 
 * @param f_from_displacements - Forces from displacements (k * d)
 * @param fef_local - Fixed-end forces from member loads
 * @returns Total member end forces in local coordinates
 */
export function frameTotalEndForces(
  f_from_displacements: number[],
  fef_local: number[]
): number[] {
  if (f_from_displacements.length !== 6 || fef_local.length !== 6) {
    throw new Error('Expected 6-element arrays for frame forces');
  }

  const total: number[] = [];
  for (let i = 0; i < 6; i++) {
    total.push((f_from_displacements[i] ?? 0) + (fef_local[i] ?? 0));
  }
  return total;
}

/**
 * Compute local geometric stiffness matrix for P-Delta analysis.
 *
 * The geometric stiffness accounts for the destabilizing effect of
 * axial force on the bending stiffness (P-Delta effect).
 *
 * @param N - Axial force in member (kN), positive = tension
 * @param L - Member length (m)
 * @returns 6x6 local geometric stiffness matrix
 *
 * DOF order: [u1, v1, θ1, u2, v2, θ2] in local coordinates
 *
 * Note: For compression (N < 0), this reduces effective stiffness.
 * For tension (N > 0), this increases effective stiffness.
 */
export function frameLocalGeometricStiffness(N: number, L: number): Matrix {
  if (L <= 0) throw new Error(`L must be positive, got ${L}`);

  const L2 = L * L;
  const factor = N / L;

  // Geometric stiffness matrix (consistent mass approximation)
  // Row/col order: [u1, v1, θ1, u2, v2, θ2]
  return Matrix.from2D([
    [0,            0,             0,            0,            0,             0          ],
    [0,  factor*6/5,   factor*L/10,            0, -factor*6/5,   factor*L/10            ],
    [0,  factor*L/10,  factor*2*L2/15,         0, -factor*L/10, -factor*L2/30           ],
    [0,            0,             0,            0,            0,             0          ],
    [0, -factor*6/5,  -factor*L/10,            0,  factor*6/5,  -factor*L/10            ],
    [0,  factor*L/10, -factor*L2/30,           0, -factor*L/10,  factor*2*L2/15         ],
  ]);
}

/**
 * Compute global geometric stiffness matrix for P-Delta analysis.
 *
 * @param N - Axial force in member (kN), positive = tension
 * @param L - Member length (m)
 * @param angle - Member angle (radians)
 * @returns 6x6 global geometric stiffness matrix
 *
 * DOF order: [ux1, uy1, θ1, ux2, uy2, θ2] in global coordinates
 */
export function frameGlobalGeometricStiffness(
  N: number,
  L: number,
  angle: number
): Matrix {
  const kg_local = frameLocalGeometricStiffness(N, L);
  const T = frameTransformationMatrix(angle);
  const T_t = T.transpose();

  // kg_global = T^T * kg_local * T
  return T_t.multiply(kg_local).multiply(T);
}
