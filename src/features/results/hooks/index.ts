/**
 * Results Hooks
 * 
 * Custom hooks for accessing and processing analysis results.
 */

import { useMemo } from 'react';
import { useModelStore } from '@/stores/modelStore';
import type { 
  MemberResult, 
  ReactionResult, 
  NodeDisplacement 
} from '@/types/analysis';

// ============================================================================
// useAnalysisResults Hook
// ============================================================================

export function useAnalysisResults() {
  const { analysisResult } = useModelStore();

  const hasResults = analysisResult?.success === true;
  const results = hasResults ? analysisResult.results : null;
  const metadata = hasResults ? analysisResult.metadata : null;
  const warnings = hasResults ? analysisResult.warnings : [];
  const error = !hasResults && analysisResult ? analysisResult.error : null;

  return {
    hasResults,
    results,
    metadata,
    warnings,
    error,
    isSuccess: hasResults,
    isError: !hasResults && analysisResult !== null,
  };
}

// ============================================================================
// useReactions Hook
// ============================================================================

export function useReactions() {
  const { analysisResult } = useModelStore();

  const reactions = useMemo(() => {
    if (!analysisResult?.success) return [];
    return analysisResult.results.reactions;
  }, [analysisResult]);

  const getReactionByNode = (nodeId: string): ReactionResult | undefined => {
    return reactions.find((r) => r.nodeId === nodeId);
  };

  const totalReactions = useMemo(() => {
    return reactions.reduce(
      (acc, r) => ({
        fx: acc.fx + r.fx,
        fy: acc.fy + r.fy,
        mz: acc.mz + r.mz,
      }),
      { fx: 0, fy: 0, mz: 0 }
    );
  }, [reactions]);

  const maxReactions = useMemo(() => {
    if (reactions.length === 0) return { fx: 0, fy: 0, mz: 0 };
    return {
      fx: Math.max(...reactions.map((r) => Math.abs(r.fx))),
      fy: Math.max(...reactions.map((r) => Math.abs(r.fy))),
      mz: Math.max(...reactions.map((r) => Math.abs(r.mz))),
    };
  }, [reactions]);

  return {
    reactions,
    getReactionByNode,
    totalReactions,
    maxReactions,
  };
}

// ============================================================================
// useDisplacements Hook
// ============================================================================

export function useDisplacements() {
  const { analysisResult } = useModelStore();

  const displacements = useMemo(() => {
    if (!analysisResult?.success) return [];
    return analysisResult.results.nodeDisplacements;
  }, [analysisResult]);

  const getDisplacementByNode = (nodeId: string): NodeDisplacement | undefined => {
    return displacements.find((d) => d.nodeId === nodeId);
  };

  const maxDisplacements = useMemo(() => {
    if (displacements.length === 0) return { dx: 0, dy: 0, rz: 0 };
    return {
      dx: Math.max(...displacements.map((d) => Math.abs(d.dx))),
      dy: Math.max(...displacements.map((d) => Math.abs(d.dy))),
      rz: Math.max(...displacements.map((d) => Math.abs(d.rz))),
    };
  }, [displacements]);

  const maxTotalDisplacement = useMemo(() => {
    if (displacements.length === 0) return { value: 0, nodeId: '' };
    
    let maxValue = 0;
    let maxNodeId = '';
    
    for (const d of displacements) {
      const total = Math.sqrt(d.dx ** 2 + d.dy ** 2);
      if (total > maxValue) {
        maxValue = total;
        maxNodeId = d.nodeId;
      }
    }
    
    return { value: maxValue, nodeId: maxNodeId };
  }, [displacements]);

  return {
    displacements,
    getDisplacementByNode,
    maxDisplacements,
    maxTotalDisplacement,
  };
}

// ============================================================================
// useMemberResults Hook
// ============================================================================

export function useMemberResults() {
  const { analysisResult } = useModelStore();

  const memberResults = useMemo(() => {
    if (!analysisResult?.success) return [];
    return analysisResult.results.memberResults;
  }, [analysisResult]);

  const getMemberResult = (memberId: string): MemberResult | undefined => {
    return memberResults.find((r) => r.memberId === memberId);
  };

  const maxForces = useMemo(() => {
    if (memberResults.length === 0) {
      return { axial: 0, shear: 0, moment: 0 };
    }

    let maxAxial = 0;
    let maxShear = 0;
    let maxMoment = 0;

    for (const result of memberResults) {
      // Check end forces
      maxAxial = Math.max(
        maxAxial,
        Math.abs(result.endForcesLocal.f1x),
        Math.abs(result.endForcesLocal.f2x)
      );
      maxShear = Math.max(
        maxShear,
        Math.abs(result.endForcesLocal.f1y),
        Math.abs(result.endForcesLocal.f2y)
      );
      maxMoment = Math.max(
        maxMoment,
        Math.abs(result.endForcesLocal.m1),
        Math.abs(result.endForcesLocal.m2)
      );

      // Check diagram points
      for (const point of result.diagrams.axial) {
        maxAxial = Math.max(maxAxial, Math.abs(point.value));
      }
      for (const point of result.diagrams.shear) {
        maxShear = Math.max(maxShear, Math.abs(point.value));
      }
      for (const point of result.diagrams.moment) {
        maxMoment = Math.max(maxMoment, Math.abs(point.value));
      }
    }

    return { axial: maxAxial, shear: maxShear, moment: maxMoment };
  }, [memberResults]);

  const criticalMember = useMemo(() => {
    if (memberResults.length === 0) return null;

    let maxMoment = 0;
    let criticalId = '';

    for (const result of memberResults) {
      for (const point of result.diagrams.moment) {
        if (Math.abs(point.value) > maxMoment) {
          maxMoment = Math.abs(point.value);
          criticalId = result.memberId;
        }
      }
    }

    return { memberId: criticalId, maxMoment };
  }, [memberResults]);

  return {
    memberResults,
    getMemberResult,
    maxForces,
    criticalMember,
  };
}

// ============================================================================
// useEquilibrium Hook
// ============================================================================

export function useEquilibrium() {
  const { analysisResult } = useModelStore();

  const equilibriumError = useMemo(() => {
    if (!analysisResult?.success) return null;
    return analysisResult.metadata.equilibriumError;
  }, [analysisResult]);

  const isEquilibriumSatisfied = equilibriumError?.passed ?? false;

  return {
    equilibriumError,
    isEquilibriumSatisfied,
    residualForceX: equilibriumError?.fx ?? 0,
    residualForceY: equilibriumError?.fy ?? 0,
    residualMoment: equilibriumError?.mz ?? 0,
  };
}
