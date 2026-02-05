/**
 * ReportLoadSummary - Load cases and applied loads
 */

import React from 'react';
import type { LoadCase, StructuralModel } from '@/types';

interface ReportLoadSummaryProps {
  loadCases: LoadCase[];
  model: StructuralModel; // Keep for potential future use
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ReportLoadSummary({ loadCases, model: _model }: ReportLoadSummaryProps) {
  const formatLoadValue = (value: number | undefined) => {
    if (value === undefined || value === 0) return '–';
    return value.toFixed(3);
  };

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
        2. Load Cases
      </h2>

      {loadCases.length === 0 ? (
        <p className="text-gray-500 italic">No load cases defined.</p>
      ) : (
        loadCases.map((loadCase, index) => (
          <div key={loadCase.id} className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              2.{index + 1} {loadCase.name || `Load Case ${index + 1}`}
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Type: {loadCase.type} · {loadCase.loads.length} load(s)
            </p>

            {loadCase.loads.length === 0 ? (
              <p className="text-gray-500 italic text-sm">No loads in this case.</p>
            ) : (
              <>
                {/* Point Loads */}
                {loadCase.loads.some(l => l.target === 'node') && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Point Loads</h4>
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-3 py-2 text-left">Node</th>
                          <th className="border border-gray-300 px-3 py-2 text-right">Fx (kN)</th>
                          <th className="border border-gray-300 px-3 py-2 text-right">Fy (kN)</th>
                          <th className="border border-gray-300 px-3 py-2 text-right">Mz (kN·m)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadCase.loads
                          .filter(l => l.target === 'node')
                          .map(load => (
                            <tr key={load.id}>
                              <td className="border border-gray-300 px-3 py-2 font-mono">
                                {load.targetId}
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-right">
                                {formatLoadValue(load.fx)}
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-right">
                                {formatLoadValue(load.fy)}
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-right">
                                {formatLoadValue(load.mz)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Distributed Loads */}
                {loadCase.loads.some(l => l.target === 'member') && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Distributed Loads</h4>
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-3 py-2 text-left">Member</th>
                          <th className="border border-gray-300 px-3 py-2 text-left">Type</th>
                          <th className="border border-gray-300 px-3 py-2 text-right">w (kN/m)</th>
                          <th className="border border-gray-300 px-3 py-2 text-left">Direction</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadCase.loads
                          .filter(l => l.target === 'member')
                          .map(load => (
                            <tr key={load.id}>
                              <td className="border border-gray-300 px-3 py-2 font-mono">
                                {load.targetId}
                              </td>
                              <td className="border border-gray-300 px-3 py-2 capitalize">
                                {load.type}
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-right">
                                {formatLoadValue(load.w)}
                              </td>
                              <td className="border border-gray-300 px-3 py-2 capitalize">
                                {load.direction || 'local-y'}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        ))
      )}

      {/* Load Summary */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Load Summary</h4>
        {loadCases.map(loadCase => {
          const totalFx = loadCase.loads
            .filter(l => l.target === 'node')
            .reduce((sum, l) => sum + (l.fx || 0), 0);
          const totalFy = loadCase.loads
            .filter(l => l.target === 'node')
            .reduce((sum, l) => sum + (l.fy || 0), 0);
          const totalMz = loadCase.loads
            .filter(l => l.target === 'node')
            .reduce((sum, l) => sum + (l.mz || 0), 0);
          
          return (
            <div key={loadCase.id} className="text-sm text-gray-600">
              <span className="font-medium">{loadCase.name}:</span>
              {' '}ΣFx = {totalFx.toFixed(2)} kN,
              {' '}ΣFy = {totalFy.toFixed(2)} kN,
              {' '}ΣMz = {totalMz.toFixed(2)} kN·m
            </div>
          );
        })}
      </div>
    </section>
  );
}
