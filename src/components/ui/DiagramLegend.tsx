/**
 * Diagram Legend
 *
 * Canvas overlay showing diagram scale, colors, and unit information.
 */

'use client';

import React from 'react';
import { useModelStore } from '@/stores/modelStore';

interface DiagramLegendProps {
  className?: string;
}

export function DiagramLegend({ className = '' }: DiagramLegendProps): React.JSX.Element | null {
  const { analysisResult, canvasSettings } = useModelStore();

  const {
    showAxialDiagram,
    showShearDiagram,
    showMomentDiagram,
    showDeformed,
    diagramScale,
    deformationScale,
  } = canvasSettings;

  // Only show if analysis is done and at least one diagram is visible
  const hasVisibleDiagram = showAxialDiagram || showShearDiagram || showMomentDiagram || showDeformed;

  if (!analysisResult?.success || !hasVisibleDiagram) {
    return null;
  }

  // Calculate max values for scale reference
  const results = analysisResult.results.memberResults;
  let maxAxial = 0, maxShear = 0, maxMoment = 0, maxDeflection = 0;

  results.forEach((mr) => {
    mr.diagrams.axial.forEach((p) => {
      maxAxial = Math.max(maxAxial, Math.abs(p.value));
    });
    mr.diagrams.shear.forEach((p) => {
      maxShear = Math.max(maxShear, Math.abs(p.value));
    });
    mr.diagrams.moment.forEach((p) => {
      maxMoment = Math.max(maxMoment, Math.abs(p.value));
    });
    mr.diagrams.deflection.forEach((p) => {
      maxDeflection = Math.max(maxDeflection, Math.abs(p.value));
    });
  });

  return (
    <div className={`bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-3 text-xs ${className}`}>
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200 dark:border-slate-700">
        <span className="material-symbols-outlined text-[14px] text-slate-500">legend_toggle</span>
        <span className="font-medium text-slate-700 dark:text-slate-300">Diagram Legend</span>
      </div>

      <div className="space-y-2">
        {showAxialDiagram && (
          <LegendItem
            color="#f59e0b"
            label="Axial (N)"
            value={maxAxial}
            unit="kN"
          />
        )}

        {showShearDiagram && (
          <LegendItem
            color="#3b82f6"
            label="Shear (V)"
            value={maxShear}
            unit="kN"
          />
        )}

        {showMomentDiagram && (
          <LegendItem
            color="#ef4444"
            label="Moment (M)"
            value={maxMoment}
            unit="kN·m"
          />
        )}

        {showDeformed && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 bg-cyan-400" style={{ borderTop: '2px dashed #22d3ee' }} />
              <span className="text-slate-600 dark:text-slate-400">Deformed</span>
            </div>
            <span className="text-slate-500">
              (×{deformationScale.toFixed(0)})
            </span>
            <span className="ml-auto font-mono text-cyan-600 dark:text-cyan-400">
              {(maxDeflection * 1000).toFixed(2)} mm
            </span>
          </div>
        )}
      </div>

      {/* Scale indicator */}
      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between text-slate-500">
          <span>Diagram Scale:</span>
          <span className="font-mono">{diagramScale.toFixed(1)}×</span>
        </div>
      </div>

      {/* Sign convention */}
      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-400">
        <p>+ N = Tension</p>
        <p>+ M = Bottom tension (sagging)</p>
      </div>
    </div>
  );
}

interface LegendItemProps {
  color: string;
  label: string;
  value: number;
  unit: string;
}

function LegendItem({ color, label, value, unit }: LegendItemProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color, opacity: 0.3 }} />
        <div className="w-3 h-0.5" style={{ backgroundColor: color }} />
        <span className="text-slate-600 dark:text-slate-400">{label}</span>
      </div>
      <span className="ml-auto font-mono" style={{ color }}>
        {value.toFixed(2)} {unit}
      </span>
    </div>
  );
}

/**
 * Compact legend for smaller screens
 */
export function DiagramLegendCompact({ className = '' }: DiagramLegendProps): React.JSX.Element | null {
  const { analysisResult, canvasSettings } = useModelStore();

  const {
    showAxialDiagram,
    showShearDiagram,
    showMomentDiagram,
    showDeformed,
  } = canvasSettings;

  const hasVisibleDiagram = showAxialDiagram || showShearDiagram || showMomentDiagram || showDeformed;

  if (!analysisResult?.success || !hasVisibleDiagram) {
    return null;
  }

  return (
    <div className={`flex items-center gap-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs ${className}`}>
      {showAxialDiagram && (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-slate-600 dark:text-slate-400">N</span>
        </div>
      )}
      {showShearDiagram && (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-slate-600 dark:text-slate-400">V</span>
        </div>
      )}
      {showMomentDiagram && (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-slate-600 dark:text-slate-400">M</span>
        </div>
      )}
      {showDeformed && (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="text-slate-600 dark:text-slate-400">Def</span>
        </div>
      )}
    </div>
  );
}
