/**
 * LoadDialog - Modal for adding/editing point loads and distributed loads
 *
 * Updated with Structura Design System.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useModelStore } from '@/stores/modelStore';
import type { Load, LoadDirection } from '@/types';

interface LoadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  target: { type: 'node' | 'member'; id: string } | null;
  existingLoad?: Load | null;
}

export function LoadDialog({ isOpen, onClose, target, existingLoad }: LoadDialogProps) {
  const { addNodalLoad, addMemberLoad, addMemberPointLoad, addMemberTemperatureLoad, updateLoad, deleteLoad, loadCases, activeLoadCaseId } =
    useModelStore();

  // Point load state (for nodes)
  const [fx, setFx] = useState(0);
  const [fy, setFy] = useState(-10);
  const [mz, setMz] = useState(0);

  // Distributed load state (for members)
  const [w, setW] = useState(10);
  const [direction, setDirection] = useState<LoadDirection>('globalNegY');
  const [isTrapezoidal, setIsTrapezoidal] = useState(false);
  const [wStart, setWStart] = useState(10);
  const [wEnd, setWEnd] = useState(5);

  // Member load category: 'distributed', 'point', or 'temperature'
  const [memberLoadCategory, setMemberLoadCategory] = useState<'distributed' | 'point' | 'temperature'>('distributed');

  // Point load on member state
  const [memberPointFy, setMemberPointFy] = useState(-10);
  const [memberPointPosition, setMemberPointPosition] = useState(0.5);

  // Temperature load state
  const [deltaT, setDeltaT] = useState(0);
  const [gradT, setGradT] = useState(0);

  // Initialize from existing load
  useEffect(() => {
    if (existingLoad) {
      if (existingLoad.target === 'node') {
        setFx(existingLoad.fx ?? 0);
        setFy(existingLoad.fy ?? 0);
        setMz(existingLoad.mz ?? 0);
      } else if (existingLoad.target === 'member') {
        setDirection(existingLoad.direction ?? 'globalNegY');
        if (existingLoad.type === 'point') {
          // Point load on member
          setMemberLoadCategory('point');
          setMemberPointFy(existingLoad.fy ?? -10);
          setMemberPointPosition(existingLoad.position ?? 0.5);
        } else if (existingLoad.type === 'temperature') {
          // Temperature load
          setMemberLoadCategory('temperature');
          setDeltaT(existingLoad.deltaT ?? 0);
          setGradT(existingLoad.gradT ?? 0);
        } else {
          // Distributed load
          setMemberLoadCategory('distributed');
          setW(existingLoad.w ?? 10);
          // Check if trapezoidal
          if (existingLoad.wStart !== undefined && existingLoad.wEnd !== undefined) {
            setIsTrapezoidal(true);
            setWStart(existingLoad.wStart);
            setWEnd(existingLoad.wEnd);
          } else {
            setIsTrapezoidal(false);
            setWStart(10);
            setWEnd(5);
          }
        }
      }
    } else {
      // Reset to defaults
      setFx(0);
      setFy(-10);
      setMz(0);
      setW(10);
      setDirection('globalNegY');
      setIsTrapezoidal(false);
      setWStart(10);
      setWEnd(5);
      setMemberLoadCategory('distributed');
      setMemberPointFy(-10);
      setMemberPointPosition(0.5);
      setDeltaT(0);
      setGradT(0);
    }
  }, [existingLoad, isOpen]);

  const activeLoadCase = loadCases.find((lc) => lc.id === activeLoadCaseId) ?? loadCases[0];

  const handleApply = () => {
    if (!target || !activeLoadCase) return;

    if (existingLoad) {
      // Update existing load
      if (target.type === 'node') {
        updateLoad(activeLoadCase.id, existingLoad.id, { fx, fy, mz });
      } else {
        if (memberLoadCategory === 'point') {
          updateLoad(activeLoadCase.id, existingLoad.id, {
            type: 'point',
            fy: memberPointFy,
            position: memberPointPosition,
            direction,
            w: undefined,
            wStart: undefined,
            wEnd: undefined,
            deltaT: undefined,
            gradT: undefined
          });
        } else if (memberLoadCategory === 'temperature') {
          updateLoad(activeLoadCase.id, existingLoad.id, {
            type: 'temperature',
            deltaT,
            gradT,
            w: undefined,
            wStart: undefined,
            wEnd: undefined,
            fy: undefined,
            position: undefined,
            direction: undefined
          });
        } else if (isTrapezoidal) {
          updateLoad(activeLoadCase.id, existingLoad.id, {
            type: 'distributed',
            w: undefined,
            wStart,
            wEnd,
            direction,
            fy: undefined,
            position: undefined,
            deltaT: undefined,
            gradT: undefined
          });
        } else {
          updateLoad(activeLoadCase.id, existingLoad.id, {
            type: 'distributed',
            w,
            wStart: undefined,
            wEnd: undefined,
            direction,
            fy: undefined,
            position: undefined,
            deltaT: undefined,
            gradT: undefined
          });
        }
      }
    } else {
      // Create new load
      if (target.type === 'node') {
        addNodalLoad(target.id, fx, fy, mz);
      } else {
        if (memberLoadCategory === 'point') {
          addMemberPointLoad(target.id, memberPointFy, memberPointPosition, direction);
        } else if (memberLoadCategory === 'temperature') {
          addMemberTemperatureLoad(target.id, deltaT, gradT);
        } else if (isTrapezoidal) {
          addMemberLoad(target.id, 0, direction, wStart, wEnd);
        } else {
          addMemberLoad(target.id, w, direction);
        }
      }
    }

    onClose();
  };

  const handleDelete = () => {
    if (!existingLoad || !activeLoadCase) return;
    deleteLoad(activeLoadCase.id, existingLoad.id);
    onClose();
  };

  if (!isOpen || !target) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-card-dark rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-structura-primary/10 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px] text-structura-primary">
                {target.type === 'node' ? 'arrow_downward' : 'straighten'}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {existingLoad ? 'Edit Load' : 'Add Load'}
              </h3>
              <p className="text-xs text-slate-500">
                {target.type === 'node'
                  ? 'Point Load'
                  : memberLoadCategory === 'point'
                  ? 'Point Load on Member'
                  : memberLoadCategory === 'temperature'
                  ? 'Temperature Load'
                  : 'Distributed Load'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5">
          {target.type === 'node' ? (
            <PointLoadForm fx={fx} setFx={setFx} fy={fy} setFy={setFy} mz={mz} setMz={setMz} />
          ) : (
            <MemberLoadForm
              memberLoadCategory={memberLoadCategory}
              setMemberLoadCategory={setMemberLoadCategory}
              w={w}
              setW={setW}
              direction={direction}
              setDirection={setDirection}
              isTrapezoidal={isTrapezoidal}
              setIsTrapezoidal={setIsTrapezoidal}
              wStart={wStart}
              setWStart={setWStart}
              wEnd={wEnd}
              setWEnd={setWEnd}
              memberPointFy={memberPointFy}
              setMemberPointFy={setMemberPointFy}
              memberPointPosition={memberPointPosition}
              setMemberPointPosition={setMemberPointPosition}
              deltaT={deltaT}
              setDeltaT={setDeltaT}
              gradT={gradT}
              setGradT={setGradT}
            />
          )}

          {/* Target Info */}
          <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span className="material-symbols-outlined text-[16px] text-slate-400">
                {target.type === 'node' ? 'radio_button_unchecked' : 'segment'}
              </span>
              Target: <span className="font-medium text-slate-900 dark:text-white">{target.type === 'node' ? 'Node' : 'Member'} {target.id}</span>
            </div>
            {activeLoadCase && (
              <>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">folder</span>
                  <span className="font-medium text-slate-900 dark:text-white">{activeLoadCase.name}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div>
            {existingLoad && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-structura-primary hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">
                {existingLoad ? 'save' : 'add'}
              </span>
              {existingLoad ? 'Update' : 'Add Load'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PointLoadFormProps {
  fx: number;
  setFx: (v: number) => void;
  fy: number;
  setFy: (v: number) => void;
  mz: number;
  setMz: (v: number) => void;
}

function PointLoadForm({ fx, setFx, fy, setFy, mz, setMz }: PointLoadFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300 mb-2">
          <span className="font-medium">Fx (kN)</span>
          <span className="text-slate-400 text-xs">positive = right</span>
        </label>
        <input
          type="number"
          value={fx}
          onChange={(e) => setFx(parseFloat(e.target.value) || 0)}
          step="1"
          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-structura-primary focus:border-transparent transition-shadow"
        />
      </div>

      <div>
        <label className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300 mb-2">
          <span className="font-medium">Fy (kN)</span>
          <span className="text-slate-400 text-xs">negative = downward</span>
        </label>
        <input
          type="number"
          value={fy}
          onChange={(e) => setFy(parseFloat(e.target.value) || 0)}
          step="1"
          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-structura-primary focus:border-transparent transition-shadow"
        />
      </div>

      <div>
        <label className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300 mb-2">
          <span className="font-medium">Mz (kN·m)</span>
          <span className="text-slate-400 text-xs">positive = CCW</span>
        </label>
        <input
          type="number"
          value={mz}
          onChange={(e) => setMz(parseFloat(e.target.value) || 0)}
          step="1"
          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-structura-primary focus:border-transparent transition-shadow"
        />
      </div>

      {/* Quick presets */}
      <div className="pt-2">
        <p className="text-xs text-slate-500 mb-2">Quick presets:</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setFx(0);
              setFy(-10);
              setMz(0);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">south</span>
            10 kN
          </button>
          <button
            onClick={() => {
              setFx(10);
              setFy(0);
              setMz(0);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">east</span>
            10 kN
          </button>
          <button
            onClick={() => {
              setFx(0);
              setFy(0);
              setMz(10);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">rotate_left</span>
            10 kN·m
          </button>
        </div>
      </div>
    </div>
  );
}

interface MemberLoadFormProps {
  memberLoadCategory: 'distributed' | 'point' | 'temperature';
  setMemberLoadCategory: (v: 'distributed' | 'point' | 'temperature') => void;
  w: number;
  setW: (v: number) => void;
  direction: LoadDirection;
  setDirection: (v: LoadDirection) => void;
  isTrapezoidal: boolean;
  setIsTrapezoidal: (v: boolean) => void;
  wStart: number;
  setWStart: (v: number) => void;
  wEnd: number;
  setWEnd: (v: number) => void;
  memberPointFy: number;
  setMemberPointFy: (v: number) => void;
  memberPointPosition: number;
  setMemberPointPosition: (v: number) => void;
  deltaT: number;
  setDeltaT: (v: number) => void;
  gradT: number;
  setGradT: (v: number) => void;
}

function MemberLoadForm({
  memberLoadCategory,
  setMemberLoadCategory,
  w,
  setW,
  direction,
  setDirection,
  isTrapezoidal,
  setIsTrapezoidal,
  wStart,
  setWStart,
  wEnd,
  setWEnd,
  memberPointFy,
  setMemberPointFy,
  memberPointPosition,
  setMemberPointPosition,
  deltaT,
  setDeltaT,
  gradT,
  setGradT
}: MemberLoadFormProps) {
  return (
    <div className="space-y-4">
      {/* Load Category Toggle */}
      <div>
        <label className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300 mb-2">
          <span className="font-medium">Load Category</span>
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setMemberLoadCategory('distributed')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg border transition-colors ${
              memberLoadCategory === 'distributed'
                ? 'bg-structura-primary text-white border-structura-primary'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Distributed
          </button>
          <button
            onClick={() => setMemberLoadCategory('point')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg border transition-colors ${
              memberLoadCategory === 'point'
                ? 'bg-structura-primary text-white border-structura-primary'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Point
          </button>
          <button
            onClick={() => setMemberLoadCategory('temperature')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg border transition-colors ${
              memberLoadCategory === 'temperature'
                ? 'bg-structura-primary text-white border-structura-primary'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Thermal
          </button>
        </div>
      </div>

      {memberLoadCategory === 'distributed' ? (
        <DistributedLoadSubForm
          w={w}
          setW={setW}
          direction={direction}
          setDirection={setDirection}
          isTrapezoidal={isTrapezoidal}
          setIsTrapezoidal={setIsTrapezoidal}
          wStart={wStart}
          setWStart={setWStart}
          wEnd={wEnd}
          setWEnd={setWEnd}
        />
      ) : memberLoadCategory === 'point' ? (
        <MemberPointLoadForm
          memberPointFy={memberPointFy}
          setMemberPointFy={setMemberPointFy}
          memberPointPosition={memberPointPosition}
          setMemberPointPosition={setMemberPointPosition}
          direction={direction}
          setDirection={setDirection}
        />
      ) : (
        <TemperatureLoadForm
          deltaT={deltaT}
          setDeltaT={setDeltaT}
          gradT={gradT}
          setGradT={setGradT}
        />
      )}
    </div>
  );
}

interface TemperatureLoadFormProps {
  deltaT: number;
  setDeltaT: (v: number) => void;
  gradT: number;
  setGradT: (v: number) => void;
}

function TemperatureLoadForm({
  deltaT,
  setDeltaT,
  gradT,
  setGradT
}: TemperatureLoadFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300 mb-2">
          <span className="font-medium">Uniform Temperature Change (°C)</span>
          <span className="text-slate-400 text-xs">positive = heating</span>
        </label>
        <input
          type="number"
          value={deltaT}
          onChange={(e) => setDeltaT(parseFloat(e.target.value) || 0)}
          step="5"
          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-structura-primary focus:border-transparent transition-shadow"
        />
      </div>

      <div>
        <label className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300 mb-2">
          <span className="font-medium">Temperature Gradient (°C)</span>
          <span className="text-slate-400 text-xs">top - bottom</span>
        </label>
        <input
          type="number"
          value={gradT}
          onChange={(e) => setGradT(parseFloat(e.target.value) || 0)}
          step="5"
          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-structura-primary focus:border-transparent transition-shadow"
        />
        <p className="text-xs text-slate-400 mt-1">
          Positive = top hotter (causes concave-up bending)
        </p>
      </div>

      {/* Info box */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          <strong>Note:</strong> Temperature loads require the material to have a thermal
          expansion coefficient (α) defined. Gradient effects require section depth (h).
        </p>
      </div>

      {/* Quick presets */}
      <div className="pt-2">
        <p className="text-xs text-slate-500 mb-2">Quick presets:</p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => {
              setDeltaT(30);
              setGradT(0);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">thermostat</span>
            +30°C uniform
          </button>
          <button
            onClick={() => {
              setDeltaT(-20);
              setGradT(0);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">ac_unit</span>
            -20°C uniform
          </button>
          <button
            onClick={() => {
              setDeltaT(0);
              setGradT(15);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">gradient</span>
            +15°C gradient
          </button>
        </div>
      </div>
    </div>
  );
}

interface MemberPointLoadFormProps {
  memberPointFy: number;
  setMemberPointFy: (v: number) => void;
  memberPointPosition: number;
  setMemberPointPosition: (v: number) => void;
  direction: LoadDirection;
  setDirection: (v: LoadDirection) => void;
}

function MemberPointLoadForm({
  memberPointFy,
  setMemberPointFy,
  memberPointPosition,
  setMemberPointPosition,
  direction,
  setDirection
}: MemberPointLoadFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300 mb-2">
          <span className="font-medium">Load Magnitude (kN)</span>
          <span className="text-slate-400 text-xs">negative = downward</span>
        </label>
        <input
          type="number"
          value={memberPointFy}
          onChange={(e) => setMemberPointFy(parseFloat(e.target.value) || 0)}
          step="1"
          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-structura-primary focus:border-transparent transition-shadow"
        />
      </div>

      <div>
        <label className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300 mb-2">
          <span className="font-medium">Position Along Member</span>
          <span className="text-slate-400 text-xs">{(memberPointPosition * 100).toFixed(0)}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={memberPointPosition}
          onChange={(e) => setMemberPointPosition(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-structura-primary"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>Start (0%)</span>
          <span>Midpoint (50%)</span>
          <span>End (100%)</span>
        </div>
      </div>

      <div>
        <label className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300 mb-2">
          <span className="font-medium">Direction</span>
        </label>
        <select
          value={direction}
          onChange={(e) => setDirection(e.target.value as LoadDirection)}
          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-structura-primary focus:border-transparent transition-shadow"
        >
          <option value="globalNegY">Global -Y (Gravity)</option>
          <option value="globalPosY">Global +Y (Uplift)</option>
          <option value="globalNegX">Global -X</option>
          <option value="globalPosX">Global +X</option>
          <option value="localNegY">Local -Y (Perpendicular)</option>
          <option value="localPosY">Local +Y (Perpendicular)</option>
        </select>
      </div>

      {/* Quick presets */}
      <div className="pt-2">
        <p className="text-xs text-slate-500 mb-2">Quick presets:</p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => {
              setMemberPointFy(-10);
              setMemberPointPosition(0.5);
              setDirection('globalNegY');
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">south</span>
            10 kN @ 50%
          </button>
          <button
            onClick={() => {
              setMemberPointFy(-20);
              setMemberPointPosition(0.5);
              setDirection('globalNegY');
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">south</span>
            20 kN @ 50%
          </button>
          <button
            onClick={() => {
              setMemberPointFy(-10);
              setMemberPointPosition(0.33);
              setDirection('globalNegY');
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">south</span>
            10 kN @ L/3
          </button>
        </div>
      </div>
    </div>
  );
}

interface DistributedLoadSubFormProps {
  w: number;
  setW: (v: number) => void;
  direction: LoadDirection;
  setDirection: (v: LoadDirection) => void;
  isTrapezoidal: boolean;
  setIsTrapezoidal: (v: boolean) => void;
  wStart: number;
  setWStart: (v: number) => void;
  wEnd: number;
  setWEnd: (v: number) => void;
}

function DistributedLoadSubForm({
  w,
  setW,
  direction,
  setDirection,
  isTrapezoidal,
  setIsTrapezoidal,
  wStart,
  setWStart,
  wEnd,
  setWEnd
}: DistributedLoadSubFormProps) {
  return (
    <div className="space-y-4">
      {/* Load Type Toggle */}
      <div>
        <label className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300 mb-2">
          <span className="font-medium">Load Type</span>
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setIsTrapezoidal(false)}
            className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg border transition-colors ${
              !isTrapezoidal
                ? 'bg-structura-primary text-white border-structura-primary'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Uniform (UDL)
          </button>
          <button
            onClick={() => setIsTrapezoidal(true)}
            className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg border transition-colors ${
              isTrapezoidal
                ? 'bg-structura-primary text-white border-structura-primary'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Trapezoidal
          </button>
        </div>
      </div>

      {/* Load Intensity */}
      {isTrapezoidal ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300 mb-2">
              <span className="font-medium">w₁ at Start (kN/m)</span>
            </label>
            <input
              type="number"
              value={wStart}
              onChange={(e) => setWStart(parseFloat(e.target.value) || 0)}
              step="1"
              className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-structura-primary focus:border-transparent transition-shadow"
            />
          </div>
          <div>
            <label className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300 mb-2">
              <span className="font-medium">w₂ at End (kN/m)</span>
            </label>
            <input
              type="number"
              value={wEnd}
              onChange={(e) => setWEnd(parseFloat(e.target.value) || 0)}
              step="1"
              className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-structura-primary focus:border-transparent transition-shadow"
            />
          </div>
        </div>
      ) : (
        <div>
          <label className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300 mb-2">
            <span className="font-medium">Load Intensity (kN/m)</span>
          </label>
          <input
            type="number"
            value={w}
            onChange={(e) => setW(parseFloat(e.target.value) || 0)}
            step="1"
            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-structura-primary focus:border-transparent transition-shadow"
          />
        </div>
      )}

      <div>
        <label className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300 mb-2">
          <span className="font-medium">Direction</span>
        </label>
        <select
          value={direction}
          onChange={(e) => setDirection(e.target.value as LoadDirection)}
          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-structura-primary focus:border-transparent transition-shadow"
        >
          <option value="globalNegY">Global -Y (Gravity)</option>
          <option value="globalPosY">Global +Y (Uplift)</option>
          <option value="globalNegX">Global -X</option>
          <option value="globalPosX">Global +X</option>
          <option value="localNegY">Local -Y (Perpendicular)</option>
          <option value="localPosY">Local +Y (Perpendicular)</option>
        </select>
      </div>

      {/* Quick presets */}
      <div className="pt-2">
        <p className="text-xs text-slate-500 mb-2">Quick presets:</p>
        <div className="flex gap-2 flex-wrap">
          {isTrapezoidal ? (
            <>
              <button
                onClick={() => {
                  setWStart(10);
                  setWEnd(0);
                  setDirection('globalNegY');
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">south</span>
                Triangular (10→0)
              </button>
              <button
                onClick={() => {
                  setWStart(0);
                  setWEnd(10);
                  setDirection('globalNegY');
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">south</span>
                Triangular (0→10)
              </button>
              <button
                onClick={() => {
                  setWStart(10);
                  setWEnd(5);
                  setDirection('globalNegY');
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">south</span>
                Trapezoidal (10→5)
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setW(5);
                  setDirection('globalNegY');
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">south</span>
                5 kN/m
              </button>
              <button
                onClick={() => {
                  setW(10);
                  setDirection('globalNegY');
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">south</span>
                10 kN/m
              </button>
              <button
                onClick={() => {
                  setW(20);
                  setDirection('globalNegY');
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">south</span>
                20 kN/m
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
