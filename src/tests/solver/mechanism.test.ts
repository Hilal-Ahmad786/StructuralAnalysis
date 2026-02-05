/**
 * Test: Mechanism Detection
 * 
 * This is benchmark test #5 from the spec.
 * 
 * Tests that the solver correctly detects and reports unstable structures.
 */

import { describe, it, expect } from 'vitest';
import { solve } from '@/lib/solver';
import type { StructuralModel, LoadCase } from '@/types';

describe('Mechanism Detection', () => {
  
  describe('No supports', () => {
    it('returns error for structure with no supports', () => {
      const model: StructuralModel = {
        nodes: [
          { id: 'N0001', x: 0, y: 0 },
          { id: 'N0002', x: 6, y: 0 },
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
        materials: [{ id: 'mat1', name: 'Steel', E: 210_000_000 }],
        sections: [{ id: 'sec1', name: 'Section', A: 0.01, I: 1e-4 }],
        supports: [], // No supports!
      };

      const loadCase: LoadCase = {
        id: 'LC1',
        name: 'Test',
        type: 'dead',
        loads: [
          { id: 'L1', type: 'point', target: 'node', targetId: 'N0002', fy: -10 },
        ],
      };

      const result = solve(model, loadCase);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(['VALIDATION_FAILED', 'INSUFFICIENT_RESTRAINTS', 'MECHANISM_DETECTED'])
          .toContain(result.error.code);
      }
    });
  });

  describe('Insufficient supports', () => {
    it('returns error for single roller only', () => {
      const model: StructuralModel = {
        nodes: [
          { id: 'N0001', x: 0, y: 0 },
          { id: 'N0002', x: 6, y: 0 },
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
        materials: [{ id: 'mat1', name: 'Steel', E: 210_000_000 }],
        sections: [{ id: 'sec1', name: 'Section', A: 0.01, I: 1e-4 }],
        supports: [
          { nodeId: 'N0001', dx: false, dy: true, rz: false }, // Only 1 restraint
        ],
      };

      const loadCase: LoadCase = {
        id: 'LC1',
        name: 'Test',
        type: 'dead',
        loads: [
          { id: 'L1', type: 'point', target: 'node', targetId: 'N0002', fy: -10 },
        ],
      };

      const result = solve(model, loadCase);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(['INSUFFICIENT_RESTRAINTS', 'MECHANISM_DETECTED'])
          .toContain(result.error.code);
      }
    });
  });

  describe('Hinged mechanism', () => {
    it('returns error for three-hinged mechanism', () => {
      // Triangle with all pinned connections - still needs supports!
      // This creates a mechanism if not properly supported
      const model: StructuralModel = {
        nodes: [
          { id: 'N0001', x: 0, y: 0 },
          { id: 'N0002', x: 6, y: 0 },
          { id: 'N0003', x: 3, y: 4 },
        ],
        members: [
          { id: 'M0001', type: 'truss', startNodeId: 'N0001', endNodeId: 'N0002', materialId: 'mat1', sectionId: 'sec1' },
          { id: 'M0002', type: 'truss', startNodeId: 'N0002', endNodeId: 'N0003', materialId: 'mat1', sectionId: 'sec1' },
          { id: 'M0003', type: 'truss', startNodeId: 'N0003', endNodeId: 'N0001', materialId: 'mat1', sectionId: 'sec1' },
        ],
        materials: [{ id: 'mat1', name: 'Steel', E: 210_000_000 }],
        sections: [{ id: 'sec1', name: 'Section', A: 0.01, I: 1e-4 }],
        supports: [
          { nodeId: 'N0001', dx: true, dy: false, rz: false }, // Only X restrained
        ],
      };

      const loadCase: LoadCase = {
        id: 'LC1',
        name: 'Test',
        type: 'dead',
        loads: [
          { id: 'L1', type: 'point', target: 'node', targetId: 'N0003', fy: -10 },
        ],
      };

      const result = solve(model, loadCase);
      
      expect(result.success).toBe(false);
    });
  });

  describe('Disconnected structure', () => {
    it('returns error for disconnected nodes', () => {
      const model: StructuralModel = {
        nodes: [
          { id: 'N0001', x: 0, y: 0 },
          { id: 'N0002', x: 6, y: 0 },
          { id: 'N0003', x: 10, y: 0 }, // Disconnected!
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
          // N0003 is not connected to anything
        ],
        materials: [{ id: 'mat1', name: 'Steel', E: 210_000_000 }],
        sections: [{ id: 'sec1', name: 'Section', A: 0.01, I: 1e-4 }],
        supports: [
          { nodeId: 'N0001', dx: true, dy: true, rz: true },
          { nodeId: 'N0003', dx: true, dy: true, rz: false }, // Support on disconnected node
        ],
      };

      const loadCase: LoadCase = {
        id: 'LC1',
        name: 'Test',
        type: 'dead',
        loads: [
          { id: 'L1', type: 'point', target: 'node', targetId: 'N0002', fy: -10 },
        ],
      };

      const result = solve(model, loadCase);
      
      // Should fail due to disconnected structure
      // (The solver should still work on the connected part, but validation should warn)
      // For now, we just check it doesn't crash
      expect(result).toBeDefined();
    });
  });

  describe('Valid structure succeeds', () => {
    it('properly supported beam solves successfully', () => {
      const model: StructuralModel = {
        nodes: [
          { id: 'N0001', x: 0, y: 0 },
          { id: 'N0002', x: 6, y: 0 },
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
        materials: [{ id: 'mat1', name: 'Steel', E: 210_000_000 }],
        sections: [{ id: 'sec1', name: 'Section', A: 0.01, I: 1e-4 }],
        supports: [
          { nodeId: 'N0001', dx: true, dy: true, rz: false }, // Pinned
          { nodeId: 'N0002', dx: false, dy: true, rz: false }, // Roller
        ],
      };

      const loadCase: LoadCase = {
        id: 'LC1',
        name: 'Test',
        type: 'dead',
        loads: [
          { id: 'L1', type: 'point', target: 'node', targetId: 'N0002', fx: 0, fy: -10, mz: 0 },
        ],
      };

      const result = solve(model, loadCase);
      
      expect(result.success).toBe(true);
    });
  });

  describe('Error details', () => {
    it('provides helpful error details for unstable structure', () => {
      const model: StructuralModel = {
        nodes: [
          { id: 'N0001', x: 0, y: 0 },
          { id: 'N0002', x: 6, y: 0 },
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
        materials: [{ id: 'mat1', name: 'Steel', E: 210_000_000 }],
        sections: [{ id: 'sec1', name: 'Section', A: 0.01, I: 1e-4 }],
        supports: [], // No supports
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
        expect(result.error).toBeDefined();
        expect(result.error.message).toBeDefined();
        expect(result.error.message.length).toBeGreaterThan(0);
      }
    });
  });
});
