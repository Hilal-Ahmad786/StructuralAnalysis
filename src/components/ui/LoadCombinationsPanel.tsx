/**
 * LoadCombinationsPanel - Manage load combinations with factors
 *
 * Create, edit, and apply load combinations using code-based presets.
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useModelStore } from '@/stores/modelStore';
import { solveCombinations } from '@/lib/solver';
import { LOAD_COMBINATION_PRESETS, type LoadCombinationFactor, type LoadCaseType } from '@/types';
import type { CombinationAnalysisResult } from '@/types/analysis';

type DesignCode = keyof typeof LOAD_COMBINATION_PRESETS;

export function LoadCombinationsPanel(): React.JSX.Element {
  const {
    model,
    loadCases,
    loadCombinations,
    addLoadCombination,
    deleteLoadCombination,
    updateLoadCombination,
    solverSettings,
    combinationAnalysisResult,
    isAnalyzingCombinations,
    setCombinationAnalysisResult,
    setIsAnalyzingCombinations,
  } = useModelStore();
  const [selectedCode, setSelectedCode] = useState<DesignCode>('ASCE7-LRFD');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCombName, setNewCombName] = useState('');
  const [newCombFactors, setNewCombFactors] = useState<Record<string, number>>({});
  const [expandedCombId, setExpandedCombId] = useState<string | null>(null);

  // Group load cases by type for factor assignment
  const loadCasesByType = useMemo(() => {
    const grouped: Record<LoadCaseType, typeof loadCases> = {
      dead: [],
      live: [],
      wind: [],
      snow: [],
      seismic: [],
      other: [],
    };
    loadCases.forEach((lc) => {
      grouped[lc.type].push(lc);
    });
    return grouped;
  }, [loadCases]);

  const handleAddPreset = useCallback(
    (preset: (typeof LOAD_COMBINATION_PRESETS)[DesignCode][number]) => {
      // Map preset factors to actual load cases
      const factors: LoadCombinationFactor[] = [];

      Object.entries(preset.factors).forEach(([type, factor]) => {
        const casesOfType = loadCasesByType[type as LoadCaseType];
        casesOfType.forEach((lc) => {
          factors.push({ loadCaseId: lc.id, factor });
        });
      });

      if (factors.length > 0) {
        addLoadCombination(preset.name, selectedCode, factors);
      }
    },
    [loadCasesByType, addLoadCombination, selectedCode]
  );

  const handleAddAllPresets = useCallback(() => {
    const presets = LOAD_COMBINATION_PRESETS[selectedCode];
    presets.forEach((preset) => handleAddPreset(preset));
  }, [selectedCode, handleAddPreset]);

  const handleAddCustom = useCallback(() => {
    if (!newCombName.trim()) return;

    const factors: LoadCombinationFactor[] = [];
    Object.entries(newCombFactors).forEach(([loadCaseId, factor]) => {
      if (factor !== 0) {
        factors.push({ loadCaseId, factor });
      }
    });

    if (factors.length > 0) {
      addLoadCombination(newCombName, 'Custom', factors);
      setNewCombName('');
      setNewCombFactors({});
      setIsAddingNew(false);
    }
  }, [newCombName, newCombFactors, addLoadCombination]);

  const handleDeleteCombination = useCallback(
    (id: string) => {
      if (confirm('Delete this load combination?')) {
        deleteLoadCombination(id);
      }
    },
    [deleteLoadCombination]
  );

  const handleUpdateFactor = useCallback(
    (combId: string, loadCaseId: string, newFactor: number) => {
      const comb = loadCombinations.find((c) => c.id === combId);
      if (!comb) return;

      const updatedFactors = comb.factors.map((f) =>
        f.loadCaseId === loadCaseId ? { ...f, factor: newFactor } : f
      );

      // Add new factor if not exists
      if (!updatedFactors.find((f) => f.loadCaseId === loadCaseId) && newFactor !== 0) {
        updatedFactors.push({ loadCaseId, factor: newFactor });
      }

      // Remove zero factors
      const filteredFactors = updatedFactors.filter((f) => f.factor !== 0);

      updateLoadCombination(combId, { factors: filteredFactors });
    },
    [loadCombinations, updateLoadCombination]
  );

  // Check if we can analyze combinations
  const canAnalyzeCombinations = useMemo(() => {
    return (
      model.nodes.length >= 2 &&
      model.members.length >= 1 &&
      model.supports.length >= 1 &&
      loadCombinations.length > 0
    );
  }, [model, loadCombinations]);

  // Run combination analysis
  const runCombinationAnalysis = useCallback(async () => {
    if (!canAnalyzeCombinations) return;

    setIsAnalyzingCombinations(true);
    setCombinationAnalysisResult(null);

    // Use setTimeout to allow UI to update
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        try {
          const result = solveCombinations(
            model,
            loadCases,
            loadCombinations,
            solverSettings
          );
          setCombinationAnalysisResult(result);
        } catch (error) {
          console.error('Combination analysis failed:', error);
          setCombinationAnalysisResult({
            success: false,
            error: {
              code: 'NUMERICAL_FAILURE',
              message: error instanceof Error ? error.message : 'Unknown error',
            },
            failedLoadCases: [],
          });
        } finally {
          setIsAnalyzingCombinations(false);
          resolve();
        }
      }, 50);
    });
  }, [
    model,
    loadCases,
    loadCombinations,
    solverSettings,
    canAnalyzeCombinations,
    setIsAnalyzingCombinations,
    setCombinationAnalysisResult,
  ]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px] text-purple-500">functions</span>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Load Combinations</h3>
            <p className="text-xs text-slate-500">{loadCombinations.length} combinations</p>
          </div>
        </div>
      </div>

      {/* Preset Section */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center gap-2 mb-3">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Design Code:</label>
          <select
            value={selectedCode}
            onChange={(e) => setSelectedCode(e.target.value as DesignCode)}
            className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-structura-primary"
          >
            <option value="ASCE7-LRFD">ASCE 7 (LRFD)</option>
            <option value="ASCE7-ASD">ASCE 7 (ASD)</option>
            <option value="Eurocode">Eurocode</option>
          </select>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-slate-500 mb-2">Quick add from {selectedCode}:</p>
          <div className="flex flex-wrap gap-2">
            {LOAD_COMBINATION_PRESETS[selectedCode].map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleAddPreset(preset)}
                className="px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded hover:border-purple-500 hover:text-purple-600 transition-colors"
                title={`Add: ${preset.name}`}
              >
                {preset.name}
              </button>
            ))}
          </div>
          <button
            onClick={handleAddAllPresets}
            className="w-full mt-2 px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
          >
            Add All {selectedCode} Combinations
          </button>
        </div>
      </div>

      {/* Combinations List */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {loadCombinations.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <span className="material-symbols-outlined text-[48px] mb-2 block opacity-50">functions</span>
            <p className="text-sm">No load combinations defined</p>
            <p className="text-xs mt-1">Add presets above or create custom</p>
          </div>
        ) : (
          loadCombinations.map((comb) => (
            <div
              key={comb.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden"
            >
              {/* Combination Header */}
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                onClick={() => setExpandedCombId(expandedCombId === comb.id ? null : comb.id)}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-[18px] transition-transform ${
                      expandedCombId === comb.id ? 'rotate-90' : ''
                    }`}
                  >
                    chevron_right
                  </span>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{comb.name}</p>
                    <p className="text-xs text-slate-500">{comb.code}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCombination(comb.id);
                  }}
                  className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>

              {/* Expanded Factors */}
              {expandedCombId === comb.id && (
                <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="space-y-2">
                    {loadCases.map((lc) => {
                      const factor = comb.factors.find((f) => f.loadCaseId === lc.id)?.factor ?? 0;
                      return (
                        <div key={lc.id} className="flex items-center gap-3">
                          <span className="text-sm text-slate-600 dark:text-slate-400 w-32 truncate">
                            {lc.name}
                          </span>
                          <input
                            type="number"
                            value={factor}
                            onChange={(e) =>
                              handleUpdateFactor(comb.id, lc.id, parseFloat(e.target.value) || 0)
                            }
                            step="0.1"
                            className="w-20 px-2 py-1 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-structura-primary"
                          />
                          <span className="text-xs text-slate-400">×</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Formula Display */}
                  <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-800 rounded text-xs font-mono text-slate-600 dark:text-slate-400">
                    {comb.factors
                      .filter((f) => f.factor !== 0)
                      .map((f, idx) => {
                        const lc = loadCases.find((l) => l.id === f.loadCaseId);
                        const sign = idx === 0 ? '' : f.factor >= 0 ? ' + ' : ' - ';
                        return `${sign}${Math.abs(f.factor)}${lc?.name ?? 'Unknown'}`;
                      })
                      .join('')}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Analyze All Combinations Button */}
      {loadCombinations.length > 0 && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={runCombinationAnalysis}
            disabled={!canAnalyzeCombinations || isAnalyzingCombinations}
            className={`
              w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all
              ${
                canAnalyzeCombinations && !isAnalyzingCombinations
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
              }
            `}
          >
            {isAnalyzingCombinations ? (
              <>
                <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                Analyzing Combinations...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                Analyze All Combinations
              </>
            )}
          </button>
        </div>
      )}

      {/* Combination Analysis Results */}
      {combinationAnalysisResult && <CombinationResultsDisplay result={combinationAnalysisResult} loadCombinations={loadCombinations} />}

      {/* Add Custom Combination */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        {!isAddingNew ? (
          <button
            onClick={() => setIsAddingNew(true)}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg hover:border-purple-500 hover:text-purple-600 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Custom Combination
          </button>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Combination name..."
              value={newCombName}
              onChange={(e) => setNewCombName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-structura-primary"
            />
            <div className="space-y-2 max-h-40 overflow-auto">
              {loadCases.map((lc) => (
                <div key={lc.id} className="flex items-center gap-3">
                  <span className="text-sm text-slate-600 dark:text-slate-400 w-32 truncate">
                    {lc.name}
                  </span>
                  <input
                    type="number"
                    value={newCombFactors[lc.id] ?? 0}
                    onChange={(e) =>
                      setNewCombFactors((prev) => ({
                        ...prev,
                        [lc.id]: parseFloat(e.target.value) || 0,
                      }))
                    }
                    step="0.1"
                    className="w-20 px-2 py-1 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-structura-primary"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsAddingNew(false);
                  setNewCombName('');
                  setNewCombFactors({});
                }}
                className="flex-1 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustom}
                disabled={!newCombName.trim()}
                className="flex-1 py-2 bg-structura-primary hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Display component for combination analysis results
 */
function CombinationResultsDisplay({
  result,
  loadCombinations,
}: {
  result: CombinationAnalysisResult;
  loadCombinations: { id: string; name: string }[];
}): React.JSX.Element {
  const [selectedCombId, setSelectedCombId] = useState<string | null>(null);
  const [showEnvelopes, setShowEnvelopes] = useState(false);

  if (!result.success) {
    return (
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <span className="material-symbols-outlined text-[24px]">error</span>
            <span className="font-semibold">Combination Analysis Failed</span>
          </div>
          <p className="text-sm text-red-600 dark:text-red-300 mt-2">{result.error.message}</p>
          {result.failedLoadCases.length > 0 && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-1">
              Failed load cases: {result.failedLoadCases.join(', ')}
            </p>
          )}
        </div>
      </div>
    );
  }

  const { combinedResults, envelopes, warnings } = result;

  // Find max values across all combinations
  const maxDisp = Math.max(
    ...combinedResults.flatMap((cr) =>
      cr.nodeDisplacements.map((d) => Math.sqrt(d.dx * d.dx + d.dy * d.dy))
    ),
    0
  );

  const maxMoment = Math.max(
    ...combinedResults.flatMap((cr) =>
      cr.memberResults.flatMap((mr) => mr.diagrams.moment.map((p) => Math.abs(p.value)))
    ),
    0
  );

  const selectedResult = selectedCombId
    ? combinedResults.find((cr) => cr.combinationId === selectedCombId)
    : null;

  return (
    <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
      {/* Success Header */}
      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <span className="material-symbols-outlined text-[24px]">check_circle</span>
          <span className="font-semibold">Combinations Analyzed</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div className="text-slate-600 dark:text-slate-400">
            Combinations:{' '}
            <span className="font-medium text-slate-900 dark:text-white">
              {combinedResults.length}
            </span>
          </div>
          <div className="text-slate-600 dark:text-slate-400">
            Max Displacement:{' '}
            <span className="font-medium text-slate-900 dark:text-white">
              {(maxDisp * 1000).toFixed(2)} mm
            </span>
          </div>
          {maxMoment > 0 && (
            <div className="text-slate-600 dark:text-slate-400">
              Max Moment:{' '}
              <span className="font-medium text-slate-900 dark:text-white">
                {maxMoment.toFixed(2)} kN·m
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <h4 className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
            <span className="material-symbols-outlined text-[16px]">warning</span>
            Warnings
          </h4>
          <ul className="text-xs text-amber-600 dark:text-amber-300 list-disc list-inside mt-2 space-y-1">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Combination Selector */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
        <h4 className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <span className="material-symbols-outlined text-[16px] text-slate-400">list</span>
          View Combination Results
        </h4>
        <select
          value={selectedCombId ?? ''}
          onChange={(e) => setSelectedCombId(e.target.value || null)}
          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">Select a combination...</option>
          {combinedResults.map((cr) => (
            <option key={cr.combinationId} value={cr.combinationId}>
              {cr.combinationName}
            </option>
          ))}
        </select>
      </div>

      {/* Selected Combination Results */}
      {selectedResult && (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
          <h4 className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <span className="material-symbols-outlined text-[16px] text-slate-400">table_chart</span>
            {selectedResult.combinationName} - Reactions
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 dark:text-slate-400">
                  <th className="pb-2 font-medium">Node</th>
                  <th className="pb-2 font-medium">Fx (kN)</th>
                  <th className="pb-2 font-medium">Fy (kN)</th>
                  <th className="pb-2 font-medium">Mz (kN·m)</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 dark:text-slate-300">
                {selectedResult.reactions.map((r) => (
                  <tr key={r.nodeId} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="py-2 font-medium">{r.nodeId}</td>
                    <td className="py-2">{r.fx.toFixed(2)}</td>
                    <td className="py-2">{r.fy.toFixed(2)}</td>
                    <td className="py-2">{r.mz.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Envelope Toggle */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={showEnvelopes}
            onChange={(e) => setShowEnvelopes(e.target.checked)}
            className="rounded text-purple-500 focus:ring-purple-500"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-purple-500 transition-colors">
            Show Envelope Results
          </span>
        </label>

        {showEnvelopes && envelopes.memberEnvelopes.length > 0 && (
          <div className="mt-3 space-y-2">
            <h5 className="text-xs font-medium text-slate-500">Max/Min Values Across All Combinations</h5>
            {envelopes.memberEnvelopes.map((env) => {
              const maxM = Math.max(...env.momentMax.map((p) => p.value), 0);
              const minM = Math.min(...env.momentMin.map((p) => p.value), 0);
              const maxV = Math.max(...env.shearMax.map((p) => p.value), 0);
              const minV = Math.min(...env.shearMin.map((p) => p.value), 0);

              return (
                <div
                  key={env.memberId}
                  className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700"
                >
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {env.memberId}
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-1 text-xs text-slate-500">
                    <span>M: {minM.toFixed(1)} to {maxM.toFixed(1)} kN·m</span>
                    <span>V: {minV.toFixed(1)} to {maxV.toFixed(1)} kN</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
