/**
 * Post-Processing
 * 
 * Computes member forces, reactions, and diagrams from solved displacements.
 * 
 * SIGN CONVENTIONS (per spec addendum v2.2):
 * 
 * Internal forces (at a section cut, on positive/right face):
 * - N > 0: tension
 * - V > 0: causes CW rotation of left segment
 * - M > 0: causes bottom fiber tension (sagging)
 * 
 * Diagrams are computed from equilibrium of the left segment:
 * - N(x) = -f1x
 * - V(x) = f1y + w·x
 * - M(x) = m1 + f1y·x + (w·x²)/2
 * 
 * where f1x, f1y, m1 are nodal forces (element ON node).
 */

import type { 
  Member, 
  LoadCase, 
  StructuralModel 
} from '@/types';
import type { 
  MemberResult, 
  MemberEndForcesLocal, 
  MemberDiagrams, 
  DiagramPoint,
  ReactionResult,
  NodeDisplacement,
} from '@/types/analysis';
import type { DOFMap } from './dofMap';
import type { PartitionedSystem } from './boundary';
import { frameLocalStiffness, frameGlobalToLocalDisp } from './elements/frame';
import { trussGlobalToLocalDisp, trussAxialForce } from './elements/truss';
import { getMemberLength, getMemberAngle, getMemberMaterial, getMemberSection } from './geometry';
import { udlFixedEndForces, trapezoidalFixedEndForces, pointLoadFixedEndForces, convertLoadToLocalW, type LoadDirection } from './loads/fixedEndForces';
import { getElementDOFs } from './dofMap';
import { SOLVER_TOLERANCES } from './tolerances';

const NUM_DIAGRAM_POINTS = SOLVER_TOLERANCES.DIAGRAM_SAMPLING_POINTS;

/**
 * Compute all member results (end forces and diagrams).
 */
export function computeMemberResults(
  model: StructuralModel,
  loadCase: LoadCase,
  displacements: number[],
  dofMap: DOFMap
): MemberResult[] {
  const results: MemberResult[] = [];

  for (const member of model.members) {
    const result = computeSingleMemberResult(
      member,
      model,
      loadCase,
      displacements,
      dofMap
    );
    results.push(result);
  }

  return results;
}

/**
 * Load info for trapezoidal/uniform distributed loads.
 */
interface DistributedLoadInfo {
  w1: number;  // Load at start (local +y direction)
  w2: number;  // Load at end (local +y direction)
  isTrapezoidal: boolean;
}

/**
 * Point load on a member.
 */
interface MemberPointLoad {
  P: number;  // Load magnitude in local +y direction (kN)
  a: number;  // Distance from start node (m)
}

/**
 * Compute results for a single member.
 */
function computeSingleMemberResult(
  member: Member,
  model: StructuralModel,
  loadCase: LoadCase,
  displacements: number[],
  dofMap: DOFMap
): MemberResult {
  // Get member properties
  const { E } = getMemberMaterial(member, model);
  const { A, I } = getMemberSection(member, model);
  const L = getMemberLength(member, model.nodes);
  const angle = getMemberAngle(member, model.nodes);

  // Get element displacements
  const elementDOFs = getElementDOFs(member, dofMap);
  const d_global = elementDOFs.map(i => displacements[i] ?? 0);

  // Get distributed load on member (if any)
  const memberDistLoad = loadCase.loads.find(
    l => l.target === 'member' && l.targetId === member.id && l.type === 'distributed'
  );

  let loadInfo: DistributedLoadInfo = { w1: 0, w2: 0, isTrapezoidal: false };
  if (memberDistLoad) {
    const direction = (memberDistLoad.direction ?? 'globalNegY') as LoadDirection;
    if (memberDistLoad.wStart !== undefined && memberDistLoad.wEnd !== undefined) {
      // Trapezoidal load
      loadInfo = {
        w1: convertLoadToLocalW(memberDistLoad.wStart, direction, angle),
        w2: convertLoadToLocalW(memberDistLoad.wEnd, direction, angle),
        isTrapezoidal: true
      };
    } else {
      // UDL
      const w = convertLoadToLocalW(memberDistLoad.w ?? 0, direction, angle);
      loadInfo = { w1: w, w2: w, isTrapezoidal: false };
    }
  }

  // Get point loads on member (if any)
  const memberPointLoads = loadCase.loads.filter(
    l => l.target === 'member' && l.targetId === member.id && l.type === 'point'
  );

  const pointLoads: MemberPointLoad[] = memberPointLoads.map(pLoad => {
    const direction = (pLoad.direction ?? 'globalNegY') as LoadDirection;
    const P = convertLoadToLocalW(pLoad.fy ?? 0, direction, angle);
    const position = pLoad.position ?? 0.5;
    return { P, a: position * L };
  });

  if (member.type === 'truss') {
    return computeTrussResult(member.id, E, A, L, angle, d_global);
  } else {
    return computeFrameResult(member.id, E, A, I, L, angle, d_global, loadInfo, pointLoads);
  }
}

