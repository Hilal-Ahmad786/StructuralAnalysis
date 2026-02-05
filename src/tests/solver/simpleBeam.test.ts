/**
 * Test: Simply Supported Beam with UDL
 * 
 * This is benchmark test #1 from the spec.
 * 
 * Setup:
 * - 2 nodes, 1 frame member, span L = 6 m
 * - Section: I = 8.33e-5 m⁴, A = 0.01 m²
 * - Material: E = 210 GPa = 210,000,000 kPa
 * - Supports: Node 1 pinned (dx, dy), Node 2 roller (dy)
 * - Load: UDL w = 10 kN/m downward
 * 
 * Expected results:
 * - Max moment: wL²/8 = 10 * 6² / 8 = 45 kN·m at midspan
 * - Reactions: Ra = Rb = wL/2 = 30 kN
 * - Max deflection: 5wL⁴/(384EI)
 */

import { describe, it, expect } from 'vitest';
import { solve } from '@/lib/solver';
import { isNumericallyEqual } from '@/lib/solver/tolerances';
import type { StructuralModel, LoadCase } from '@/types';

function createSimpleBeamModel(): { model: StructuralModel; loadCase: LoadCase } {
  const L = 6; // meters
  const E = 210_000_000; // kPa (210 GPa)
  const A = 0.01; // m²
  const I = 8.33e-5; // m⁴
  const w = 10; // kN/m

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
      { nodeId: 'N0001', dx: true, dy: true, rz: false }, // Pinned
      { nodeId: 'N0002', dx: false, dy: true, rz: false }, // Roller Y
    ],
  };

  const loadCase: LoadCase = {
    id: 'LC1',
    name: 'Dead Load',
    type: 'dead',
    loads: [
      {
        id: 'L1',
        type: 'distributed',
        target: 'member',
        targetId: 'M0001',
        w, // 10 kN/m
        direction: 'globalNegY', // Downward
      },
    ],
  };

  return { model, loadCase };
}

describe('Simply Supported Beam with UDL', () => {
  const { model, loadCase } = createSimpleBeamModel();
  const result = solve(model, loadCase);

  it('solves successfully', () => {
    expect(result.success).toBe(true);
  });

  it('computes correct reactions', () => {
    if (!result.success) throw new Error('Solve failed');
    
    const { reactions } = result.results;
    
    // Expected: Ra = Rb = wL/2 = 10 * 6 / 2 = 30 kN (upward)
    const r1 = reactions.find(r => r.nodeId === 'N0001');
    const r2 = reactions.find(r => r.nodeId === 'N0002');
    
    expect(r1).toBeDefined();
    expect(r2).toBeDefined();
    
    // Reactions should be positive (upward) to resist downward load
    expect(isNumericallyEqual(r1!.fy, 30)).toBe(true);
    expect(isNumericallyEqual(r2!.fy, 30)).toBe(true);
    
    // No horizontal reactions
    expect(Math.abs(r1!.fx)).toBeLessThan(1e-6);
  });

  it('computes correct midspan moment', () => {
    if (!result.success) throw new Error('Solve failed');
    
    const memberResult = result.results.memberResults.find(m => m.memberId === 'M0001');
    expect(memberResult).toBeDefined();
    
    const { moment } = memberResult!.diagrams;
    expect(moment.length).toBeGreaterThan(0);
    
    // Find moment at midspan (x ≈ 3m)
    const midspanPoint = moment.find(p => Math.abs(p.x - 3) < 0.2);
    expect(midspanPoint).toBeDefined();
    
    // Expected: M_max = wL²/8 = 10 * 36 / 8 = 45 kN·m
    // Note: Our sign convention has sagging moment as positive
    const expectedMoment = 45;
    expect(isNumericallyEqual(Math.abs(midspanPoint!.value), expectedMoment)).toBe(true);
  });

  it('satisfies equilibrium', () => {
    if (!result.success) throw new Error('Solve failed');
    
    const { reactions } = result.results;
    
    // Sum of reactions should equal total load
    const totalReactionY = reactions.reduce((sum, r) => sum + r.fy, 0);
    const totalLoad = 10 * 6; // w * L = 60 kN downward
    
    // Reaction sum should equal load magnitude (60 kN)
    expect(isNumericallyEqual(totalReactionY, totalLoad)).toBe(true);
  });

  it('produces finite results', () => {
    if (!result.success) throw new Error('Solve failed');
    
    // Check all displacements are finite
    for (const nd of result.results.nodeDisplacements) {
      expect(Number.isFinite(nd.dx)).toBe(true);
      expect(Number.isFinite(nd.dy)).toBe(true);
      expect(Number.isFinite(nd.rz)).toBe(true);
    }
    
    // Check all reactions are finite
    for (const r of result.results.reactions) {
      expect(Number.isFinite(r.fx)).toBe(true);
      expect(Number.isFinite(r.fy)).toBe(true);
      expect(Number.isFinite(r.mz)).toBe(true);
    }
  });

  it('computes reasonable deflection', () => {
    if (!result.success) throw new Error('Solve failed');
    
    const memberResult = result.results.memberResults.find(m => m.memberId === 'M0001');
    expect(memberResult).toBeDefined();
    
    const { deflection } = memberResult!.diagrams;
    
    // Find max deflection (should be at midspan, negative = downward)
    const midspanDefl = deflection.find(p => Math.abs(p.x - 3) < 0.2);
    expect(midspanDefl).toBeDefined();
    
    // Should be negative (downward) for downward load
    expect(midspanDefl!.value).toBeLessThan(0);
    
    // Expected: δ = 5wL⁴/(384EI)
    // w = 10 kN/m, L = 6 m, E = 210e6 kPa, I = 8.33e-5 m⁴
    // δ = 5 * 10 * 6^4 / (384 * 210e6 * 8.33e-5)
    // δ = 5 * 10 * 1296 / (384 * 17493) ≈ 0.00964 m ≈ 9.6 mm
    const E = 210_000_000;
    const I = 8.33e-5;
    const w = 10;
    const L = 6;
    const expectedDeflection = (5 * w * Math.pow(L, 4)) / (384 * E * I);
    
    // Allow 25% tolerance for numerical differences (Hermite interpolation vs exact)
    const tolerance = expectedDeflection * 0.25;
    expect(Math.abs(Math.abs(midspanDefl!.value) - expectedDeflection)).toBeLessThan(tolerance);
  });

  it('has zero moment at supports', () => {
    if (!result.success) throw new Error('Solve failed');
    
    const memberResult = result.results.memberResults.find(m => m.memberId === 'M0001');
    expect(memberResult).toBeDefined();
    
    const { moment } = memberResult!.diagrams;
    
    // Moment at x=0 and x=L should be zero (pinned supports)
    const momentAtStart = moment.find(p => p.x < 0.01);
    const momentAtEnd = moment.find(p => p.x > 5.99);
    
    expect(momentAtStart).toBeDefined();
    expect(momentAtEnd).toBeDefined();
    
    expect(Math.abs(momentAtStart!.value)).toBeLessThan(0.1);
    expect(Math.abs(momentAtEnd!.value)).toBeLessThan(0.1);
  });
});
