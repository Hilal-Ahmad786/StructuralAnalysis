/**
 * Test: Simple Truss (Warren Pattern)
 * 
 * This is benchmark test #4 from the spec.
 * 
 * Setup:
 *           ●───────●───────●
 *          /\       /\       /\
 *         /  \     /  \     /  \
 *        /    \   /    \   /    \
 *       ●──────●───────●──────●
 *       1      2       3       4
 *       △                      ○
 *       ↑ -P              
 * 
 * - 7 nodes, 11 truss members
 * - Node 1: pinned, Node 4: roller
 * - Load P = 100 kN downward at node 2
 * 
 * Expected:
 * - Only axial forces (no shear, no moment)
 * - Tension in bottom chord
 * - Compression in top chord
 */

import { describe, it, expect } from 'vitest';
import { solve } from '@/lib/solver';
import type { StructuralModel, LoadCase } from '@/types';

function createSimpleTrussModel(): { model: StructuralModel; loadCase: LoadCase } {
  const span = 6; // Total span (meters)
  const height = 2; // Truss height (meters)
  const E = 210_000_000; // kPa (210 GPa)
  const A = 0.005; // m² (50 cm²)
  const I = 1e-6; // m⁴ (not used for truss but needed)

  // Simple 3-panel Warren truss
  //     N5────N6────N7
  //    / \   / \   / \
  //   /   \ /   \ /   \
  //  N1────N2────N3────N4

  const model: StructuralModel = {
    nodes: [
      { id: 'N0001', x: 0, y: 0 },           // Bottom left
      { id: 'N0002', x: span / 3, y: 0 },    // Bottom 1/3
      { id: 'N0003', x: 2 * span / 3, y: 0 }, // Bottom 2/3
      { id: 'N0004', x: span, y: 0 },        // Bottom right
      { id: 'N0005', x: span / 6, y: height },    // Top left
      { id: 'N0006', x: span / 2, y: height },    // Top middle
      { id: 'N0007', x: 5 * span / 6, y: height }, // Top right
    ],
    members: [
      // Bottom chord
      { id: 'M01', type: 'truss', startNodeId: 'N0001', endNodeId: 'N0002', materialId: 'mat1', sectionId: 'sec1' },
      { id: 'M02', type: 'truss', startNodeId: 'N0002', endNodeId: 'N0003', materialId: 'mat1', sectionId: 'sec1' },
      { id: 'M03', type: 'truss', startNodeId: 'N0003', endNodeId: 'N0004', materialId: 'mat1', sectionId: 'sec1' },
      // Top chord
      { id: 'M04', type: 'truss', startNodeId: 'N0005', endNodeId: 'N0006', materialId: 'mat1', sectionId: 'sec1' },
      { id: 'M05', type: 'truss', startNodeId: 'N0006', endNodeId: 'N0007', materialId: 'mat1', sectionId: 'sec1' },
      // Diagonals and verticals
      { id: 'M06', type: 'truss', startNodeId: 'N0001', endNodeId: 'N0005', materialId: 'mat1', sectionId: 'sec1' },
      { id: 'M07', type: 'truss', startNodeId: 'N0002', endNodeId: 'N0005', materialId: 'mat1', sectionId: 'sec1' },
      { id: 'M08', type: 'truss', startNodeId: 'N0002', endNodeId: 'N0006', materialId: 'mat1', sectionId: 'sec1' },
      { id: 'M09', type: 'truss', startNodeId: 'N0003', endNodeId: 'N0006', materialId: 'mat1', sectionId: 'sec1' },
      { id: 'M10', type: 'truss', startNodeId: 'N0003', endNodeId: 'N0007', materialId: 'mat1', sectionId: 'sec1' },
      { id: 'M11', type: 'truss', startNodeId: 'N0004', endNodeId: 'N0007', materialId: 'mat1', sectionId: 'sec1' },
    ],
    materials: [
      { id: 'mat1', name: 'Steel', E },
    ],
    sections: [
      { id: 'sec1', name: 'Truss Section', A, I },
    ],
    supports: [
      { nodeId: 'N0001', dx: true, dy: true, rz: false }, // Pinned
      { nodeId: 'N0004', dx: false, dy: true, rz: false }, // Roller Y
    ],
  };

  const P = 100; // kN

  const loadCase: LoadCase = {
    id: 'LC1',
    name: 'Point Load',
    type: 'dead',
    loads: [
      {
        id: 'L1',
        type: 'point',
        target: 'node',
        targetId: 'N0006', // Top middle node
        fx: 0,
        fy: -P, // 100 kN downward
        mz: 0,
      },
    ],
  };

  return { model, loadCase };
}