/**
 * Compute results for a truss member.
 */
function computeTrussResult(
  memberId: string,
  E: number,
  A: number,
  L: number,
  angle: number,
  d_global: number[]
): MemberResult {
  // Transform to local
  const d_local = trussGlobalToLocalDisp(d_global, angle);
  
  // Compute axial force
  const N = trussAxialForce(E, A, L, d_local);

  // End forces (in local coords, as nodal forces)
  // For truss: only axial, f1x = -N (compression), f2x = N
  const endForcesLocal: MemberEndForcesLocal = {
    f1x: -N,  // Force on start node in +x (local) = -N for tension
    f1y: 0,
    m1: 0,
    f2x: N,   // Force on end node in +x (local) = N for tension
    f2y: 0,
    m2: 0,
  };

  // Diagrams: truss has constant axial force, no shear/moment
  const diagrams: MemberDiagrams = {
    axial: [
      { x: 0, value: N },
      { x: L, value: N },
    ],
    shear: [],
    moment: [],
    deflection: computeTrussDeflection(d_local, L),
  };

  return { memberId, endForcesLocal, diagrams };
}

/**
 * Compute deflection diagram for truss (linear interpolation).
 */
function computeTrussDeflection(d_local: number[], L: number): DiagramPoint[] {
  const v1 = d_local[1] ?? 0;  // Transverse displacement at start
  const v2 = d_local[3] ?? 0;  // Transverse displacement at end

  const points: DiagramPoint[] = [];
  for (let i = 0; i < NUM_DIAGRAM_POINTS; i++) {
    const x = (i / (NUM_DIAGRAM_POINTS - 1)) * L;
    const xi = x / L;
    const value = v1 * (1 - xi) + v2 * xi;
    points.push({ x, value });
  }

  return points;
}

/**
 * Compute results for a frame member.
 */
function computeFrameResult(
  memberId: string,
  E: number,
  A: number,
  I: number,
  L: number,
  angle: number,
  d_global: number[],
  loadInfo: DistributedLoadInfo,
  pointLoads: MemberPointLoad[] = []
): MemberResult {
  // Transform to local
  const d_local = frameGlobalToLocalDisp(d_global, angle);

  // Compute forces from displacements: k * d
  const k_local = frameLocalStiffness(E, A, I, L);
  const f_from_disp = k_local.multiplyVector(d_local);

  // Get fixed-end forces based on load type
  let fef_local: number[];
  if (loadInfo.isTrapezoidal) {
    fef_local = trapezoidalFixedEndForces(loadInfo.w1, loadInfo.w2, L);
  } else {
    fef_local = udlFixedEndForces(loadInfo.w1, L);
  }

  // Add point load FEF contributions
  for (const pLoad of pointLoads) {
    const pFef = pointLoadFixedEndForces(pLoad.P, pLoad.a, L);
    for (let i = 0; i < 6; i++) {
      fef_local[i] = (fef_local[i] ?? 0) + (pFef[i] ?? 0);
    }
  }

  // Total end forces: f_total = k*d + fef
  const f_total: number[] = [];
  for (let i = 0; i < 6; i++) {
    f_total.push((f_from_disp[i] ?? 0) + (fef_local[i] ?? 0));
  }

  const endForcesLocal: MemberEndForcesLocal = {
    f1x: f_total[0] ?? 0,
    f1y: f_total[1] ?? 0,
    m1: f_total[2] ?? 0,
    f2x: f_total[3] ?? 0,
    f2y: f_total[4] ?? 0,
    m2: f_total[5] ?? 0,
  };

  // Compute diagrams
  const diagrams = computeFrameDiagrams(endForcesLocal, d_local, loadInfo, L, pointLoads);

  return { memberId, endForcesLocal, diagrams };
}

