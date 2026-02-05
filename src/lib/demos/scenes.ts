/**
 * Demo Scenes - Pre-built structural models for testing and demonstration
 */

import type { StructuralModel, LoadCase } from '@/types';
import {
  DEFAULT_MATERIALS,
  DEFAULT_SECTIONS,
  createSupport,
} from '@/types/project';

export interface DemoScene {
  name: string;
  description: string;
  model: StructuralModel;
  loadCases: LoadCase[];
}

// Simple beam with UDL
export const simpleBeamDemo: DemoScene = {
  name: 'Simply Supported Beam',
  description: 'A 6m beam with pinned and roller supports under uniform distributed load',
  model: {
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
        materialId: 'steel-s235',
        sectionId: 'ipe-200',
      },
    ],
    materials: [...DEFAULT_MATERIALS],
    sections: [...DEFAULT_SECTIONS],
    supports: [
      createSupport('N0001', 'pinned'),
      createSupport('N0002', 'rollerX'),
    ],
  },
  loadCases: [
    {
      id: 'lc-dead',
      name: 'Dead Load',
      type: 'dead',
      loads: [
        {
          id: 'L001',
          type: 'distributed',
          target: 'member',
          targetId: 'M0001',
          w: 10,
          direction: 'globalNegY',
        },
      ],
    },
  ],
};

// Cantilever with point load
export const cantileverDemo: DemoScene = {
  name: 'Cantilever Beam',
  description: 'A 4m cantilever with fixed support and point load at the tip',
  model: {
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
        materialId: 'steel-s235',
        sectionId: 'ipe-300',
      },
    ],
    materials: [...DEFAULT_MATERIALS],
    sections: [...DEFAULT_SECTIONS],
    supports: [
      createSupport('N0001', 'fixed'),
    ],
  },
  loadCases: [
    {
      id: 'lc-point',
      name: 'Point Load',
      type: 'live',
      loads: [
        {
          id: 'L001',
          type: 'point',
          target: 'node',
          targetId: 'N0002',
          fx: 0,
          fy: -20,
          mz: 0,
        },
      ],
    },
  ],
};

// Portal frame
export const portalFrameDemo: DemoScene = {
  name: 'Portal Frame',
  description: 'A simple portal frame with horizontal and vertical loads',
  model: {
    nodes: [
      { id: 'N0001', x: 0, y: 0 },
      { id: 'N0002', x: 0, y: 4 },
      { id: 'N0003', x: 6, y: 4 },
      { id: 'N0004', x: 6, y: 0 },
    ],
    members: [
      {
        id: 'M0001',
        type: 'frame',
        startNodeId: 'N0001',
        endNodeId: 'N0002',
        materialId: 'steel-s235',
        sectionId: 'heb-200',
      },
      {
        id: 'M0002',
        type: 'frame',
        startNodeId: 'N0002',
        endNodeId: 'N0003',
        materialId: 'steel-s235',
        sectionId: 'ipe-300',
      },
      {
        id: 'M0003',
        type: 'frame',
        startNodeId: 'N0003',
        endNodeId: 'N0004',
        materialId: 'steel-s235',
        sectionId: 'heb-200',
      },
    ],
    materials: [...DEFAULT_MATERIALS],
    sections: [...DEFAULT_SECTIONS],
    supports: [
      createSupport('N0001', 'fixed'),
      createSupport('N0004', 'fixed'),
    ],
  },
  loadCases: [
    {
      id: 'lc-combo',
      name: 'Combined Load',
      type: 'live',
      loads: [
        // Distributed load on beam
        {
          id: 'L001',
          type: 'distributed',
          target: 'member',
          targetId: 'M0002',
          w: 15,
          direction: 'globalNegY',
        },
        // Horizontal wind load
        {
          id: 'L002',
          type: 'point',
          target: 'node',
          targetId: 'N0002',
          fx: 10,
          fy: 0,
          mz: 0,
        },
      ],
    },
  ],
};

// Simple truss
export const trussDemo: DemoScene = {
  name: 'Simple Truss',
  description: 'A Warren-type truss with point loads',
  model: {
    nodes: [
      { id: 'N0001', x: 0, y: 0 },
      { id: 'N0002', x: 2, y: 0 },
      { id: 'N0003', x: 4, y: 0 },
      { id: 'N0004', x: 6, y: 0 },
      { id: 'N0005', x: 1, y: 1.5 },
      { id: 'N0006', x: 3, y: 1.5 },
      { id: 'N0007', x: 5, y: 1.5 },
    ],
    members: [
      // Bottom chord
      { id: 'M0001', type: 'truss', startNodeId: 'N0001', endNodeId: 'N0002', materialId: 'steel-s235', sectionId: 'ipe-200' },
      { id: 'M0002', type: 'truss', startNodeId: 'N0002', endNodeId: 'N0003', materialId: 'steel-s235', sectionId: 'ipe-200' },
      { id: 'M0003', type: 'truss', startNodeId: 'N0003', endNodeId: 'N0004', materialId: 'steel-s235', sectionId: 'ipe-200' },
      // Top chord
      { id: 'M0004', type: 'truss', startNodeId: 'N0005', endNodeId: 'N0006', materialId: 'steel-s235', sectionId: 'ipe-200' },
      { id: 'M0005', type: 'truss', startNodeId: 'N0006', endNodeId: 'N0007', materialId: 'steel-s235', sectionId: 'ipe-200' },
      // Diagonals
      { id: 'M0006', type: 'truss', startNodeId: 'N0001', endNodeId: 'N0005', materialId: 'steel-s235', sectionId: 'ipe-200' },
      { id: 'M0007', type: 'truss', startNodeId: 'N0005', endNodeId: 'N0002', materialId: 'steel-s235', sectionId: 'ipe-200' },
      { id: 'M0008', type: 'truss', startNodeId: 'N0002', endNodeId: 'N0006', materialId: 'steel-s235', sectionId: 'ipe-200' },
      { id: 'M0009', type: 'truss', startNodeId: 'N0006', endNodeId: 'N0003', materialId: 'steel-s235', sectionId: 'ipe-200' },
      { id: 'M0010', type: 'truss', startNodeId: 'N0003', endNodeId: 'N0007', materialId: 'steel-s235', sectionId: 'ipe-200' },
      { id: 'M0011', type: 'truss', startNodeId: 'N0007', endNodeId: 'N0004', materialId: 'steel-s235', sectionId: 'ipe-200' },
    ],
    materials: [...DEFAULT_MATERIALS],
    sections: [...DEFAULT_SECTIONS],
    supports: [
      createSupport('N0001', 'pinned'),
      createSupport('N0004', 'rollerX'),
    ],
  },
  loadCases: [
    {
      id: 'lc-point',
      name: 'Point Loads',
      type: 'live',
      loads: [
        { id: 'L001', type: 'point', target: 'node', targetId: 'N0002', fx: 0, fy: -10, mz: 0 },
        { id: 'L002', type: 'point', target: 'node', targetId: 'N0003', fx: 0, fy: -10, mz: 0 },
      ],
    },
  ],
};

// All demos
export const demoScenes: DemoScene[] = [
  simpleBeamDemo,
  cantileverDemo,
  portalFrameDemo,
  trussDemo,
];

export function getDemoByName(name: string): DemoScene | undefined {
  return demoScenes.find((d) => d.name === name);
}
