/**
 * Toolbar - Mode selection and quick actions
 *
 * Updated with Structura Design System using Material Symbols.
 */

'use client';

import React from 'react';
import { useModelStore } from '@/stores/modelStore';
import type { SupportType, MemberType } from '@/types';

interface ToolButtonProps {
  active: boolean;
  onClick: () => void;
  title: string;
  shortcut?: string;
  icon: string;
  label: string;
}

function ToolButton({ active, onClick, title, shortcut, icon, label }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      title={shortcut ? `${title} (${shortcut})` : title}
      className={`
        w-12 h-12 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all duration-150
        ${
          active
            ? 'bg-structura-primary text-white shadow-lg shadow-structura-primary/30'
            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white'
        }
      `}
    >
      <span className="material-symbols-outlined text-[22px]">{icon}</span>
      <span className="text-[9px] font-medium leading-tight">{label}</span>
    </button>
  );
}

function Divider() {
  return <div className="w-8 h-px bg-slate-200 dark:bg-slate-700 my-1" />;
}

export function Toolbar() {
  const {
    mode,
    setMode,
    defaultMemberType,
    setDefaultMemberType,
    defaultSupportType,
    setDefaultSupportType,
    analysisResult,
    canvasSettings,
    updateCanvasSettings,
  } = useModelStore();

  return (
    <>
      {/* Primary Tools */}
      <ToolButton
        active={mode === 'select'}
        onClick={() => setMode('select')}
        title="Select"
        shortcut="V"
        icon="arrow_selector_tool"
        label="Select"
      />

      <ToolButton
        active={mode === 'pan'}
        onClick={() => setMode('pan')}
        title="Pan"
        shortcut="Space"
        icon="pan_tool"
        label="Pan"
      />

      <Divider />

      {/* Modeling Tools */}
      <ToolButton
        active={mode === 'node'}
        onClick={() => setMode('node')}
        title="Add Node"
        shortcut="N"
        icon="radio_button_unchecked"
        label="Node"
      />

      <ToolButton
        active={mode === 'member'}
        onClick={() => setMode('member')}
        title="Add Member"
        shortcut="M"
        icon="segment"
        label="Member"
      />

      <ToolButton
        active={mode === 'support'}
        onClick={() => setMode('support')}
        title="Add Support"
        shortcut="S"
        icon="vertical_align_bottom"
        label="Support"
      />

      <ToolButton
        active={mode === 'load'}
        onClick={() => setMode('load')}
        title="Add Load"
        shortcut="L"
        icon="arrow_downward"
        label="Load"
      />

      <Divider />

      {/* Type Selector (conditional) */}
      {mode === 'member' && (
        <div className="w-12 flex flex-col items-center">
          <select
            value={defaultMemberType}
            onChange={(e) => setDefaultMemberType(e.target.value as MemberType)}
            className="w-10 text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded px-1 py-1 border border-slate-200 dark:border-slate-700"
          >
            <option value="frame">Frame</option>
            <option value="truss">Truss</option>
          </select>
        </div>
      )}

      {mode === 'support' && (
        <div className="w-12 flex flex-col items-center">
          <select
            value={defaultSupportType}
            onChange={(e) => setDefaultSupportType(e.target.value as SupportType)}
            className="w-10 text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded px-1 py-1 border border-slate-200 dark:border-slate-700"
          >
            <option value="fixed">Fix</option>
            <option value="pinned">Pin</option>
            <option value="rollerX">R-X</option>
            <option value="rollerY">R-Y</option>
          </select>
        </div>
      )}

      {/* Display Toggles */}
      <div className="mt-auto flex flex-col items-center gap-1">
        <ToggleButton
          active={canvasSettings.showGrid}
          onClick={() => updateCanvasSettings({ showGrid: !canvasSettings.showGrid })}
          title="Toggle Grid"
          icon="grid_4x4"
        />

        <ToggleButton
          active={canvasSettings.snapToGrid}
          onClick={() => updateCanvasSettings({ snapToGrid: !canvasSettings.snapToGrid })}
          title="Snap to Grid"
          icon="grid_goldenratio"
        />

        <ToggleButton
          active={canvasSettings.showNodeLabels}
          onClick={() => updateCanvasSettings({ showNodeLabels: !canvasSettings.showNodeLabels })}
          title="Node Labels"
          icon="label"
        />

        {/* Results Display (only if analyzed) */}
        {analysisResult?.success && (
          <>
            <Divider />
            <ToggleButton
              active={canvasSettings.showDeformed}
              onClick={() => updateCanvasSettings({ showDeformed: !canvasSettings.showDeformed })}
              title="Deformed Shape"
              icon="ssid_chart"
            />

            <ToggleButton
              active={canvasSettings.showMomentDiagram}
              onClick={() =>
                updateCanvasSettings({ showMomentDiagram: !canvasSettings.showMomentDiagram })
              }
              title="Moment Diagram"
              icon="M"
              isText
            />

            <ToggleButton
              active={canvasSettings.showShearDiagram}
              onClick={() =>
                updateCanvasSettings({ showShearDiagram: !canvasSettings.showShearDiagram })
              }
              title="Shear Diagram"
              icon="V"
              isText
            />

            <ToggleButton
              active={canvasSettings.showAxialDiagram}
              onClick={() =>
                updateCanvasSettings({ showAxialDiagram: !canvasSettings.showAxialDiagram })
              }
              title="Axial Diagram"
              icon="N"
              isText
            />
          </>
        )}
      </div>
    </>
  );
}

// Toggle button variant
interface ToggleButtonProps {
  active: boolean;
  onClick: () => void;
  title: string;
  icon: string;
  isText?: boolean;
}

function ToggleButton({ active, onClick, title, icon, isText }: ToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-150
        ${
          active
            ? 'bg-structura-primary/10 text-structura-primary'
            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }
      `}
    >
      {isText ? (
        <span className="text-sm font-bold">{icon}</span>
      ) : (
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      )}
    </button>
  );
}