/**
 * Compute internal force and deflection diagrams for a frame element.
 *
 * Sign convention (per spec addendum v2.2):
 * - Internal forces on the positive (right) face of a cut:
 *   - N > 0: tension
 *   - V > 0: pointing downward (causes CW rotation of left segment)
 *   - M > 0: counter-clockwise (causes bottom fiber tension = sagging)
 *
 * Using equilibrium of LEFT segment [0, x]:
 * - f1y is the transverse force at node 1 (upward if positive)
 * - m1 is the moment at node 1 (CCW if positive)
 * - w is the distributed load in local +y direction
 *
 * For UDL (w constant):
 *   V(x) = f1y + w*x
 *   M(x) = -m1 + f1y*x + w*x²/2
 *
 * For trapezoidal load w(x) = w1 + (w2-w1)*x/L:
 *   V(x) = f1y + w1*x + (w2-w1)*x²/(2L)
 *   M(x) = -m1 + f1y*x + w1*x²/2 + (w2-w1)*x³/(6L)
 *
 * For point loads at position a:
 *   For x < a: no contribution
 *   For x >= a: V += P, M += P*(x-a)
 */
function computeFrameDiagrams(
  endForces: MemberEndForcesLocal,
  d_local: number[],
  loadInfo: DistributedLoadInfo,
  L: number,
  pointLoads: MemberPointLoad[] = []
): MemberDiagrams {
  const { f1x, f1y, m1 } = endForces;
  const [_u1, v1, theta1, _u2, v2, theta2] = d_local;
  const { w1, w2, isTrapezoidal } = loadInfo;

  // Generate sampling points, including point load locations for discontinuities
  const samplingPoints = new Set<number>();
  for (let i = 0; i < NUM_DIAGRAM_POINTS; i++) {
    samplingPoints.add((i / (NUM_DIAGRAM_POINTS - 1)) * L);
  }

  // Add points just before and after point load locations for discontinuity
  const epsilon = L * 1e-6;
  for (const pLoad of pointLoads) {
    samplingPoints.add(Math.max(0, pLoad.a - epsilon));
    samplingPoints.add(pLoad.a);
    samplingPoints.add(Math.min(L, pLoad.a + epsilon));
  }

  // Sort sampling points
  const sortedPoints = Array.from(samplingPoints).sort((a, b) => a - b);

  const axial: DiagramPoint[] = [];
  const shear: DiagramPoint[] = [];
  const moment: DiagramPoint[] = [];
  const deflection: DiagramPoint[] = [];

  for (const x of sortedPoints) {
    const xi = x / L;

    // Internal forces from equilibrium of left segment [0, x]
    // N(x): axial force (tension positive)
    const N = -f1x;

    let V: number;
    let M: number;

    if (isTrapezoidal) {
      // Trapezoidal load: w(x) = w1 + (w2-w1)*x/L
      const dw = w2 - w1;
      // V(x) = f1y + w1*x + (w2-w1)*x²/(2L)
      V = f1y + w1 * x + (dw * x * x) / (2 * L);
      // M(x) = -m1 + f1y*x + w1*x²/2 + (w2-w1)*x³/(6L)
      M = -m1 + f1y * x + (w1 * x * x) / 2 + (dw * x * x * x) / (6 * L);
    } else {
      // UDL: V(x) = f1y + w*x
      V = f1y + w1 * x;
      // M(x) = -m1 + f1y*x + w*x²/2
      M = -m1 + f1y * x + (w1 * x * x) / 2;
    }

    // Add point load contributions
    // For x >= a: V += P, M += P*(x-a)
    for (const pLoad of pointLoads) {
      if (x >= pLoad.a) {
        V += pLoad.P;
        M += pLoad.P * (x - pLoad.a);
      }
    }

    axial.push({ x, value: N });
    shear.push({ x, value: V });
    moment.push({ x, value: M });

    // Deflection using Hermite shape functions
    const N1 = 1 - 3 * xi * xi + 2 * xi * xi * xi;
    const N2 = xi - 2 * xi * xi + xi * xi * xi;
    const N3 = 3 * xi * xi - 2 * xi * xi * xi;
    const N4 = -xi * xi + xi * xi * xi;

    const v_x =
      (v1 ?? 0) * N1 +
      (theta1 ?? 0) * L * N2 +
      (v2 ?? 0) * N3 +
      (theta2 ?? 0) * L * N4;

    deflection.push({ x, value: v_x });
  }

  return { axial, shear, moment, deflection };
}

/**
 * Compute reaction results from solved system.
 */
