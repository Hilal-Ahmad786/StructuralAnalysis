/**
 * Modeling Hooks
 * 
 * Custom hooks for node, member, and support manipulation.
 * These are convenience wrappers around the model store.
 */

import { useCallback } from 'react';
import { useModelStore } from '@/stores/modelStore';

// ============================================================================
// useNodes Hook
// ============================================================================

export function useNodes() {
  const { model, addNode, updateNode, deleteNode } = useModelStore();

  const nodes = model.nodes;

  const createNode = useCallback((x: number, y: number) => {
    addNode(x, y);
  }, [addNode]);

  const moveNode = useCallback((id: string, x: number, y: number) => {
    updateNode(id, { x, y });
  }, [updateNode]);

  const removeNode = useCallback((id: string) => {
    deleteNode(id);
  }, [deleteNode]);

  return {
    nodes,
    createNode,
    moveNode,
    removeNode,
  };
}

// ============================================================================
// useMembers Hook
// ============================================================================

export function useMembers() {
  const { model, addMember, updateMember, deleteMember } = useModelStore();

  const members = model.members;

  const createMember = useCallback((
    startNodeId: string, 
    endNodeId: string
  ) => {
    return addMember(startNodeId, endNodeId);
  }, [addMember]);

  const updateMemberType = useCallback((id: string, type: 'frame' | 'truss') => {
    updateMember(id, { type });
  }, [updateMember]);

  const updateMemberSection = useCallback((id: string, sectionId: string) => {
    updateMember(id, { sectionId });
  }, [updateMember]);

  const updateMemberMaterial = useCallback((id: string, materialId: string) => {
    updateMember(id, { materialId });
  }, [updateMember]);

  const removeMember = useCallback((id: string) => {
    deleteMember(id);
  }, [deleteMember]);

  const getMemberLength = useCallback((memberId: string) => {
    const member = model.members.find((m) => m.id === memberId);
    if (!member) return 0;
    const startNode = model.nodes.find((n) => n.id === member.startNodeId);
    const endNode = model.nodes.find((n) => n.id === member.endNodeId);
    if (!startNode || !endNode) return 0;
    return Math.sqrt(
      (endNode.x - startNode.x) ** 2 + (endNode.y - startNode.y) ** 2
    );
  }, [model.nodes, model.members]);

  return {
    members,
    createMember,
    updateMemberType,
    updateMemberSection,
    updateMemberMaterial,
    removeMember,
    getMemberLength,
  };
}

// ============================================================================
// useSupports Hook
// ============================================================================

export function useSupports() {
  const { model, addSupport, updateSupport, deleteSupport } = useModelStore();

  const supports = model.supports;

  const createSupport = useCallback((
    nodeId: string, 
    type: 'fixed' | 'pinned' | 'rollerX' | 'rollerY'
  ) => {
    addSupport(nodeId, type);
  }, [addSupport]);

  const removeSupport = useCallback((nodeId: string) => {
    deleteSupport(nodeId);
  }, [deleteSupport]);

  return {
    supports,
    createSupport,
    updateSupport,
    removeSupport,
  };
}

// ============================================================================
// useMaterials Hook
// ============================================================================

export function useMaterials() {
  const { model, addMaterial, updateMaterial, deleteMaterial } = useModelStore();

  const materials = model.materials;

  const createMaterial = useCallback((name: string, E: number, density?: number) => {
    const material: Omit<import('@/types').Material, 'id'> = { name, E };
    if (density !== undefined) {
      material.density = density;
    }
    return addMaterial(material);
  }, [addMaterial]);

  const removeMaterial = useCallback((id: string) => {
    deleteMaterial(id);
  }, [deleteMaterial]);

  return {
    materials,
    createMaterial,
    updateMaterial,
    removeMaterial,
  };
}

// ============================================================================
// useSections Hook
// ============================================================================

export function useSections() {
  const { model, addSection, updateSection, deleteSection } = useModelStore();

  const sections = model.sections;

  const createSection = useCallback((name: string, A: number, I: number) => {
    return addSection({ name, A, I });
  }, [addSection]);

  const removeSection = useCallback((id: string) => {
    deleteSection(id);
  }, [deleteSection]);

  return {
    sections,
    createSection,
    updateSection,
    removeSection,
  };
}
