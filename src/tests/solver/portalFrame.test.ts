/**
 * Test: Portal Frame with Lateral Load
 * 
 * This is benchmark test #3 from the spec.
 * 
 * Setup:
 *       P →  ●───────────●
 *           │           │
 *           │           │  H = 4m
 *           │           │
 *          ═●═         ═●═
 *           1           2
 *              L = 6m
 * 
 * - 4 nodes, 3 frame members
 * - Both bases fixed
 * - Lateral load P = 50 kN at top left
 * 
 * Expected behavior:
 * - Sway to the right
 * - Maximum moments at column bases
 * - Anti-symmetric moment pattern
 */

import { describe, it, expect } from 'vitest';
import { solve } from '@/lib/solver';
import type { StructuralModel, LoadCase } from '@/types';

function createPortalFrameModel(): { model: StructuralModel; loadCase: LoadCase } {
  const L = 6; // beam span (meters)
  const H = 4; // column height (meters)
  const E = 210_000_000; // kPa (210 GPa)
  const A = 0.01; // m²
  const I = 1e-4; // m⁴
  const P = 50; // kN lateral load

  const model: StructuralModel = {
    nodes: [
      { id: 'N0001', x: 0, y: 0 },      // Base left
      { id: 'N0002', x: L, y: 0 },      // Base right
      { id: 'N0003', x: 0, y: H },      // Top left
      { id: 'N0004', x: L, y: H },      // Top right
    ],
    members: [
      {
        id: 'M0001',
        type: 'frame',
        startNodeId: 'N0001',
        endNodeId: 'N0003', // Left column
        materialId: 'mat1',
        sectionId: 'sec1',
      },
      {
        id: 'M0002',
        type: 'frame',
        startNodeId: 'N0002',
        endNodeId: 'N0004', // Right column
        materialId: 'mat1',
        sectionId: 'sec1',
      },
      {
        id: 'M0003',
        type: 'frame',
        startNodeId: 'N0003',
        endNodeId: 'N0004', // Beam
        materialId: 'mat1',
        sectionId: 'sec1',
      },
    ],
    materials: [
      { id: 'mat1', name: 'Steel', E },
    ],
    sections: [
      { id: 'sec1', name: 'Test Section', A, I },
    ],
    supports: [
      { nodeId: 'N0001', dx: true, dy: true, rz: true }, // Fixed
      { nodeId: 'N0002', dx: true, dy: true, rz: true }, // Fixed
    ],
  };

  const loadCase: LoadCase = {
    id: 'LC1',
    name: 'Lateral Load',
    type: 'wind',
    loads: [
      {
        id: 'L1',
        type: 'point',
        target: 'node',
        targetId: 'N0003', // Top left
        fx: P, // 50 kN to the right
        fy: 0,
        mz: 0,
      },
    ],
  };

  return { model, loadCase };
}

describe('Portal Frame with Lateral Load', () => {
  const { model, loadCase } = createPortalFrameModel();
  const result = solve(model, loadCase);

  const P = 50; // kN

  it('solves successfully', () => {
    expect(result.success).toBe(true);
  });

  it('sways to the right', () => {
    if (!result.success) throw new Error('Solve failed');
    
    // Top nodes should move in +X direction
    const topLeft = result.results.nodeDisplacements.find(d => d.nodeId === 'N0003');
    const topRight = result.results.nodeDisplacements.find(d => d.nodeId === 'N0004');
    
    expect(topLeft).toBeDefined();
    expect(topRight).toBeDefined();
    
    expect(topLeft!.dx).toBeGreaterThan(0);
    expect(topRight!.dx).toBeGreaterThan(0);
    
    // Both top nodes should have similar horizontal displacement (rigid beam assumption)
    expect(Math.abs(topLeft!.dx - topRight!.dx) / topLeft!.dx).toBeLessThan(0.1);
  });

  it('has fixed base displacements at zero', () => {
    if (!result.success) throw new Error('Solve failed');
    
    const baseLeft = result.results.nodeDisplacements.find(d => d.nodeId === 'N0001');
    const baseRight = result.results.nodeDisplacements.find(d => d.nodeId === 'N0002');
    
    expect(baseLeft).toBeDefined();
    expect(baseRight).toBeDefined();
    
    expect(Math.abs(baseLeft!.dx)).toBeLessThan(1e-10);
    expect(Math.abs(baseLeft!.dy)).toBeLessThan(1e-10);
    expect(Math.abs(baseLeft!.rz)).toBeLessThan(1e-10);
    
    expect(Math.abs(baseRight!.dx)).toBeLessThan(1e-10);
    expect(Math.abs(baseRight!.dy)).toBeLessThan(1e-10);
    expect(Math.abs(baseRight!.rz)).toBeLessThan(1e-10);
  });

  it('satisfies horizontal equilibrium', () => {
    if (!result.success) throw new Error('Solve failed');
    
    const reactions = result.results.reactions;
    
    // Sum of horizontal reactions should equal applied load
    const totalRx = reactions.reduce((sum, r) => sum + r.fx, 0);
    
    // Total reaction should equal -P (opposite to applied load)
    expect(Math.abs(totalRx + P)).toBeLessThan(0.1);
  });

  it('satisfies vertical equilibrium', () => {
    if (!result.success) throw new Error('Solve failed');
    
    const reactions = result.results.reactions;
    
    // No vertical load, so sum of vertical reactions should be zero
    const totalRy = reactions.reduce((sum, r) => sum + r.fy, 0);
    expect(Math.abs(totalRy)).toBeLessThan(0.1);
  });

  it('has moment at bases', () => {
    if (!result.success) throw new Error('Solve failed');
    
    const reactions = result.results.reactions;
    
    // Fixed bases should have moment reactions
    const r1 = reactions.find(r => r.nodeId === 'N0001');
    const r2 = reactions.find(r => r.nodeId === 'N0002');
    
    expect(r1).toBeDefined();
    expect(r2).toBeDefined();
    
    // Both bases should have non-zero moments
    expect(Math.abs(r1!.mz)).toBeGreaterThan(1);
    expect(Math.abs(r2!.mz)).toBeGreaterThan(1);
  });

  it('produces finite results throughout', () => {
    if (!result.success) throw new Error('Solve failed');
    
    // Check all displacements
    for (const nd of result.results.nodeDisplacements) {
      expect(Number.isFinite(nd.dx)).toBe(true);
      expect(Number.isFinite(nd.dy)).toBe(true);
      expect(Number.isFinite(nd.rz)).toBe(true);
    }
    
    // Check all member results
    for (const mr of result.results.memberResults) {
      for (const point of mr.diagrams.moment) {
        expect(Number.isFinite(point.value)).toBe(true);
      }
      for (const point of mr.diagrams.shear) {
        expect(Number.isFinite(point.value)).toBe(true);
      }
    }
  });
});
