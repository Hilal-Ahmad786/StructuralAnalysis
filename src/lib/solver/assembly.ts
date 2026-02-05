/**
 * Global Assembly
 * 
 * Assembles the global stiffness matrix K and load vector F
 * from element contributions.
 */

import { Matrix } from '../math/matrix';
import { trussGlobalStiffnessDirect } from './elements/truss';
import { frameGlobalStiffness, frameGlobalGeometricStiffness } from './elements/frame';
import {
  udlFixedEndForces,
  trapezoidalFixedEndForces,
  pointLoadFixedEndForces,
  temperatureFixedEndForces,
  convertLoadToLocalW,
  transformFEFToGlobal,
  type LoadDirection
} from './loads/fixedEndForces';
import { 
  getMemberLength, 
  getMemberAngle, 
  getMemberMaterial, 
  getMemberSection 
} from './geometry';
import { getElementDOFs } from './dofMap';
import type { DOFMap } from './dofMap';
import type { StructuralModel, LoadCase, Load } from '@/types';

/**
 * Assemble the global stiffness matrix.
 */
export function assembleStiffnessMatrix(
  model: StructuralModel,
  dofMap: DOFMap
): Matrix {
  const n = dofMap.totalDOFs;
  const K = Matrix.zeros(n, n);

  for (const member of model.members) {
    // Get member properties
    const { E } = getMemberMaterial(member, model);
    const { A, I } = getMemberSection(member, model);
    const L = getMemberLength(member, model.nodes);
    const angle = getMemberAngle(member, model.nodes);

    // Get element DOF indices
    const elementDOFs = getElementDOFs(member, dofMap);

    // Compute element stiffness matrix
    let k_element: Matrix;
    
    if (member.type === 'truss') {
      k_element = trussGlobalStiffnessDirect(E, A, L, angle);
    } else {
      k_element = frameGlobalStiffness(E, A, I, L, angle);
    }

    // Assemble into global K
    const numDOFs = elementDOFs.length;
    for (let i = 0; i < numDOFs; i++) {
      for (let j = 0; j < numDOFs; j++) {
        const gi = elementDOFs[i];
        const gj = elementDOFs[j];
        if (gi !== undefined && gj !== undefined) {
          K.add(gi, gj, k_element.get(i, j));
        }
      }
    }
  }

  return K;
}

/**
 * Assemble the global load vector.
 */
export function assembleLoadVector(
  model: StructuralModel,
  loadCase: LoadCase,
  dofMap: DOFMap
): number[] {
  const n = dofMap.totalDOFs;
  const F = new Array<number>(n).fill(0);

  for (const load of loadCase.loads) {
    if (load.target === 'node') {
      assembleNodalLoad(load, dofMap, F);
    } else if (load.target === 'member') {
      if (load.type === 'point') {
        // Point load on member
        assembleMemberPointLoad(load, model, dofMap, F);
      } else if (load.type === 'temperature') {
        // Temperature load on member
        assembleMemberTemperatureLoad(load, model, dofMap, F);
      } else {
        // Distributed load on member
        assembleMemberLoad(load, model, dofMap, F);
      }
    }
  }

  return F;
}

/**
 * Assemble a nodal load into the global force vector.
 */
function assembleNodalLoad(
  load: Load,
  dofMap: DOFMap,
  F: number[]
): void {
  const nodeInfo = dofMap.nodeInfo.get(load.targetId);
  if (!nodeInfo) {
    throw new Error(`Load target node ${load.targetId} not found in DOF map`);
  }

  const [uxIdx, uyIdx, rzIdx] = nodeInfo.globalDOFIndices;

  // Add force components
  if (load.fx !== undefined && uxIdx !== undefined) {
    F[uxIdx] = (F[uxIdx] ?? 0) + load.fx;
  }
  if (load.fy !== undefined && uyIdx !== undefined) {
    F[uyIdx] = (F[uyIdx] ?? 0) + load.fy;
  }
  if (load.mz !== undefined && rzIdx !== undefined && nodeInfo.hasRotationDOF) {
    F[rzIdx] = (F[rzIdx] ?? 0) + load.mz;
  }
}

/**
 * Assemble a member load (distributed) into the global force vector.
 * Supports both uniform (UDL) and trapezoidal loads.
 */
