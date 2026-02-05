/**
 * Test: Instability/Mechanism Detection
 * 
 * This is benchmark test #5 from the spec.
 * 
 * Tests that the solver correctly identifies and reports
 * unstable structures with clear error messages.
 */

import { describe, it, expect } from 'vitest';
import { solve } from '@/lib/solver';
import type { StructuralModel, LoadCase } from '@/types';

describe('Mechanism Detection', () => {
  it('detects structure with no supports', () => {
    const model: StructuralModel = {
      nodes: [
        { id: 'N0001', x: 0, y: 0 },
        { id: 'N0002', x: 4, y: 0 },
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
      materials: [{ id: 'mat1', name: 'Steel', E: 200_000_000 }],
      sections: [{ id: 'sec1', name: 'Section', A: 0.01, I: 1e-4 }],
      supports: [], // No supports!
    };

    const loadCase: LoadCase = {
      id: 'LC1',
      name: 'Test',
      type: 'dead',
      loads: [
        { id: 'L1', type: 'point', target: 'node', targetId: 'N0002', fx: 0, fy: -10 },
      ],
    };

    const result = solve(model, loadCase);
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('VALIDATION_FAILED');
    }
  });

  it('detects structure with insufficient restraints (only roller)', () => {
    const model: StructuralModel = {
      nodes: [
        { id: 'N0001', x: 0, y: 0 },
        { id: 'N0002', x: 4, y: 0 },
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
      materials: [{ id: 'mat1', name: 'Steel', E: 200_000_000 }],
      sections: [{ id: 'sec1', name: 'Section', A: 0.01, I: 1e-4 }],
      supports: [
        { nodeId: 'N0001', dx: false, dy: true, rz: false }, // Only vertical restraint
      ],
    };

    const loadCase: LoadCase = {
      id: 'LC1',
      name: 'Test',
      type: 'dead',
      loads: [
        { id: 'L1', type: 'point', target: 'node', targetId: 'N0002', fx: 0, fy: -10 },
      ],
    };

    const result = solve(model, loadCase);
    
    // Should fail - can't restrain horizontal motion and rotation with single dy restraint
    expect(result.success).toBe(false);
  });

  it('detects disconnected structure', () => {
    const model: StructuralModel = {
      nodes: [
        { id: 'N0001', x: 0, y: 0 },
        { id: 'N0002', x: 4, y: 0 },
        { id: 'N0003', x: 10, y: 0 }, // Disconnected
        { id: 'N0004', x: 14, y: 0 }, // Disconnected
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
        {
          id: 'M0002',
          type: 'frame',
          startNodeId: 'N0003',
          endNodeId: 'N0004',
          materialId: 'mat1',
          sectionId: 'sec1',
        },
      ],
      materials: [{ id: 'mat1', name: 'Steel', E: 200_000_000 }],
      sections: [{ id: 'sec1', name: 'Section', A: 0.01, I: 1e-4 }],
      supports: [
        { nodeId: 'N0001', dx: true, dy: true, rz: true },
        { nodeId: 'N0003', dx: true, dy: true, rz: true },
      ],
    };

    const loadCase: LoadCase = {
      id: 'LC1',
      name: 'Test',
      type: 'dead',
      loads: [],
    };

    const result = solve(model, loadCase);
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('VALIDATION_FAILED');
      // Error details should contain information about validation errors
      expect(result.error.details?.validationErrors).toBeDefined();
    }
  });

  it('detects zero-length member', () => {
    const model: StructuralModel = {
      nodes: [
        { id: 'N0001', x: 0, y: 0 },
        { id: 'N0002', x: 0, y: 0 }, // Same location as N1!
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
      materials: [{ id: 'mat1', name: 'Steel', E: 200_000_000 }],
      sections: [{ id: 'sec1', name: 'Section', A: 0.01, I: 1e-4 }],
      supports: [
        { nodeId: 'N0001', dx: true, dy: true, rz: true },
      ],
    };

    const loadCase: LoadCase = {
      id: 'LC1',
      name: 'Test',
      type: 'dead',
      loads: [],
    };

    const result = solve(model, loadCase);
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('VALIDATION_FAILED');
    }
  });

  it('never returns NaN values', () => {
    // Use a valid simple model
    const model: StructuralModel = {
      nodes: [
        { id: 'N0001', x: 0, y: 0 },
        { id: 'N0002', x: 4, y: 0 },
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
      materials: [{ id: 'mat1', name: 'Steel', E: 200_000_000 }],
      sections: [{ id: 'sec1', name: 'Section', A: 0.01, I: 1e-4 }],
      supports: [
        { nodeId: 'N0001', dx: true, dy: true, rz: true },
      ],
    };

    const loadCase: LoadCase = {
      id: 'LC1',
      name: 'Test',
      type: 'dead',
      loads: [
        { id: 'L1', type: 'point', target: 'node', targetId: 'N0002', fx: 0, fy: -10 },
      ],
    };

    const result = solve(model, loadCase);
    
    if (result.success) {
      // Check all values are finite
      for (const nd of result.results.nodeDisplacements) {
        expect(Number.isFinite(nd.dx)).toBe(true);
        expect(Number.isFinite(nd.dy)).toBe(true);
        expect(Number.isFinite(nd.rz)).toBe(true);
      }
      
      for (const r of result.results.reactions) {
        expect(Number.isFinite(r.fx)).toBe(true);
        expect(Number.isFinite(r.fy)).toBe(true);
        expect(Number.isFinite(r.mz)).toBe(true);
      }
      
      for (const mr of result.results.memberResults) {
        for (const pt of mr.diagrams.axial) {
          expect(Number.isFinite(pt.value)).toBe(true);
        }
        for (const pt of mr.diagrams.shear) {
          expect(Number.isFinite(pt.value)).toBe(true);
        }
        for (const pt of mr.diagrams.moment) {
          expect(Number.isFinite(pt.value)).toBe(true);
        }
        for (const pt of mr.diagrams.deflection) {
          expect(Number.isFinite(pt.value)).toBe(true);
        }
      }
    } else {
      // Even in failure, error should be structured
      expect(result.error.code).toBeDefined();
      expect(result.error.message).toBeDefined();
    }
  });

  it('reports structured error for mechanisms', () => {
    // Create a simple mechanism (beam with two roller supports)
    const model: StructuralModel = {
      nodes: [
        { id: 'N0001', x: 0, y: 0 },
        { id: 'N0002', x: 4, y: 0 },
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
      materials: [{ id: 'mat1', name: 'Steel', E: 200_000_000 }],
      sections: [{ id: 'sec1', name: 'Section', A: 0.01, I: 1e-4 }],
      supports: [
        { nodeId: 'N0001', dx: false, dy: true, rz: false }, // Roller Y
        { nodeId: 'N0002', dx: false, dy: true, rz: false }, // Roller Y
      ],
    };

    const loadCase: LoadCase = {
      id: 'LC1',
      name: 'Test',
      type: 'dead',
      loads: [
        { id: 'L1', type: 'point', target: 'node', targetId: 'N0002', fx: 10, fy: 0 },
      ],
    };

    const result = solve(model, loadCase);
    
    expect(result.success).toBe(false);
    if (!result.success) {
      // Should have a proper error code
      expect(['MECHANISM_DETECTED', 'INSUFFICIENT_RESTRAINTS', 'ILL_CONDITIONED']).toContain(result.error.code);
      // Should have suggestions
      expect(result.error.details?.suggestedFixes).toBeDefined();
    }
  });
});
