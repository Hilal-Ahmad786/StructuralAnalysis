/**
 * Boundary Conditions
 *
 * Applies support conditions by partitioning the system into
 * free and restrained DOFs.
 *
 * Method: DOF Partitioning
 *
 * Original system: K * d = F
 *
 * Partition:
 * [ Kff  Kfr ] [ df ]   [ Ff ]
 * [ Krf  Krr ] [ dr ] = [ Fr ]
 *
 * For dr = 0 (standard supports):
 * Solve: Kff * df = Ff
 *
 * For dr ≠ 0 (support settlements):
 * Solve: Kff * df = Ff - Kfr * dr
 *
 * Then recover reactions: Fr = Krf * df + Krr * dr
 */

import { Matrix, extractSubvector, expandVector } from '../math';
import { getRestrainedDOFs, getFreeDOFs } from './dofMap';
import type { DOFMap } from './dofMap';
import type { Support } from '@/types';

/**
 * Partitioned system ready for solving.
 */
export interface PartitionedSystem {
  /** Stiffness matrix for free DOFs (Kff) */
  Kff: Matrix;

  /** Load vector for free DOFs (Ff) - modified for settlements */
  Ff: number[];

  /** Original load vector for free DOFs (before settlement modification) */
  Ff_original: number[];

  /** Coupling stiffness (Krf) for reaction calculation */
  Krf: Matrix;

  /** Coupling stiffness (Kfr) for settlement effect on free DOFs */
  Kfr: Matrix;

  /** Stiffness at restrained DOFs (Krr) for settlement reactions */
  Krr: Matrix;

  /** Prescribed displacements at restrained DOFs (dr) */
  dr: number[];

  /** Indices of free DOFs */
  freeDOFs: number[];

  /** Indices of restrained DOFs */
  restrainedDOFs: number[];

  /** Total number of DOFs */
  totalDOFs: number;

  /** Whether settlements are present */
  hasSettlements: boolean;
}

/**
 * Partition the global system into free and restrained DOFs.
 * Handles support settlements (prescribed displacements).
 */
export function partitionSystem(
  K: Matrix,
  F: number[],
  supports: Support[],
  dofMap: DOFMap
): PartitionedSystem {
  const totalDOFs = dofMap.totalDOFs;
  const restrainedDOFs = getRestrainedDOFs(supports, dofMap);
  const freeDOFs = getFreeDOFs(totalDOFs, restrainedDOFs);

  // Check for sufficient restraints
  if (freeDOFs.length === totalDOFs) {
    throw new Error('No supports defined - structure is unrestrained');
  }

  if (restrainedDOFs.length < 3) {
    throw new Error(
      `Insufficient restraints: ${restrainedDOFs.length} DOFs restrained, minimum 3 required for 2D stability`
    );
  }

  // Extract submatrices
  const Kff = K.extractSubmatrix(freeDOFs, freeDOFs);
  const Krf = K.extractSubmatrix(restrainedDOFs, freeDOFs);
  const Kfr = K.extractSubmatrix(freeDOFs, restrainedDOFs);
  const Krr = K.extractSubmatrix(restrainedDOFs, restrainedDOFs);
  const Ff_original = extractSubvector(F, freeDOFs);

  // Extract prescribed displacements (settlements) for each restrained DOF
  const dr = extractSettlements(supports, restrainedDOFs, dofMap);

  // Check if any settlements are present
  const hasSettlements = dr.some(d => Math.abs(d) > 1e-15);

  // Compute effective load vector: Ff_eff = Ff - Kfr * dr
  let Ff: number[];
  if (hasSettlements) {
    const Kfr_dr = Kfr.multiplyVector(dr);
    Ff = Ff_original.map((f, i) => f - (Kfr_dr[i] ?? 0));
  } else {
    Ff = [...Ff_original];
  }

  return {
    Kff,
    Ff,
    Ff_original,
    Krf,
    Kfr,
    Krr,
    dr,
    freeDOFs,
    restrainedDOFs,
    totalDOFs,
    hasSettlements,
  };
}

