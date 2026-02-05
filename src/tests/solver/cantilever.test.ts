/**
 * Test: Cantilever Beam with Point Load
 * 
 * This is benchmark test #2 from the spec.
 * 
 * Setup:
 * - 2 nodes, 1 frame member, length L = 4 m
 * - Section: I = 1e-4 m⁴, A = 0.01 m²
 * - Material: E = 200 GPa = 200,000,000 kPa
 * - Supports: Node 1 fixed (dx, dy, rz)
 * - Load: Point load P = 20 kN downward at free end
 * 
 * Expected results:
 * - Tip deflection: δ = PL³/(3EI)
 * - Max moment: M = PL at fixed end
 * - Reaction: R = P, M_reaction = PL
 */

import { describe, it, expect } from 'vitest';
import { solve } from '@/lib/solver';
import { isNumericallyEqual } from '@/lib/solver/tolerances';
import type { StructuralModel, LoadCase } from '@/types';

function createCantileverModel(): { model: StructuralModel; loadCase: LoadCase } {
  const L = 4; // meters
  const E = 200_000_000; // kPa (200 GPa)
  const A = 0.01; // m²
  const I = 1e-4; // m⁴
  const P = 20; // kN

  const model: StructuralModel = {
    nodes: [
      { id: 'N0001', x: 0, y: 0 },
      { id: 'N0002', x: L, y: 0 },
    ],
    members: [
      {
        id: 'M0001',
        type: 'frame',
        startNodeId: 'N0001',
        endNodeId: 'N0002',
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
        targetId: 'N0002',
        fx: 0,
        fy: -P, // 20 kN downward
        mz: 0,
      },
    ],
  };

  return { model, loadCase };
}

describe('Cantilever Beam with Point Load', () => {
  const { model, loadCase } = createCantileverModel();
  const result = solve(model, loadCase);

  const L = 4;
  const E = 200_000_000;
  const I = 1e-4;
  const P = 20;

  it('solves successfully', () => {
    expect(result.success).toBe(true);
  });

  it('computes correct tip deflection', () => {
    if (!result.success) throw new Error('Solve failed');
    
    const tipDisp = result.results.nodeDisplacements.find(d => d.nodeId === 'N0002');
    expect(tipDisp).toBeDefined();
    
    // Expected: δ = PL³/(3EI) = 20 * 64 / (3 * 200e6 * 1e-4) = 1280 / 60000 = 0.02133 m
    const expectedDeflection = (P * Math.pow(L, 3)) / (3 * E * I);
    
    // Tip should deflect downward (negative dy)
    expect(tipDisp!.dy).toBeLessThan(0);
    
    // Check magnitude within 1% tolerance
    const actualDeflection = Math.abs(tipDisp!.dy);
    expect(Math.abs(actualDeflection - expectedDeflection) / expectedDeflection).toBeLessThan(0.01);
  });

  it('computes correct reactions', () => {
    if (!result.success) throw new Error('Solve failed');
    
    const reaction = result.results.reactions.find(r => r.nodeId === 'N0001');
    expect(reaction).toBeDefined();
    
    // Vertical reaction = P (upward)
    expect(isNumericallyEqual(reaction!.fy, P)).toBe(true);
    
    // Moment reaction = P * L (counter-clockwise to resist clockwise tendency)
    const expectedMoment = P * L; // 80 kN·m
    expect(Math.abs(Math.abs(reaction!.mz) - expectedMoment)).toBeLessThan(0.1);
  });

  it('has correct moment at fixed end', () => {
    if (!result.success) throw new Error('Solve failed');
    
    const memberResult = result.results.memberResults.find(m => m.memberId === 'M0001');
    expect(memberResult).toBeDefined();
    
    const { moment } = memberResult!.diagrams;
    
    // Moment at x=0 (fixed end) should be maximum
    const momentAtFixed = moment.find(p => p.x < 0.01);
    expect(momentAtFixed).toBeDefined();
    
    // Expected moment at fixed end: M = PL = 20 * 4 = 80 kN·m
    // Sign depends on convention - should be hogging (negative in our convention)
    expect(Math.abs(Math.abs(momentAtFixed!.value) - 80)).toBeLessThan(1);
  });

  it('has zero moment at free end', () => {
    if (!result.success) throw new Error('Solve failed');
    
    const memberResult = result.results.memberResults.find(m => m.memberId === 'M0001');
    expect(memberResult).toBeDefined();
    
    const { moment } = memberResult!.diagrams;
    
    // Moment at x=L (free end) should be zero
    const momentAtFree = moment.find(p => p.x > 3.99);
    expect(momentAtFree).toBeDefined();
    expect(Math.abs(momentAtFree!.value)).toBeLessThan(0.1);
  });

  it('has zero displacement at fixed support', () => {
    if (!result.success) throw new Error('Solve failed');
    
    const fixedDisp = result.results.nodeDisplacements.find(d => d.nodeId === 'N0001');
    expect(fixedDisp).toBeDefined();
    
    expect(Math.abs(fixedDisp!.dx)).toBeLessThan(1e-10);
    expect(Math.abs(fixedDisp!.dy)).toBeLessThan(1e-10);
    expect(Math.abs(fixedDisp!.rz)).toBeLessThan(1e-10);
  });

  it('produces linear moment diagram', () => {
    if (!result.success) throw new Error('Solve failed');
    
    const memberResult = result.results.memberResults.find(m => m.memberId === 'M0001');
    expect(memberResult).toBeDefined();
    
    const { moment } = memberResult!.diagrams;
    
    // For cantilever with point load at end, M(x) = P(L-x)
    // Check a few points
    for (const point of moment) {
      const expectedM = P * (L - point.x);
      // Allow some tolerance for numerical differences
      expect(Math.abs(Math.abs(point.value) - expectedM)).toBeLessThan(1);
    }
  });
});
