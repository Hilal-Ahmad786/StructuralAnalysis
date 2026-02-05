/**
 * ReportResults - Analysis results tables
 * 
 * Shows reactions, displacements, and member forces.
 */

import React from 'react';
import type { AnalysisResults, AnalysisMetadata, EquilibriumError } from '@/types/analysis';
import type { StructuralModel } from '@/types';

interface ReportResultsProps {
  results: AnalysisResults;
  metadata: AnalysisMetadata;
  model: StructuralModel;
  warnings: string[];
}

export function ReportResults({ results, metadata, model, warnings }: ReportResultsProps) {
  const { reactions, nodeDisplacements, memberResults } = results;
  const { members } = model;

  const formatValue = (value: number, decimals = 4) => {
    if (Math.abs(value) < 1e-10) return '0.0000';
    if (Math.abs(value) < 0.0001 || Math.abs(value) > 10000) {
      return value.toExponential(decimals);
    }
    return value.toFixed(decimals);
  };

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
        3. Analysis Results
      </h2>

      {/* Analysis Metadata */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Analysis Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-blue-600">Solve Time</p>
            <p className="font-medium text-blue-900">{metadata.solveTimeMs.toFixed(1)} ms</p>
          </div>
          <div>
            <p className="text-blue-600">Total DOFs</p>
            <p className="font-medium text-blue-900">{metadata.totalDOFs}</p>
          </div>
          <div>
            <p className="text-blue-600">Free DOFs</p>
            <p className="font-medium text-blue-900">{metadata.freeDOFs}</p>
          </div>
          <div>
            <p className="text-blue-600">Equilibrium Check</p>
            <p className={`font-medium ${metadata.equilibriumError.passed ? 'text-green-700' : 'text-yellow-700'}`}>
              {metadata.equilibriumError.passed ? '✓ Passed' : '⚠ Warning'}
            </p>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">Warnings</h3>
          <ul className="list-disc list-inside text-sm text-yellow-700">
            {warnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Reactions Table */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">3.1 Support Reactions</h3>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left">Node</th>
              <th className="border border-gray-300 px-3 py-2 text-right">Rx (kN)</th>
              <th className="border border-gray-300 px-3 py-2 text-right">Ry (kN)</th>
              <th className="border border-gray-300 px-3 py-2 text-right">Mz (kN·m)</th>
            </tr>
          </thead>
          <tbody>
            {reactions.map(reaction => (
              <tr key={reaction.nodeId}>
                <td className="border border-gray-300 px-3 py-2 font-mono">{reaction.nodeId}</td>
                <td className="border border-gray-300 px-3 py-2 text-right font-mono">
                  {formatValue(reaction.fx)}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-right font-mono">
                  {formatValue(reaction.fy)}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-right font-mono">
                  {formatValue(reaction.mz)}
                </td>
              </tr>
            ))}
            {/* Sum row */}
            <tr className="bg-gray-50 font-medium">
              <td className="border border-gray-300 px-3 py-2">ΣR</td>
              <td className="border border-gray-300 px-3 py-2 text-right font-mono">
                {formatValue(reactions.reduce((sum, r) => sum + r.fx, 0))}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-right font-mono">
                {formatValue(reactions.reduce((sum, r) => sum + r.fy, 0))}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-right font-mono">
                {formatValue(reactions.reduce((sum, r) => sum + r.mz, 0))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Displacements Table */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">3.2 Node Displacements</h3>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left">Node</th>
              <th className="border border-gray-300 px-3 py-2 text-right">dx (mm)</th>
              <th className="border border-gray-300 px-3 py-2 text-right">dy (mm)</th>
              <th className="border border-gray-300 px-3 py-2 text-right">rz (mrad)</th>
            </tr>
          </thead>
          <tbody>
            {nodeDisplacements.map(disp => (
              <tr key={disp.nodeId}>
                <td className="border border-gray-300 px-3 py-2 font-mono">{disp.nodeId}</td>
                <td className="border border-gray-300 px-3 py-2 text-right font-mono">
                  {formatValue(disp.dx * 1000)}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-right font-mono">
                  {formatValue(disp.dy * 1000)}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-right font-mono">
                  {formatValue(disp.rz * 1000)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-500 mt-1">
          Note: Displacements shown in mm and mrad for readability (stored as m and rad).
        </p>
      </div>

      {/* Max Displacements */}
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Maximum Displacements</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Max |dx|</p>
            <p className="font-medium">
              {formatValue(Math.max(...nodeDisplacements.map(d => Math.abs(d.dx))) * 1000)} mm
            </p>
          </div>
          <div>
            <p className="text-gray-600">Max |dy|</p>
            <p className="font-medium">
              {formatValue(Math.max(...nodeDisplacements.map(d => Math.abs(d.dy))) * 1000)} mm
            </p>
          </div>
          <div>
            <p className="text-gray-600">Max |rz|</p>
            <p className="font-medium">
              {formatValue(Math.max(...nodeDisplacements.map(d => Math.abs(d.rz))) * 1000)} mrad
            </p>
          </div>
        </div>
      </div>

      {/* Member End Forces Table */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">3.3 Member End Forces</h3>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left" rowSpan={2}>Member</th>
              <th className="border border-gray-300 px-3 py-2 text-center" colSpan={3}>Start (Node i)</th>
              <th className="border border-gray-300 px-3 py-2 text-center" colSpan={3}>End (Node j)</th>
            </tr>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-right">N (kN)</th>
              <th className="border border-gray-300 px-3 py-2 text-right">V (kN)</th>
              <th className="border border-gray-300 px-3 py-2 text-right">M (kN·m)</th>
              <th className="border border-gray-300 px-3 py-2 text-right">N (kN)</th>
              <th className="border border-gray-300 px-3 py-2 text-right">V (kN)</th>
              <th className="border border-gray-300 px-3 py-2 text-right">M (kN·m)</th>
            </tr>
          </thead>
          <tbody>
            {memberResults.map(result => {
              const member = members.find(m => m.id === result.memberId);
              const forces = result.endForcesLocal;
              return (
                <tr key={result.memberId}>
                  <td className="border border-gray-300 px-3 py-2 font-mono">
                    {result.memberId}
                    <span className="text-xs text-gray-400 ml-1">
                      ({member?.type})
                    </span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right font-mono">
                    {formatValue(forces.f1x)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right font-mono">
                    {formatValue(forces.f1y)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right font-mono">
                    {formatValue(forces.m1)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right font-mono">
                    {formatValue(forces.f2x)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right font-mono">
                    {formatValue(forces.f2y)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right font-mono">
                    {formatValue(forces.m2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="text-xs text-gray-500 mt-1">
          Sign convention: N positive = tension, V positive = clockwise rotation of left segment, 
          M positive = bottom fiber tension.
        </p>
      </div>

      {/* Max Forces */}
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Maximum Internal Forces</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Max |N|</p>
            <p className="font-medium">
              {formatValue(Math.max(
                ...memberResults.flatMap(r => [Math.abs(r.endForcesLocal.f1x), Math.abs(r.endForcesLocal.f2x)])
              ))} kN
            </p>
          </div>
          <div>
            <p className="text-gray-600">Max |V|</p>
            <p className="font-medium">
              {formatValue(Math.max(
                ...memberResults.flatMap(r => [Math.abs(r.endForcesLocal.f1y), Math.abs(r.endForcesLocal.f2y)])
              ))} kN
            </p>
          </div>
          <div>
            <p className="text-gray-600">Max |M|</p>
            <p className="font-medium">
              {formatValue(Math.max(
                ...memberResults.flatMap(r => [Math.abs(r.endForcesLocal.m1), Math.abs(r.endForcesLocal.m2)])
              ))} kN·m
            </p>
          </div>
        </div>
      </div>

      {/* Equilibrium Check */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">3.4 Equilibrium Verification</h3>
        <EquilibriumTable equilibrium={metadata.equilibriumError} />
      </div>
    </section>
  );
}

function EquilibriumTable({ equilibrium }: { equilibrium: EquilibriumError }) {
  const { fx, fy, mz, passed } = equilibrium;
  
  return (
    <div className={`p-4 rounded-lg border ${
      passed ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        {passed ? (
          <span className="text-green-600 text-lg">✓</span>
        ) : (
          <span className="text-yellow-600 text-lg">⚠</span>
        )}
        <span className={`font-medium ${passed ? 'text-green-800' : 'text-yellow-800'}`}>
          {passed ? 'Equilibrium Satisfied' : 'Equilibrium Warning'}
        </span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left py-1 text-gray-600">Component</th>
            <th className="text-right py-1 text-gray-600">Residual</th>
            <th className="text-right py-1 text-gray-600">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-1">ΣFx</td>
            <td className="text-right font-mono">{fx.toExponential(3)} kN</td>
            <td className="text-right">{Math.abs(fx) < 0.01 ? '✓' : '⚠'}</td>
          </tr>
          <tr>
            <td className="py-1">ΣFy</td>
            <td className="text-right font-mono">{fy.toExponential(3)} kN</td>
            <td className="text-right">{Math.abs(fy) < 0.01 ? '✓' : '⚠'}</td>
          </tr>
          <tr>
            <td className="py-1">ΣMz</td>
            <td className="text-right font-mono">{mz.toExponential(3)} kN·m</td>
            <td className="text-right">{Math.abs(mz) < 0.01 ? '✓' : '⚠'}</td>
          </tr>
        </tbody>
      </table>
      <p className="text-xs text-gray-500 mt-2">
        Tolerance: 0.01 kN for forces, 0.01 kN·m for moments.
      </p>
    </div>
  );
}