/**
 * Extract settlement values for each restrained DOF.
 */
function extractSettlements(
  supports: Support[],
  restrainedDOFs: number[],
  dofMap: DOFMap
): number[] {
  const dr: number[] = new Array(restrainedDOFs.length).fill(0);

  // Build a map from DOF index to settlement value
  const settlementMap = new Map<number, number>();

  for (const support of supports) {
    const nodeInfo = dofMap.nodeInfo.get(support.nodeId);
    if (!nodeInfo) continue;

    const [uxIdx, uyIdx, rzIdx] = nodeInfo.globalDOFIndices;

    if (support.dx && uxIdx !== undefined && support.settlementDx !== undefined) {
      settlementMap.set(uxIdx, support.settlementDx);
    }
    if (support.dy && uyIdx !== undefined && support.settlementDy !== undefined) {
      settlementMap.set(uyIdx, support.settlementDy);
    }
    if (support.rz && rzIdx !== undefined && nodeInfo.hasRotationDOF && support.settlementRz !== undefined) {
      settlementMap.set(rzIdx, support.settlementRz);
    }
  }

  // Populate dr vector in the order of restrainedDOFs
  for (let i = 0; i < restrainedDOFs.length; i++) {
    const dofIdx = restrainedDOFs[i];
    if (dofIdx !== undefined && settlementMap.has(dofIdx)) {
      dr[i] = settlementMap.get(dofIdx)!;
    }
  }

  return dr;
}

/**
 * Expand the solution from free DOFs back to full DOF vector.
 *
 * @param df - Displacements at free DOFs
 * @param partition - Partition information
 * @returns Full displacement vector (restrained DOFs = dr for settlements, 0 otherwise)
 */
export function expandSolution(
  df: number[],
  partition: PartitionedSystem
): number[] {
  // Start with free DOFs expanded
  const d = expandVector(df, partition.freeDOFs, partition.totalDOFs);

  // Set restrained DOFs to their prescribed values (settlements)
  for (let i = 0; i < partition.restrainedDOFs.length; i++) {
    const dofIdx = partition.restrainedDOFs[i];
    if (dofIdx !== undefined) {
      d[dofIdx] = partition.dr[i] ?? 0;
    }
  }

  return d;
}

/**
 * Calculate reactions from solved displacements.
 *
 * For no settlements (dr = 0): Fr = Krf * df
 * For settlements: Fr = Krf * df + Krr * dr
 *
 * Note: These are the reaction forces at support locations.
 * Signs follow the global coordinate system.
 */
export function calculateReactions(
  df: number[],
  partition: PartitionedSystem,
  F: number[]
): number[] {
  // Fr = Krf * df
  const Fr_from_df = partition.Krf.multiplyVector(df);

  // Add settlement contribution: Krr * dr
  let Fr: number[];
  if (partition.hasSettlements) {
    const Fr_from_dr = partition.Krr.multiplyVector(partition.dr);
    Fr = Fr_from_df.map((f, i) => f + (Fr_from_dr[i] ?? 0));
  } else {
    Fr = Fr_from_df;
  }

  // Reactions are Fr minus the applied loads at restrained DOFs
  // (Usually there are no applied loads at supports, so Fr is the reaction)
  const reactions: number[] = [];

  for (let i = 0; i < partition.restrainedDOFs.length; i++) {
    const restrainedIdx = partition.restrainedDOFs[i];
    const fr_i = Fr[i] ?? 0;
    const f_applied = restrainedIdx !== undefined ? (F[restrainedIdx] ?? 0) : 0;
    // Reaction = internal force - applied load (if any)
    reactions.push(fr_i - f_applied);
  }

  return reactions;
}

/**
 * Expand reactions to a full-length vector (zeros at free DOFs).
 */
export function expandReactions(
  reactions: number[],
  partition: PartitionedSystem
): number[] {
  return expandVector(reactions, partition.restrainedDOFs, partition.totalDOFs);
}
