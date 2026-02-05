/**
 * AnalysisPanel - Run analysis and view results
 *
 * Updated with Structura Design System.
 */

'use client';

import React, { useState } from 'react';
import { useModelStore } from '@/stores/modelStore';
import { useAnalysis } from '@/features/analysis/hooks/useAnalysis';
import { ValidationPanel, ValidationSummary } from './ValidationPanel';
import type { SolverResult, MemberResult } from '@/lib/solver';

export function AnalysisPanel() {
  const {
    loadCases,
    activeLoadCaseId,
    setActiveLoadCase,
    addLoadCase,
    canvasSettings,
    updateCanvasSettings,
    solverSettings,
    updateSolverSettings,
  } = useModelStore();

  const { isAnalyzing, canAnalyze, validationMessages, hasErrors, hasWarnings, analysisResult, runAnalysis } =
    useAnalysis();

  const [showValidation, setShowValidation] = useState(true);

  return (
    <div className="p-4 space-y-5 overflow-y-auto max-h-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-structura-primary/10 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-[20px] text-structura-primary">analytics</span>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Structural Analysis</h3>
          <p className="text-xs text-slate-400">Run and view results</p>
        </div>
      </div>

      {/* Load Case Selector */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
        <h4 className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <span className="material-symbols-outlined text-[16px] text-slate-400">folder</span>
          Load Case
        </h4>
        <div className="flex gap-2">
          <select
            value={activeLoadCaseId ?? ''}
            onChange={(e) => setActiveLoadCase(e.target.value)}
            className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-structura-primary focus:border-transparent"
          >
            {loadCases.map((lc) => (
              <option key={lc.id} value={lc.id}>
                {lc.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => addLoadCase(`Load Case ${loadCases.length + 1}`, 'live')}
            className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:text-structura-primary hover:border-structura-primary transition-colors"
            title="Add Load Case"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
          </button>
        </div>
      </div>

      {/* Validation Section */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowValidation(!showValidation)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-slate-400">checklist</span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Validation</span>
            <ValidationSummary messages={validationMessages} />
          </span>
          <span
            className={`material-symbols-outlined text-[18px] text-slate-400 transition-transform ${showValidation ? 'rotate-180' : ''}`}
          >
            expand_more
          </span>
        </button>

        {showValidation && (
          <div className="px-4 pb-4">
            <ValidationPanel messages={validationMessages} />
          </div>
        )}
      </div>

      {/* P-Delta Settings */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
        <h4 className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <span className="material-symbols-outlined text-[16px] text-slate-400">settings</span>
          Analysis Settings
        </h4>

        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={solverSettings.pDeltaEnabled}
            onChange={(e) => updateSolverSettings({ pDeltaEnabled: e.target.checked })}
            className="rounded text-structura-primary focus:ring-structura-primary"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-structura-primary transition-colors">
            P-Delta Analysis (2nd Order)
          </span>
        </label>

        {solverSettings.pDeltaEnabled && (
          <div className="pl-7 space-y-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Max Iterations</label>
              <input
                type="number"
                min="1"
                max="50"
                value={solverSettings.pDeltaMaxIterations}
                onChange={(e) => updateSolverSettings({ pDeltaMaxIterations: parseInt(e.target.value) || 10 })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-structura-primary"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Convergence Tolerance</label>
              <select
                value={solverSettings.pDeltaConvergenceTol}
                onChange={(e) => updateSolverSettings({ pDeltaConvergenceTol: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-structura-primary"
              >
                <option value="1e-3">1e-3 (Coarse)</option>
                <option value="1e-4">1e-4 (Default)</option>
                <option value="1e-5">1e-5 (Fine)</option>
                <option value="1e-6">1e-6 (Very Fine)</option>
              </select>
            </div>
            <p className="text-xs text-slate-400">
              P-Delta analysis accounts for second-order effects from axial loads on lateral stiffness.
            </p>
          </div>
        )}
      </div>

      {/* Run Analysis Button */}
      <button
        onClick={runAnalysis}
        disabled={!canAnalyze || isAnalyzing}
        className={`
          w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all
          ${
            canAnalyze && !isAnalyzing
              ? 'bg-structura-primary hover:bg-blue-700 text-white shadow-lg shadow-structura-primary/20'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
          }
        `}
      >
        {isAnalyzing ? (
          <>
            <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
            Analyzing...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-[20px]">play_arrow</span>
            Run Analysis
          </>
        )}
      </button>

      {!canAnalyze && !hasErrors && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-400">
          <span className="material-symbols-outlined text-[18px]">info</span>
          Need at least 2 nodes, 1 member, and 1 support to analyze.
        </div>
      )}

      {hasErrors && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
          <span className="material-symbols-outlined text-[18px]">error</span>
          Fix validation errors before running analysis.
        </div>
      )}

      {hasWarnings && !hasErrors && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-400">
          <span className="material-symbols-outlined text-[18px]">warning</span>
          Warnings found. Analysis may still run.
        </div>
      )}

      {/* Results Display */}
      {analysisResult && <ResultsDisplay result={analysisResult} />}

      {/* Display Options (only after analysis) */}
      {analysisResult?.success && (
        <DiagramToggles canvasSettings={canvasSettings} updateCanvasSettings={updateCanvasSettings} />
      )}
    </div>
  );
}

function ResultsDisplay({ result }: { result: SolverResult }) {
  if (!result.success) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <span className="material-symbols-outlined text-[24px]">error</span>
          <span className="font-semibold">Analysis Failed</span>
        </div>
        <p className="text-sm text-red-600 dark:text-red-300">{result.error.message}</p>
        {result.error.details?.suggestedFixes && (
          <div className="text-sm">
            <p className="font-medium text-slate-700 dark:text-slate-300 mt-3 mb-2">Suggestions:</p>
            <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1">
              {result.error.details.suggestedFixes.map((fix, i) => (
                <li key={i}>{fix}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  const { results, metadata } = result;

  // Find max values
  const maxDisp = Math.max(...results.nodeDisplacements.map((d) => Math.sqrt(d.dx * d.dx + d.dy * d.dy)));

  const maxReaction = Math.max(...results.reactions.map((r) => Math.sqrt(r.fx * r.fx + r.fy * r.fy)));

  const maxMoment = Math.max(
    ...results.memberResults.flatMap((mr) => mr.diagrams.moment.map((p) => Math.abs(p.value))),
    0
  );

  return (
    <div className="space-y-4">
      {/* Success Header */}
      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <span className="material-symbols-outlined text-[24px]">check_circle</span>
          <span className="font-semibold">Analysis Complete</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div className="text-slate-600 dark:text-slate-400">
            Solve time: <span className="font-medium text-slate-900 dark:text-white">{metadata.solveTimeMs.toFixed(1)} ms</span>
          </div>
          <div className="text-slate-600 dark:text-slate-400">
            DOFs: <span className="font-medium text-slate-900 dark:text-white">{metadata.freeDOFs} / {metadata.totalDOFs}</span>
          </div>
          {metadata.pDeltaEnabled && (
            <>
              <div className="text-slate-600 dark:text-slate-400">
                P-Delta: <span className="font-medium text-slate-900 dark:text-white">{metadata.pDeltaIterations} iterations</span>
              </div>
              <div className="text-slate-600 dark:text-slate-400">
                Converged: <span className={`font-medium ${metadata.pDeltaConverged ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {metadata.pDeltaConverged ? 'Yes' : 'No'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
        <h4 className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <span className="material-symbols-outlined text-[16px] text-slate-400">summarize</span>
          Results Summary
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Max displacement</span>
            <span className="font-medium text-slate-900 dark:text-white">{(maxDisp * 1000).toFixed(2)} mm</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Max reaction</span>
            <span className="font-medium text-slate-900 dark:text-white">{maxReaction.toFixed(2)} kN</span>
          </div>
          {maxMoment > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Max moment</span>
              <span className="font-medium text-slate-900 dark:text-white">{maxMoment.toFixed(2)} kN·m</span>
            </div>
          )}
        </div>
      </div>

      {/* Reactions Table */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
        <h4 className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <span className="material-symbols-outlined text-[16px] text-slate-400">vertical_align_bottom</span>
          Reactions
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 dark:text-slate-400">
                <th className="pb-2 font-medium">Node</th>
                <th className="pb-2 font-medium">Fx</th>
                <th className="pb-2 font-medium">Fy</th>
                <th className="pb-2 font-medium">Mz</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              {results.reactions.map((r) => (
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

      {/* Displacements Table */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
        <h4 className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <span className="material-symbols-outlined text-[16px] text-slate-400">open_with</span>
          Displacements
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 dark:text-slate-400">
                <th className="pb-2 font-medium">Node</th>
                <th className="pb-2 font-medium">dx (mm)</th>
                <th className="pb-2 font-medium">dy (mm)</th>
                <th className="pb-2 font-medium">rz (mrad)</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              {results.nodeDisplacements.map((d) => (
                <tr key={d.nodeId} className="border-t border-slate-200 dark:border-slate-700">
                  <td className="py-2 font-medium">{d.nodeId}</td>
                  <td className="py-2">{(d.dx * 1000).toFixed(3)}</td>
                  <td className="py-2">{(d.dy * 1000).toFixed(3)}</td>
                  <td className="py-2">{(d.rz * 1000).toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Warnings */}
      {result.warnings && result.warnings.length > 0 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2">
          <h4 className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
            <span className="material-symbols-outlined text-[16px]">warning</span>
            Warnings
          </h4>
          <ul className="text-sm text-amber-600 dark:text-amber-300 list-disc list-inside space-y-1">
            {result.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Member Forces Table */}
      <MemberForcesTable memberResults={results.memberResults} />

      {/* Equilibrium Check */}
      <EquilibriumCheck result={result} />

      {/* Export Results Button */}
      <button
        onClick={() => exportResults(result)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">download</span>
        Export Results (JSON)
      </button>
    </div>
  );
}

interface CanvasSettingsType {
  showDeformed: boolean;
  deformationScale: number;
  showAxialDiagram: boolean;
  showShearDiagram: boolean;
  showMomentDiagram: boolean;
  diagramScale: number;
}

interface DiagramTogglesProps {
  canvasSettings: CanvasSettingsType;
  updateCanvasSettings: (settings: Partial<CanvasSettingsType>) => void;
}

// Member Forces Table component
function MemberForcesTable({ memberResults }: { memberResults: MemberResult[] }) {
  const [showMemberForces, setShowMemberForces] = useState(false);

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl overflow-hidden">
      <button
        onClick={() => setShowMemberForces(!showMemberForces)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-slate-400">table_chart</span>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Member Forces</span>
        </span>
        <span
          className={`material-symbols-outlined text-[18px] text-slate-400 transition-transform ${showMemberForces ? 'rotate-180' : ''}`}
        >
          expand_more
        </span>
      </button>

      {showMemberForces && (
        <div className="px-4 pb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-500 dark:text-slate-400">
                  <th className="pb-2 pr-2 font-medium">Member</th>
                  <th className="pb-2 pr-2 font-medium">N1</th>
                  <th className="pb-2 pr-2 font-medium">V1</th>
                  <th className="pb-2 pr-2 font-medium">M1</th>
                  <th className="pb-2 pr-2 font-medium">N2</th>
                  <th className="pb-2 pr-2 font-medium">V2</th>
                  <th className="pb-2 font-medium">M2</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 dark:text-slate-300">
                {memberResults.map((mr) => (
                  <tr key={mr.memberId} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="py-1.5 pr-2 font-medium">{mr.memberId}</td>
                    <td className="py-1.5 pr-2">{mr.endForcesLocal.f1x.toFixed(2)}</td>
                    <td className="py-1.5 pr-2">{mr.endForcesLocal.f1y.toFixed(2)}</td>
                    <td className="py-1.5 pr-2">{mr.endForcesLocal.m1.toFixed(2)}</td>
                    <td className="py-1.5 pr-2">{mr.endForcesLocal.f2x.toFixed(2)}</td>
                    <td className="py-1.5 pr-2">{mr.endForcesLocal.f2y.toFixed(2)}</td>
                    <td className="py-1.5">{mr.endForcesLocal.m2.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-slate-400 mt-2">Units: N (kN), V (kN), M (kN·m)</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Equilibrium Check component
function EquilibriumCheck({ result }: { result: SolverResult }) {
  if (!result.success) return null;

  const { reactions } = result.results;

  // Sum reactions
  const sumFx = reactions.reduce((sum, r) => sum + r.fx, 0);
  const sumFy = reactions.reduce((sum, r) => sum + r.fy, 0);
  const sumMz = reactions.reduce((sum, r) => sum + r.mz, 0);

  // For equilibrium, sum of reactions should balance applied loads
  const tolerance = 0.01;
  const equilibriumOk =
    Math.abs(sumFx) > tolerance || Math.abs(sumFy) > tolerance || sumFx !== 0 || sumFy !== 0;

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
      <h4 className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
        <span className="material-symbols-outlined text-[16px] text-slate-400">balance</span>
        Equilibrium Check
      </h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-600 dark:text-slate-400">ΣRx</span>
          <span className="font-medium text-slate-900 dark:text-white">{sumFx.toFixed(3)} kN</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600 dark:text-slate-400">ΣRy</span>
          <span className="font-medium text-slate-900 dark:text-white">{sumFy.toFixed(3)} kN</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600 dark:text-slate-400">ΣMz</span>
          <span className="font-medium text-slate-900 dark:text-white">{sumMz.toFixed(3)} kN·m</span>
        </div>
        <div className="flex items-center gap-2 pt-2 mt-2 border-t border-slate-200 dark:border-slate-700">
          {equilibriumOk ? (
            <>
              <span className="material-symbols-outlined text-[18px] text-green-500">check_circle</span>
              <span className="text-green-600 dark:text-green-400">Reactions computed</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px] text-amber-500">warning</span>
              <span className="text-amber-600 dark:text-amber-400">Check model restraints</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Export results to JSON file
function exportResults(result: SolverResult): void {
  if (!result.success) return;

  const exportData = {
    timestamp: new Date().toISOString(),
    metadata: result.metadata,
    reactions: result.results.reactions,
    nodeDisplacements: result.results.nodeDisplacements,
    memberResults: result.results.memberResults.map((mr) => ({
      memberId: mr.memberId,
      endForcesLocal: mr.endForcesLocal,
      maxAxial: Math.max(...mr.diagrams.axial.map((p) => Math.abs(p.value)), 0),
      maxShear: Math.max(...mr.diagrams.shear.map((p) => Math.abs(p.value)), 0),
      maxMoment: Math.max(...mr.diagrams.moment.map((p) => Math.abs(p.value)), 0),
    })),
    warnings: result.warnings ?? [],
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analysis-results-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function DiagramToggles({ canvasSettings, updateCanvasSettings }: DiagramTogglesProps) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-4">
      <h4 className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
        <span className="material-symbols-outlined text-[16px] text-slate-400">visibility</span>
        Display Options
      </h4>

      {/* Deformed Shape */}
      <label className="flex items-center gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={canvasSettings.showDeformed}
          onChange={(e) => updateCanvasSettings({ showDeformed: e.target.checked })}
          className="rounded text-structura-primary focus:ring-structura-primary"
        />
        <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-structura-primary transition-colors">
          Show Deformed Shape
        </span>
      </label>

      {canvasSettings.showDeformed && (
        <div className="pl-7">
          <label className="text-xs text-slate-500 block mb-2">Scale Factor: {canvasSettings.deformationScale}×</label>
          <input
            type="range"
            min="10"
            max="500"
            value={canvasSettings.deformationScale}
            onChange={(e) => updateCanvasSettings({ deformationScale: parseInt(e.target.value) })}
            className="w-full accent-structura-primary"
          />
        </div>
      )}

      {/* Diagrams */}
      <label className="flex items-center gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={canvasSettings.showAxialDiagram}
          onChange={(e) => updateCanvasSettings({ showAxialDiagram: e.target.checked })}
          className="rounded text-structura-primary focus:ring-structura-primary"
        />
        <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-structura-primary transition-colors">
          Axial Force Diagram
        </span>
      </label>

      <label className="flex items-center gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={canvasSettings.showShearDiagram}
          onChange={(e) => updateCanvasSettings({ showShearDiagram: e.target.checked })}
          className="rounded text-structura-primary focus:ring-structura-primary"
        />
        <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-structura-primary transition-colors">
          Shear Force Diagram
        </span>
      </label>

      <label className="flex items-center gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={canvasSettings.showMomentDiagram}
          onChange={(e) => updateCanvasSettings({ showMomentDiagram: e.target.checked })}
          className="rounded text-structura-primary focus:ring-structura-primary"
        />
        <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-structura-primary transition-colors">
          Bending Moment Diagram
        </span>
      </label>

      {(canvasSettings.showAxialDiagram || canvasSettings.showShearDiagram || canvasSettings.showMomentDiagram) && (
        <div className="pl-7">
          <label className="text-xs text-slate-500 block mb-2">Diagram Scale: {canvasSettings.diagramScale.toFixed(1)}×</label>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={canvasSettings.diagramScale}
            onChange={(e) => updateCanvasSettings({ diagramScale: parseFloat(e.target.value) })}
            className="w-full accent-structura-primary"
          />
        </div>
      )}
    </div>
  );
}
