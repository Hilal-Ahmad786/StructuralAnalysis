/**
 * Diagram Controls
 *
 * Interactive controls for force diagrams, deformed shape, and animations.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useModelStore } from '@/stores/modelStore';

interface DiagramValues {
  axial: { min: number; max: number };
  shear: { min: number; max: number };
  moment: { min: number; max: number };
  deflection: { max: number };
}

export function DiagramControls(): React.JSX.Element {
  const { analysisResult, canvasSettings, updateCanvasSettings } = useModelStore();
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);

  // Calculate min/max values from results
  const diagramValues: DiagramValues | null = React.useMemo(() => {
    if (!analysisResult?.success) return null;

    const results = analysisResult.results.memberResults;
    let axialMin = 0, axialMax = 0;
    let shearMin = 0, shearMax = 0;
    let momentMin = 0, momentMax = 0;
    let deflectionMax = 0;

    results.forEach((mr) => {
      mr.diagrams.axial.forEach((p) => {
        axialMin = Math.min(axialMin, p.value);
        axialMax = Math.max(axialMax, p.value);
      });
      mr.diagrams.shear.forEach((p) => {
        shearMin = Math.min(shearMin, p.value);
        shearMax = Math.max(shearMax, p.value);
      });
      mr.diagrams.moment.forEach((p) => {
        momentMin = Math.min(momentMin, p.value);
        momentMax = Math.max(momentMax, p.value);
      });
      mr.diagrams.deflection.forEach((p) => {
        deflectionMax = Math.max(deflectionMax, Math.abs(p.value));
      });
    });

    return {
      axial: { min: axialMin, max: axialMax },
      shear: { min: shearMin, max: shearMax },
      moment: { min: momentMin, max: momentMax },
      deflection: { max: deflectionMax },
    };
  }, [analysisResult]);

  // Animation effect
  useEffect(() => {
    if (!isAnimating) return;

    let frame: number;
    let startTime: number | null = null;
    const duration = 2000; // 2 seconds per cycle

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = (elapsed % duration) / duration;

      setAnimationProgress(progress);

      // Update deformation scale sinusoidally
      const scale = Math.sin(progress * Math.PI * 2) * 50 + 100;
      updateCanvasSettings({ deformationScale: scale });

      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      updateCanvasSettings({ deformationScale: 100 });
    };
  }, [isAnimating, updateCanvasSettings]);

  const toggleAnimation = useCallback(() => {
    if (!canvasSettings.showDeformed) {
      updateCanvasSettings({ showDeformed: true });
    }
    setIsAnimating((prev) => !prev);
  }, [canvasSettings.showDeformed, updateCanvasSettings]);

  if (!analysisResult?.success) {
    return (
      <div className="p-4">
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 text-center">
          <span className="material-symbols-outlined text-[32px] text-slate-400 mb-2 block">
            analytics
          </span>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
            No results available
          </p>
          <p className="text-xs text-slate-400">
            Run analysis to see diagram controls
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-[20px] text-indigo-500">
            stacked_line_chart
          </span>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Diagram Controls</h3>
          <p className="text-xs text-slate-500">Adjust visualization settings</p>
        </div>
      </div>

      {/* Diagram Type Toggles */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Force Diagrams
        </h4>

        <DiagramToggle
          label="Axial Force (N)"
          checked={canvasSettings.showAxialDiagram}
          onChange={(checked) => updateCanvasSettings({ showAxialDiagram: checked })}
          color="#f59e0b"
          values={diagramValues?.axial}
          unit="kN"
        />

        <DiagramToggle
          label="Shear Force (V)"
          checked={canvasSettings.showShearDiagram}
          onChange={(checked) => updateCanvasSettings({ showShearDiagram: checked })}
          color="#3b82f6"
          values={diagramValues?.shear}
          unit="kN"
        />

        <DiagramToggle
          label="Bending Moment (M)"
          checked={canvasSettings.showMomentDiagram}
          onChange={(checked) => updateCanvasSettings({ showMomentDiagram: checked })}
          color="#ef4444"
          values={diagramValues?.moment}
          unit="kN·m"
        />
      </div>

      {/* Diagram Scale */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Diagram Scale
          </h4>
          <span className="text-xs font-mono text-slate-500">
            {canvasSettings.diagramScale.toFixed(1)}x
          </span>
        </div>
        <input
          type="range"
          min="0.1"
          max="5"
          step="0.1"
          value={canvasSettings.diagramScale}
          onChange={(e) => updateCanvasSettings({ diagramScale: parseFloat(e.target.value) })}
          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-structura-primary"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>0.1x</span>
          <span>5x</span>
        </div>
      </div>

      {/* Deformed Shape */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Deformed Shape
        </h4>

        <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-cyan-400" />
            <span className="text-sm text-slate-700 dark:text-slate-300">Show Deformed</span>
          </div>
          <input
            type="checkbox"
            checked={canvasSettings.showDeformed}
            onChange={(e) => updateCanvasSettings({ showDeformed: e.target.checked })}
            className="rounded border-slate-300 text-structura-primary focus:ring-structura-primary"
          />
        </label>

        {canvasSettings.showDeformed && (
          <>
            <div className="px-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">Deformation Scale</span>
                <span className="text-xs font-mono text-slate-500">
                  {canvasSettings.deformationScale.toFixed(0)}x
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="500"
                step="1"
                value={canvasSettings.deformationScale}
                onChange={(e) => updateCanvasSettings({ deformationScale: parseFloat(e.target.value) })}
                disabled={isAnimating}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 disabled:opacity-50"
              />
            </div>

            {diagramValues && (
              <div className="px-3 py-2 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-cyan-700 dark:text-cyan-300">Max Deflection:</span>
                  <span className="font-mono text-cyan-800 dark:text-cyan-200">
                    {(diagramValues.deflection.max * 1000).toFixed(2)} mm
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Animation Control */}
      <button
        onClick={toggleAnimation}
        disabled={!canvasSettings.showDeformed && !isAnimating}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors ${
          isAnimating
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-structura-primary hover:bg-blue-700 text-white disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed'
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">
          {isAnimating ? 'stop' : 'play_arrow'}
        </span>
        {isAnimating ? 'Stop Animation' : 'Animate Deformation'}
      </button>

      {/* Animation Progress */}
      {isAnimating && (
        <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-structura-primary transition-all duration-100"
            style={{ width: `${animationProgress * 100}%` }}
          />
        </div>
      )}

      {/* Legend Info */}
      <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <p className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[14px]">info</span>
          Click on a diagram to see values at that point
        </p>
      </div>
    </div>
  );
}

interface DiagramToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  color: string;
  values: { min: number; max: number } | undefined;
  unit: string;
}

function DiagramToggle({ label, checked, onChange, color, values, unit }: DiagramToggleProps): React.JSX.Element {
  return (
    <div className={`rounded-lg border transition-colors ${
      checked
        ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
        : 'border-transparent'
    }`}>
      <label className="flex items-center justify-between p-3 cursor-pointer">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
        </div>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="rounded border-slate-300 text-structura-primary focus:ring-structura-primary"
        />
      </label>

      {checked && values && (
        <div className="px-3 pb-3 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
            <span className="text-slate-500">Min:</span>
            <span className="font-mono" style={{ color }}>
              {values.min.toFixed(2)} {unit}
            </span>
          </div>
          <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
            <span className="text-slate-500">Max:</span>
            <span className="font-mono" style={{ color }}>
              {values.max.toFixed(2)} {unit}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
