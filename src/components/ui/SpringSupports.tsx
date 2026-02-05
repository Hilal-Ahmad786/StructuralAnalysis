/**
 * Spring Supports Panel
 *
 * Configure elastic (spring) supports for nodes.
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useModelStore } from '@/stores/modelStore';

interface SpringStiffness {
  kx: number; // Translational stiffness in X (kN/m)
  ky: number; // Translational stiffness in Y (kN/m)
  krz: number; // Rotational stiffness (kN·m/rad)
}

const DEFAULT_STIFFNESS: SpringStiffness = {
  kx: 0,
  ky: 0,
  krz: 0,
};

export function SpringSupportsPanel(): React.JSX.Element {
  const { model, selection } = useModelStore();

  // Get selected node
  const selectedNode = useMemo(() => {
    const nodeSelection = selection.find((s) => s.type === 'node');
    if (!nodeSelection) return null;
    return model.nodes.find((n) => n.id === nodeSelection.id);
  }, [selection, model.nodes]);

  // Check if node has a rigid support
  const existingSupport = useMemo(() => {
    if (!selectedNode) return null;
    return model.supports.find((s) => s.nodeId === selectedNode.id);
  }, [selectedNode, model.supports]);

  const [stiffness, setStiffness] = useState<SpringStiffness>(DEFAULT_STIFFNESS);
  const [isConverting, setIsConverting] = useState(false);

  const handleStiffnessChange = useCallback((key: keyof SpringStiffness, value: string) => {
    const numValue = parseFloat(value) || 0;
    setStiffness((prev) => ({
      ...prev,
      [key]: numValue,
    }));
  }, []);

  const applyPreset = useCallback((preset: 'soft' | 'medium' | 'stiff' | 'very-stiff') => {
    switch (preset) {
      case 'soft':
        setStiffness({ kx: 1000, ky: 1000, krz: 100 });
        break;
      case 'medium':
        setStiffness({ kx: 10000, ky: 10000, krz: 1000 });
        break;
      case 'stiff':
        setStiffness({ kx: 100000, ky: 100000, krz: 10000 });
        break;
      case 'very-stiff':
        setStiffness({ kx: 1000000, ky: 1000000, krz: 100000 });
        break;
    }
  }, []);

  const handleApply = useCallback(() => {
    if (!selectedNode) return;

    // In a full implementation, this would add spring stiffness to the node
    // This requires solver updates to handle elastic supports
    alert('Spring support would be applied. This feature requires solver updates.');
  }, [selectedNode, stiffness]);

  if (!selectedNode) {
    return (
      <div className="p-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 text-center border border-blue-200 dark:border-blue-800">
          <span className="material-symbols-outlined text-[32px] text-blue-400 mb-2 block">
            compress
          </span>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
            Select a node
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            Click on a node to add elastic support
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-[20px] text-teal-500">
            compress
          </span>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Spring Support</h3>
          <p className="text-xs text-slate-500">Node: {selectedNode.id}</p>
        </div>
      </div>

      {/* Existing Support Warning */}
      {existingSupport && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[20px] text-amber-500">warning</span>
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                Rigid Support Exists
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
                This node has a rigid support. Adding spring support will convert it to elastic.
              </p>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={isConverting}
                  onChange={(e) => setIsConverting(e.target.checked)}
                  className="rounded border-amber-300"
                />
                <span className="text-amber-700 dark:text-amber-300">
                  Convert to spring support
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Stiffness Presets */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
          Stiffness Presets
        </h4>
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: 'soft', label: 'Soft', color: 'bg-green-100 text-green-700' },
            { id: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
            { id: 'stiff', label: 'Stiff', color: 'bg-orange-100 text-orange-700' },
            { id: 'very-stiff', label: 'V. Stiff', color: 'bg-red-100 text-red-700' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id as 'soft' | 'medium' | 'stiff' | 'very-stiff')}
              className={`py-2 px-2 text-xs font-medium rounded-lg transition-colors ${preset.color} hover:opacity-80`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stiffness Inputs */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Spring Stiffness
        </h4>

        <div className="space-y-3">
          <StiffnessInput
            label="Kx (Horizontal)"
            value={stiffness.kx}
            onChange={(v) => handleStiffnessChange('kx', v)}
            unit="kN/m"
            icon="arrow_forward"
          />
          <StiffnessInput
            label="Ky (Vertical)"
            value={stiffness.ky}
            onChange={(v) => handleStiffnessChange('ky', v)}
            unit="kN/m"
            icon="arrow_upward"
          />
          <StiffnessInput
            label="Krz (Rotational)"
            value={stiffness.krz}
            onChange={(v) => handleStiffnessChange('krz', v)}
            unit="kN·m/rad"
            icon="rotate_right"
          />
        </div>
      </div>

      {/* Visual Preview */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
          Preview
        </h4>
        <div className="flex items-center justify-center p-4">
          <svg width="120" height="100" viewBox="0 0 120 100">
            {/* Ground */}
            <line x1="20" y1="80" x2="100" y2="80" stroke="currentColor" strokeWidth="2" className="text-slate-400" />

            {/* Node */}
            <circle cx="60" cy="30" r="8" fill="currentColor" className="text-structura-primary" />

            {/* Vertical spring */}
            {stiffness.ky > 0 && (
              <g>
                <SpringSymbol x={60} y1={38} y2={75} horizontal={false} />
                <text x="75" y="55" className="text-[8px] fill-slate-500">Ky</text>
              </g>
            )}

            {/* Horizontal spring */}
            {stiffness.kx > 0 && (
              <g transform="translate(60, 30)">
                <SpringSymbol x={0} y1={0} y2={35} horizontal={true} />
                <text x="25" y="15" className="text-[8px] fill-slate-500">Kx</text>
              </g>
            )}

            {/* Rotational spring indicator */}
            {stiffness.krz > 0 && (
              <g>
                <path
                  d="M 50 25 A 10 10 0 0 1 70 25"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-teal-500"
                />
                <text x="60" y="15" textAnchor="middle" className="text-[8px] fill-teal-500">Krz</text>
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-4 border border-teal-200 dark:border-teal-800">
        <h4 className="text-sm font-medium text-teal-700 dark:text-teal-300 mb-2">
          Effective Support
        </h4>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className={`p-2 rounded ${stiffness.kx > 0 ? 'bg-teal-100 dark:bg-teal-900/40' : 'bg-slate-100 dark:bg-slate-800'}`}>
            <span className={stiffness.kx > 0 ? 'text-teal-700 dark:text-teal-300' : 'text-slate-400'}>
              X: {stiffness.kx > 0 ? 'Elastic' : 'Free'}
            </span>
          </div>
          <div className={`p-2 rounded ${stiffness.ky > 0 ? 'bg-teal-100 dark:bg-teal-900/40' : 'bg-slate-100 dark:bg-slate-800'}`}>
            <span className={stiffness.ky > 0 ? 'text-teal-700 dark:text-teal-300' : 'text-slate-400'}>
              Y: {stiffness.ky > 0 ? 'Elastic' : 'Free'}
            </span>
          </div>
          <div className={`p-2 rounded ${stiffness.krz > 0 ? 'bg-teal-100 dark:bg-teal-900/40' : 'bg-slate-100 dark:bg-slate-800'}`}>
            <span className={stiffness.krz > 0 ? 'text-teal-700 dark:text-teal-300' : 'text-slate-400'}>
              Rz: {stiffness.krz > 0 ? 'Elastic' : 'Free'}
            </span>
          </div>
        </div>
      </div>

      {/* Apply Button */}
      <button
        onClick={handleApply}
        disabled={stiffness.kx === 0 && stiffness.ky === 0 && stiffness.krz === 0}
        className="w-full flex items-center justify-center gap-2 py-3 bg-structura-primary hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="material-symbols-outlined text-[20px]">check</span>
        Apply Spring Support
      </button>

      {/* Info */}
      <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <p className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[14px]">info</span>
          Use 0 for free DOF, very large values (~10⁹) for rigid
        </p>
      </div>
    </div>
  );
}

interface StiffnessInputProps {
  label: string;
  value: number;
  onChange: (value: string) => void;
  unit: string;
  icon: string;
}

function StiffnessInput({ label, value, onChange, unit, icon }: StiffnessInputProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
        <span className="material-symbols-outlined text-[16px] text-slate-500">{icon}</span>
      </div>
      <div className="flex-1">
        <label className="block text-xs text-slate-500 mb-1">{label}</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            min="0"
            step="1000"
            className="flex-1 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-structura-primary"
          />
          <span className="text-xs text-slate-400">{unit}</span>
        </div>
      </div>
    </div>
  );
}

interface SpringSymbolProps {
  x: number;
  y1: number;
  y2: number;
  horizontal: boolean;
}

function SpringSymbol({ x, y1, y2, horizontal }: SpringSymbolProps): React.JSX.Element {
  const _length = Math.abs(y2 - y1); // Used for reference
  void _length; // Suppress unused warning
  const coils = 4;
  const amplitude = 6;

  // Generate spring path
  let path = `M ${horizontal ? y1 : x} ${horizontal ? x : y1}`;

  for (let i = 0; i <= coils; i++) {
    const progress = i / coils;
    const yPos = y1 + progress * (y2 - y1);
    const xOffset = (i % 2 === 0 ? -1 : 1) * amplitude;

    if (horizontal) {
      path += ` L ${yPos} ${x + xOffset}`;
    } else {
      path += ` L ${x + xOffset} ${yPos}`;
    }
  }

  if (horizontal) {
    path += ` L ${y2} ${x}`;
  } else {
    path += ` L ${x} ${y2}`;
  }

  return (
    <path
      d={path}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="text-teal-500"
    />
  );
}
