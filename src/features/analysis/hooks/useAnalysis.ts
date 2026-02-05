/**
 * useAnalysis Hook
 * 
 * Manages the structural analysis workflow including validation and solving.
 */

import { useCallback, useMemo } from 'react';
import { useModelStore } from '@/stores/modelStore';
import { solve, solvePDelta } from '@/lib/solver';
import { validateModel } from '@/lib/solver/validation';
import type { ValidationMessage } from '@/types/analysis';
import type { SolverResult } from '@/lib/solver';
import type { LoadCase } from '@/types';

export interface AnalysisState {
  isAnalyzing: boolean;
  canAnalyze: boolean;
  validationMessages: ValidationMessage[];
  hasErrors: boolean;
  hasWarnings: boolean;
}

export interface UseAnalysisReturn extends AnalysisState {
  activeLoadCase: LoadCase | undefined;
  analysisResult: SolverResult | null;
  runAnalysis: () => Promise<void>;
  clearAnalysisResult: () => void;
}

export function useAnalysis(): UseAnalysisReturn {
  const {
    model,
    loadCases,
    activeLoadCaseId,
    analysisResult,
    isAnalyzing,
    setAnalysisResult,
    setIsAnalyzing,
    clearAnalysisResult,
    solverSettings,
  } = useModelStore();
  
  const activeLoadCase = loadCases.find((lc) => lc.id === activeLoadCaseId) ?? loadCases[0];
  
  // Run pre-solve validation
  const validationResult = useMemo(() => {
    if (!activeLoadCase) return { valid: false, errors: [], warnings: [] };
    return validateModel(model, activeLoadCase);
  }, [model, activeLoadCase]);
  
  const validationMessages = useMemo(() => {
    return [...validationResult.errors, ...validationResult.warnings];
  }, [validationResult]);
  
  const hasErrors = validationResult.errors.length > 0;
  const hasWarnings = validationResult.warnings.length > 0;
  
  // Check if we can run analysis
  const canAnalyze = useMemo(() => {
    return (
      model.nodes.length >= 2 &&
      model.members.length >= 1 &&
      model.supports.length >= 1 &&
      !hasErrors
    );
  }, [model, hasErrors]);
  
  // Run analysis (async to keep UI responsive)
  const runAnalysis = useCallback(async () => {
    if (!activeLoadCase || !canAnalyze) return;

    setIsAnalyzing(true);
    clearAnalysisResult();

    // Use setTimeout to allow UI to update before heavy computation
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        try {
          // Use P-Delta solver if enabled, otherwise use standard linear solver
          const result = solverSettings.pDeltaEnabled
            ? solvePDelta(model, activeLoadCase, solverSettings)
            : solve(model, activeLoadCase);
          setAnalysisResult(result);
        } catch (error) {
          console.error('Analysis failed:', error);
          setAnalysisResult({
            success: false,
            error: {
              code: 'NUMERICAL_FAILURE',
              message: error instanceof Error ? error.message : 'Unknown error',
            },
          });
        } finally {
          setIsAnalyzing(false);
          resolve();
        }
      }, 50);
    });
  }, [model, activeLoadCase, canAnalyze, solverSettings, setIsAnalyzing, clearAnalysisResult, setAnalysisResult]);
  
  const state: AnalysisState = {
    isAnalyzing,
    canAnalyze,
    validationMessages,
    hasErrors,
    hasWarnings,
  };
  
  return {
    ...state,
    activeLoadCase,
    analysisResult,
    runAnalysis,
    clearAnalysisResult,
  };
}