function assembleMemberLoad(
  load: Load,
  model: StructuralModel,
  dofMap: DOFMap,
  F: number[]
): void {
  const member = model.members.find(m => m.id === load.targetId);
  if (!member) {
    throw new Error(`Load target member ${load.targetId} not found`);
  }

  // Only frame elements can have distributed loads
  if (member.type !== 'frame') {
    throw new Error(
      `Distributed loads not supported on truss members (member ${member.id})`
    );
  }

  // Get member properties
  const L = getMemberLength(member, model.nodes);
  const angle = getMemberAngle(member, model.nodes);
  const direction = (load.direction ?? 'globalNegY') as LoadDirection;

  let fef_local: number[];

  // Check if this is a trapezoidal load (wStart and wEnd both defined)
  if (load.wStart !== undefined && load.wEnd !== undefined) {
    // Trapezoidal load
    const w1_local = convertLoadToLocalW(load.wStart, direction, angle);
    const w2_local = convertLoadToLocalW(load.wEnd, direction, angle);
    fef_local = trapezoidalFixedEndForces(w1_local, w2_local, L);
  } else {
    // Uniform distributed load (UDL)
    const magnitude = load.w ?? 0;
    const w_local = convertLoadToLocalW(magnitude, direction, angle);
    fef_local = udlFixedEndForces(w_local, L);
  }

  const fef_global = transformFEFToGlobal(fef_local, angle);

  // Equivalent nodal loads = -FEF
  // These go into the global force vector
  const equivalentLoads = fef_global.map(f => -f);

  // Get element DOF indices
  const elementDOFs = getElementDOFs(member, dofMap);

  // Assemble into F
  for (let i = 0; i < elementDOFs.length; i++) {
    const gi = elementDOFs[i];
    const loadVal = equivalentLoads[i];
    if (gi !== undefined && loadVal !== undefined) {
      F[gi] = (F[gi] ?? 0) + loadVal;
    }
  }
}

/**
 * Assemble a point load on a member into the global force vector.
 * The point load is specified at a position along the member (0 = start, 1 = end).
 */
function assembleMemberPointLoad(
  load: Load,
  model: StructuralModel,
  dofMap: DOFMap,
  F: number[]
): void {
  const member = model.members.find(m => m.id === load.targetId);
  if (!member) {
    throw new Error(`Load target member ${load.targetId} not found`);
  }

  // Only frame elements can have point loads on members
  if (member.type !== 'frame') {
    throw new Error(
      `Point loads on members not supported for truss members (member ${member.id})`
    );
  }

  // Get member properties
  const L = getMemberLength(member, model.nodes);
  const angle = getMemberAngle(member, model.nodes);

  // Position along member (0 to 1)
  const position = load.position ?? 0.5;
  const a = position * L; // Distance from start node

  // Get load magnitude in local coordinates
  // For point loads on members, fy is the transverse load (perpendicular to member)
  // and fx is the axial load (along member)
  const direction = (load.direction ?? 'globalNegY') as LoadDirection;

  // Convert point load to local coordinates
  // P is the transverse load magnitude in local +y direction
  const P = convertLoadToLocalW(load.fy ?? 0, direction, angle);

  // Compute fixed-end forces for point load
  const fef_local = pointLoadFixedEndForces(P, a, L);
  const fef_global = transformFEFToGlobal(fef_local, angle);

  // Equivalent nodal loads = -FEF
  const equivalentLoads = fef_global.map(f => -f);

  // Get element DOF indices
  const elementDOFs = getElementDOFs(member, dofMap);

  // Assemble into F
  for (let i = 0; i < elementDOFs.length; i++) {
    const gi = elementDOFs[i];
    const loadVal = equivalentLoads[i];
    if (gi !== undefined && loadVal !== undefined) {
      F[gi] = (F[gi] ?? 0) + loadVal;
    }
  }
}

/**
 * Assemble a temperature load on a member into the global force vector.
 */
