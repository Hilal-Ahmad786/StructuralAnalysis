/**
 * Loads Hooks
 * 
 * Custom hooks for load case and load manipulation.
 * These are convenience wrappers around the model store.
 */

import { useCallback, useMemo } from 'react';
import { useModelStore } from '@/stores/modelStore';
import type { LoadCaseType } from '@/types';

// ============================================================================
// useLoadCases Hook
// ============================================================================

export function useLoadCases() {
  const {
    loadCases,
    activeLoadCaseId,
    addLoadCase,
    updateLoadCase,
    deleteLoadCase,
    setActiveLoadCase,
  } = useModelStore();

  const activeLoadCase = loadCases.find((lc) => lc.id === activeLoadCaseId);

  const createLoadCase = useCallback((
    name: string,
    type: LoadCaseType = 'dead'
  ) => {
    addLoadCase(name, type);
  }, [addLoadCase]);

  const renameLoadCase = useCallback((id: string, name: string) => {
    updateLoadCase(id, { name });
  }, [updateLoadCase]);

  const changeLoadCaseType = useCallback((id: string, type: LoadCaseType) => {
    updateLoadCase(id, { type });
  }, [updateLoadCase]);

  const removeLoadCase = useCallback((id: string) => {
    deleteLoadCase(id);
  }, [deleteLoadCase]);

  const selectLoadCase = useCallback((id: string) => {
    setActiveLoadCase(id);
  }, [setActiveLoadCase]);

  return {
    loadCases,
    activeLoadCase,
    activeLoadCaseId,
    createLoadCase,
    renameLoadCase,
    changeLoadCaseType,
    removeLoadCase,
    selectLoadCase,
  };
}

// ============================================================================
// useLoads Hook
// ============================================================================

export function useLoads() {
  const {
    loadCases,
    activeLoadCaseId,
    addNodalLoad,
    addMemberLoad,
    updateLoad,
    deleteLoad,
  } = useModelStore();

  const activeLoadCase = useMemo(() =>
    loadCases.find((lc) => lc.id === activeLoadCaseId),
    [loadCases, activeLoadCaseId]);

  const loads = useMemo(() => activeLoadCase?.loads ?? [], [activeLoadCase]);

  const createPointLoad = useCallback((
    nodeId: string,
    fx?: number,
    fy?: number,
    mz?: number
  ) => {
    addNodalLoad(nodeId, fx, fy, mz);
  }, [addNodalLoad]);

  const createDistributedLoad = useCallback((
    memberId: string,
    w: number,
    direction: 'localY' | 'globalY' = 'localY'
  ) => {
    addMemberLoad(memberId, w, direction);
  }, [addMemberLoad]);

  const modifyLoad = useCallback((loadId: string, updates: Record<string, unknown>) => {
    if (!activeLoadCaseId) return;
    updateLoad(activeLoadCaseId, loadId, updates as Partial<Omit<import('@/types').Load, 'id'>>);
  }, [updateLoad, activeLoadCaseId]);

  const removeLoad = useCallback((loadId: string) => {
    if (!activeLoadCaseId) return;
    deleteLoad(activeLoadCaseId, loadId);
  }, [deleteLoad, activeLoadCaseId]);

  const getLoadsByNode = useCallback((nodeId: string) => {
    return loads.filter(
      (l) => l.target === 'node' && l.targetId === nodeId
    );
  }, [loads]);

  const getLoadsByMember = useCallback((memberId: string) => {
    return loads.filter(
      (l) => l.target === 'member' && l.targetId === memberId
    );
  }, [loads]);

  return {
    loads,
    activeLoadCase,
    createPointLoad,
    createDistributedLoad,
    modifyLoad,
    removeLoad,
    getLoadsByNode,
    getLoadsByMember,
  };
}

// ============================================================================
// Load Statistics
// ============================================================================

export function useLoadStatistics() {
  const { loadCases, activeLoadCaseId } = useModelStore();

  return useMemo(() => {
    const activeLoadCase = loadCases.find((lc) => lc.id === activeLoadCaseId);

    if (!activeLoadCase) {
      return {
        pointLoadCount: 0,
        distributedLoadCount: 0,
        totalLoads: 0,
        nodesWithLoads: 0,
        membersWithLoads: 0,
      };
    }

    const pointLoads = activeLoadCase.loads.filter((l) => l.type === 'point');
    const distributedLoads = activeLoadCase.loads.filter((l) => l.type === 'distributed');

    const nodesWithLoads = new Set(
      pointLoads.map((l) => l.targetId)
    ).size;

    const membersWithLoads = new Set(
      distributedLoads.map((l) => l.targetId)
    ).size;

    return {
      pointLoadCount: pointLoads.length,
      distributedLoadCount: distributedLoads.length,
      totalLoads: activeLoadCase.loads.length,
      nodesWithLoads,
      membersWithLoads,
    };
  }, [loadCases, activeLoadCaseId]);
}
