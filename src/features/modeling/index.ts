/**
 * Modeling Feature
 * 
 * Tools and utilities for structural model creation and manipulation.
 */

// Hooks
export {
  useNodes,
  useMembers,
  useSupports,
  useMaterials,
  useSections,
} from './hooks';

// Utilities
export {
  distance,
  getMemberLength,
  getMemberAngle,
  getMemberMidpoint,
  snapToGrid,
  snapPointToGrid,
  snapToNode,
  getModelBounds,
  generateNodeId,
  generateMemberId,
  getConnectedMembers,
  isNodeUsed,
  memberExists,
  findNodesAtLocation,
  getModelStatistics,
} from './utils';

export type { ModelBounds, ModelStatistics } from './utils';