describe('Simple Truss with Point Load', () => {
  const { model, loadCase } = createSimpleTrussModel();
  const result = solve(model, loadCase);

  const P = 100; // kN

  it('solves successfully', () => {
    expect(result.success).toBe(true);
  });

  it('has only axial forces (no shear diagrams)', () => {
    if (!result.success) throw new Error('Solve failed');
    
    for (const mr of result.results.memberResults) {
      // Truss members should have empty or negligible shear/moment
      // (Some implementations return empty arrays, others return near-zero)
      if (mr.diagrams.shear.length > 0) {
        for (const point of mr.diagrams.shear) {
          expect(Math.abs(point.value)).toBeLessThan(1e-6);
        }
      }
      if (mr.diagrams.moment.length > 0) {
        for (const point of mr.diagrams.moment) {
          expect(Math.abs(point.value)).toBeLessThan(1e-6);
        }
      }
    }
  });

  it('has non-zero axial forces', () => {
    if (!result.success) throw new Error('Solve failed');
    
    // At least some members should have axial force
    let hasNonZeroAxial = false;
    for (const mr of result.results.memberResults) {
      if (mr.diagrams.axial.length > 0) {
        for (const point of mr.diagrams.axial) {
          if (Math.abs(point.value) > 0.1) {
            hasNonZeroAxial = true;
            break;
          }
        }
      }
    }
    expect(hasNonZeroAxial).toBe(true);
  });

  it('satisfies vertical equilibrium', () => {
    if (!result.success) throw new Error('Solve failed');
    
    const reactions = result.results.reactions;
    
    // Sum of vertical reactions should equal applied load
    const totalRy = reactions.reduce((sum, r) => sum + r.fy, 0);
    expect(Math.abs(totalRy - P)).toBeLessThan(0.1);
  });

  it('has symmetric reactions for symmetric loading', () => {
    if (!result.success) throw new Error('Solve failed');
    
    const r1 = result.results.reactions.find(r => r.nodeId === 'N0001');
    const r4 = result.results.reactions.find(r => r.nodeId === 'N0004');
    
    expect(r1).toBeDefined();
    expect(r4).toBeDefined();
    
    // For symmetric truss with central load, reactions should be equal
    expect(Math.abs(r1!.fy - r4!.fy)).toBeLessThan(0.1);
    
    // Each reaction should be P/2 = 50 kN
    expect(Math.abs(r1!.fy - P / 2)).toBeLessThan(0.1);
  });

  it('produces finite results', () => {
    if (!result.success) throw new Error('Solve failed');
    
    for (const nd of result.results.nodeDisplacements) {
      expect(Number.isFinite(nd.dx)).toBe(true);
      expect(Number.isFinite(nd.dy)).toBe(true);
    }
    
    for (const r of result.results.reactions) {
      expect(Number.isFinite(r.fx)).toBe(true);
      expect(Number.isFinite(r.fy)).toBe(true);
    }
  });

  it('deflects downward under load', () => {
    if (!result.success) throw new Error('Solve failed');
    
    const loadedNode = result.results.nodeDisplacements.find(d => d.nodeId === 'N0006');
    expect(loadedNode).toBeDefined();
    
    // Should deflect downward
    expect(loadedNode!.dy).toBeLessThan(0);
  });
});