function assembleMemberTemperatureLoad(
  load: Load,
  model: StructuralModel,
  dofMap: DOFMap,
  F: number[]
): void {
  const member = model.members.find(m => m.id === load.targetId);
  if (!member) {
    throw new Error(`Load target member ${load.targetId} not found`);
  }

  // Only frame elements can have temperature loads
  if (member.type !== 'frame') {
    throw new Error(
      `Temperature loads not supported on truss members (member ${member.id})`
    );
  }

  // Get member properties
  const { E } = getMemberMaterial(member, model);
  const material = model.materials.find(m => m.id === member.materialId);
  const alpha = material?.alpha ?? 0;

  const { A, I } = getMemberSection(member, model);
  const section = model.sections.find(s => s.id === member.sectionId);
  const h = section?.h ?? 0;

  const L = getMemberLength(member, model.nodes);
  const angle = getMemberAngle(member, model.nodes);

  // Get temperature changes
  const deltaT = load.deltaT ?? 0;
  const gradT = load.gradT ?? 0;

  // Skip if no temperature effect
  if (Math.abs(deltaT) < 1e-10 && Math.abs(gradT) < 1e-10) return;

  // Check if we have the required material/section properties
  if (Math.abs(alpha) < 1e-15) {
    console.warn(`Temperature load on member ${member.id}: material has no thermal expansion coefficient (alpha)`);
    return;
  }
  if (Math.abs(gradT) > 1e-10 && h <= 0) {
    console.warn(`Temperature gradient on member ${member.id}: section has no depth (h) defined`);
  }

  // Compute fixed-end forces for temperature load
  const fef_local = temperatureFixedEndForces(E, A, I, alpha, deltaT, gradT, h);
  const fef_global = transformFEFToGlobal(fef_local, angle);

  // Equivalent nodal loads = -FEF
  const equivalentLoads = fef_global.map(f => -f);

  // Get element DOF indices
  const elementDOFs = getElementDOFs(member, dofMap);

  // Assemble into F
  for (let i = 0; i < elementDOFs.length; i++) {
    const gi = elementDOFs[i];
    const loadVal = equivalentLoads[i];
    if (gi !== undefined && loadVal !== undefined) {
      F[gi] = (F[gi] ?? 0) + loadVal;
    }
  }
}

/**
 * Result of global assembly.
 */
export interface AssemblyResult {
  K: Matrix;
  F: number[];
}

/**
 * Assemble both global stiffness matrix and load vector.
 */
export function assembleSystem(
  model: StructuralModel,
  loadCase: LoadCase,
  dofMap: DOFMap
): AssemblyResult {
  const K = assembleStiffnessMatrix(model, dofMap);
  const F = assembleLoadVector(model, loadCase, dofMap);
  return { K, F };
}

/**
 * Assemble the global geometric stiffness matrix for P-Delta analysis.
 *
 * The geometric stiffness matrix accounts for the second-order effects
 * of axial forces on the structure's stiffness.
 *
 * @param model - Structural model
 * @param memberAxialForces - Map of member ID to axial force (kN), positive = tension
 * @param dofMap - DOF mapping
 * @returns Global geometric stiffness matrix Kg
 */
export function assembleGeometricStiffnessMatrix(
  model: StructuralModel,
  memberAxialForces: Map<string, number>,
  dofMap: DOFMap
): Matrix {
  const n = dofMap.totalDOFs;
  const Kg = Matrix.zeros(n, n);

  for (const member of model.members) {
    // Only frame elements have geometric stiffness
    // (truss elements don't have transverse DOFs affected by P-Delta)
    if (member.type !== 'frame') continue;

    // Get member properties
    const L = getMemberLength(member, model.nodes);
    const angle = getMemberAngle(member, model.nodes);

    // Get axial force from previous analysis
    const N = memberAxialForces.get(member.id) ?? 0;

    // Skip if axial force is negligible
    if (Math.abs(N) < 1e-10) continue;

    // Compute element geometric stiffness matrix
    const kg_element = frameGlobalGeometricStiffness(N, L, angle);

    // Get element DOF indices
    const elementDOFs = getElementDOFs(member, dofMap);

    // Assemble into global Kg
    const numDOFs = elementDOFs.length;
    for (let i = 0; i < numDOFs; i++) {
      for (let j = 0; j < numDOFs; j++) {
        const gi = elementDOFs[i];
        const gj = elementDOFs[j];
        if (gi !== undefined && gj !== undefined) {
          Kg.add(gi, gj, kg_element.get(i, j));
        }
      }
    }
  }

  return Kg;
}