export function computeReactions(
  model: StructuralModel,
  displacements: number[],
  F: number[],
  K: import('../math/matrix').Matrix,
  _partition: PartitionedSystem,
  dofMap: DOFMap
): ReactionResult[] {
  const reactions: ReactionResult[] = [];

  // Reactions at each support node
  for (const support of model.supports) {
    const nodeInfo = dofMap.nodeInfo.get(support.nodeId);
    if (!nodeInfo) continue;

    // Get displacement at this node
    const [uxIdx, uyIdx, rzIdx] = nodeInfo.globalDOFIndices;

    // Compute reaction forces: R = K * d - F at restrained DOFs
    let fx = 0;
    let fy = 0;
    let mz = 0;

    if (support.dx && uxIdx !== undefined) {
      // Sum K[uxIdx, :] * d - F[uxIdx]
      let kd = 0;
      for (let j = 0; j < K.cols; j++) {
        kd += K.get(uxIdx, j) * (displacements[j] ?? 0);
      }
      fx = kd - (F[uxIdx] ?? 0);
    }

    if (support.dy && uyIdx !== undefined) {
      let kd = 0;
      for (let j = 0; j < K.cols; j++) {
        kd += K.get(uyIdx, j) * (displacements[j] ?? 0);
      }
      fy = kd - (F[uyIdx] ?? 0);
    }

    if (support.rz && rzIdx !== undefined && nodeInfo.hasRotationDOF) {
      let kd = 0;
      for (let j = 0; j < K.cols; j++) {
        kd += K.get(rzIdx, j) * (displacements[j] ?? 0);
      }
      mz = kd - (F[rzIdx] ?? 0);
    }

    reactions.push({
      nodeId: support.nodeId,
      fx,
      fy,
      mz,
    });
  }

  return reactions;
}

/**
 * Extract node displacements from the solution vector.
 */
export function extractNodeDisplacements(
  displacements: number[],
  dofMap: DOFMap
): NodeDisplacement[] {
  const nodeDisplacements: NodeDisplacement[] = [];

  for (const [nodeId, info] of dofMap.nodeInfo) {
    const [uxIdx, uyIdx, rzIdx] = info.globalDOFIndices;

    const dx = uxIdx !== undefined ? (displacements[uxIdx] ?? 0) : 0;
    const dy = uyIdx !== undefined ? (displacements[uyIdx] ?? 0) : 0;
    const rz = (info.hasRotationDOF && rzIdx !== undefined) 
      ? (displacements[rzIdx] ?? 0) 
      : 0;

    nodeDisplacements.push({ nodeId, dx, dy, rz });
  }

  return nodeDisplacements;
}

/**
 * Check equilibrium of the solved system.
 */
export function checkEquilibrium(
  reactions: ReactionResult[],
  loadCase: LoadCase,
  model: StructuralModel
): { passed: boolean; fx: number; fy: number; mz: number } {
  // Sum of reactions
  let sumRx = 0;
  let sumRy = 0;
  let sumRm = 0;

  for (const r of reactions) {
    sumRx += r.fx;
    sumRy += r.fy;
    sumRm += r.mz;
  }

  // Sum of applied loads (nodal)
  let sumFx = 0;
  let sumFy = 0;
  let sumMz = 0;

  for (const load of loadCase.loads) {
    if (load.target === 'node') {
      sumFx += load.fx ?? 0;
      sumFy += load.fy ?? 0;
      sumMz += load.mz ?? 0;
    } else if (load.target === 'member') {
      // Member loads contribute to total force
      const member = model.members.find(m => m.id === load.targetId);
      if (member) {
        const L = getMemberLength(member, model.nodes);
        const w = load.w ?? 0;
        const direction = load.direction ?? 'globalNegY';
        
        // Total force from UDL
        if (direction === 'globalY') {
          sumFy += w * L;
        } else if (direction === 'globalNegY') {
          sumFy -= w * L;
        }
        // For local directions, need to transform (simplified here)
      }
    }
  }

  // Equilibrium error
  const fx = sumRx + sumFx;
  const fy = sumRy + sumFy;
  const mz = sumRm + sumMz;

  // Tolerance based on maximum load
  const maxLoad = Math.max(
    Math.abs(sumFx), 
    Math.abs(sumFy), 
    Math.abs(sumMz),
    1  // Minimum to avoid division by zero
  );
  const tolerance = SOLVER_TOLERANCES.EQUILIBRIUM * maxLoad;

  const passed = 
    Math.abs(fx) < tolerance &&
    Math.abs(fy) < tolerance &&
    Math.abs(mz) < tolerance;

  return { passed, fx, fy, mz };
}
