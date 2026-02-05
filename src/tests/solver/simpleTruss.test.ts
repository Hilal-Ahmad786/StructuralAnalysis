/**
 * Test: Simple Truss (Warren Truss Pattern)
 * 
 * This is benchmark test #4 from the spec.
 * 
 * Setup: Simple 3-member truss forming a triangle
 * 
 *         N3
 *        /  \
 *       /    \
 *      /      \
 *     N1------N2
 *     △        ○→
 *   (pin)   (roller)
 * 
 * - N1 at (0, 0), N2 at (4, 0), N3 at (2, 2)
 * - All members are truss type
 * - E = 200 GPa, A = 0.001 m²
 * - Load: 10 kN downward at N3
 * 
 * Expected: All internal forces are axial only (V≈0, M≈0)
 */

import { describe, it, expect } from 'vitest';
import { solve } from '@/lib/solver';
import type { StructuralModel, LoadCase } from '@/types';

function createSimpleTrussModel(): { model: StructuralModel; loadCase: LoadCase } {
  const E = 200_000_000; // kPa (200 GPa)
  const A = 0.001; // m²
  const I = 1e-6; // m⁴ (not used for truss, but required)

  const model: StructuralModel = {
    nodes: [
      { id: 'N0001', x: 0, y: 0 },   // Left support
      { id: 'N0002', x: 4, y: 0 },   // Right support
      { id: 'N0003', x: 2, y: 2 },   // Top node (loaded)
    ],
    members: [
      {
        id: 'M0001',
        type: 'truss',
        startNodeId: 'N0001',
        endNodeId: 'N0002',
        materialId: 'mat1',
        sectionId: 'sec1',
      },
      {
        id: 'M0002',
        type: 'truss',
        startNodeId: 'N0001',
        endNodeId: 'N0003',
        materialId: 'mat1',
        sectionId: 'sec1',
      },
      {
        id: 'M0003',
        type: 'truss',
        startNodeId: 'N0002',
        endNodeId: 'N0003',
        materialId: 'mat1',
        sectionId: 'sec1',
      },
    ],
    materials: [
      { id: 'mat1', name: 'Steel', E },
    ],
    sections: [
      { id: 'sec1', name: 'Truss Section', A, I },
    ],
    supports: [
      { nodeId: 'N0001', dx: true, dy: true, rz: false }, // Pinned
      { nodeId: 'N0002', dx: false, dy: true, rz: false }, // Roller Y
    ],
  };

  const loadCase: LoadCase = {
    id: 'LC1',
    name: 'Point Load',
    type: 'dead',
    loads: [
      {
        id: 'L1',
        type: 'point',
        target: 'node',
        targetId: 'N0003',
        fx: 0,
        fy: -10, // 10 kN downward
        mz: 0,
      },
    ],
  };

  return { model, loadCase };
}

describe('Simple Truss', () => {
  const { model, loadCase } = createSimpleTrussModel();
  const result = solve(model, loadCase);

  it('solves successfully', () => {
    expect(result.success).toBe(true);
  });

  it('computes correct vertical reactions', () => {
    if (!result.success) throw new Error('Solve failed');
    
    const { reactions } = result.results;
    
    // By symmetry, each support takes half the load
    const r1 = reactions.find(r => r.nodeId === 'N0001');
    const r2 = reactions.find(r => r.nodeId === 'N0002');
    
    expect(r1).toBeDefined();
    expect(r2).toBeDefined();
    
    // Each reaction should be 5 kN upward
    expect(Math.abs(r1!.fy - 5)).toBeLessThan(0.01);
    expect(Math.abs(r2!.fy - 5)).toBeLessThan(0.01);
    
    // Sum should equal applied load
    expect(Math.abs(r1!.fy + r2!.fy - 10)).toBeLessThan(0.01);
  });

  it('computes only axial forces (no shear/moment)', () => {
    if (!result.success) throw new Error('Solve failed');
    
    for (const memberResult of result.results.memberResults) {
      const { diagrams } = memberResult;
      
      // Truss elements should have zero shear and moment
      expect(diagrams.shear.length).toBe(0);
      expect(diagrams.moment.length).toBe(0);
      
      // But should have axial force
      expect(diagrams.axial.length).toBeGreaterThan(0);
    }
  });

  it('has symmetric axial forces in diagonal members', () => {
    if (!result.success) throw new Error('Solve failed');
    
    const leftDiagonal = result.results.memberResults.find(m => m.memberId === 'M0002');
    const rightDiagonal = result.results.memberResults.find(m => m.memberId === 'M0003');
    
    expect(leftDiagonal).toBeDefined();
    expect(rightDiagonal).toBeDefined();
    
    // Get axial forces (should be constant along truss member)
    const leftAxial = leftDiagonal!.diagrams.axial[0]?.value ?? 0;
    const rightAxial = rightDiagonal!.diagrams.axial[0]?.value ?? 0;
    
    // By symmetry, diagonal forces should have same magnitude
    expect(Math.abs(Math.abs(leftAxial) - Math.abs(rightAxial))).toBeLessThan(0.1);
  });

  it('produces finite displacements', () => {
    if (!result.success) throw new Error('Solve failed');
    
    for (const nd of result.results.nodeDisplacements) {
      expect(Number.isFinite(nd.dx)).toBe(true);
      expect(Number.isFinite(nd.dy)).toBe(true);
    }
    
    // Top node should deflect downward
    const topNode = result.results.nodeDisplacements.find(n => n.nodeId === 'N0003');
    expect(topNode).toBeDefined();
    expect(topNode!.dy).toBeLessThan(0);
  });

  it('has zero horizontal displacement at pin support', () => {
    if (!result.success) throw new Error('Solve failed');
    
    const pinSupport = result.results.nodeDisplacements.find(n => n.nodeId === 'N0001');
    expect(pinSupport).toBeDefined();
    expect(Math.abs(pinSupport!.dx)).toBeLessThan(1e-10);
  });

  it('satisfies equilibrium', () => {
    if (!result.success) throw new Error('Solve failed');
    
    const { reactions } = result.results;
    
    // Sum of reactions in Y direction
    const sumRy = reactions.reduce((sum, r) => sum + r.fy, 0);
    const sumRx = reactions.reduce((sum, r) => sum + r.fx, 0);
    
    // Should equal applied loads (10 kN down, 0 horizontal)
    expect(Math.abs(sumRy - 10)).toBeLessThan(0.01);
    expect(Math.abs(sumRx)).toBeLessThan(0.01);
  });
});
