/**
 * Member Releases Panel
 *
 * Configure member end releases (hinges) for frame members.
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useModelStore } from '@/stores/modelStore';

interface ReleaseConfig {
  startAxial: boolean;
  startShear: boolean;
  startMoment: boolean;
  endAxial: boolean;
  endShear: boolean;
  endMoment: boolean;
}

const DEFAULT_RELEASES: ReleaseConfig = {
  startAxial: false,
  startShear: false,
  startMoment: false,
  endAxial: false,
  endShear: false,
  endMoment: false,
};

export function MemberReleasesPanel(): React.JSX.Element {
  const { model, selection } = useModelStore();

  // Get selected member
  const selectedMember = useMemo(() => {
    const memberSelection = selection.find((s) => s.type === 'member');
    if (!memberSelection) return null;
    return model.members.find((m) => m.id === memberSelection.id);
  }, [selection, model.members]);

  // Get current release configuration
  const currentReleases: ReleaseConfig = useMemo(() => {
    if (!selectedMember) return DEFAULT_RELEASES;

    // In a full implementation, releases would be stored on the member
    // For now, we'll use a simplified approach
    return DEFAULT_RELEASES;
  }, [selectedMember]);

  const [releases, setReleases] = useState<ReleaseConfig>(currentReleases);

  const toggleRelease = useCallback((key: keyof ReleaseConfig) => {
    setReleases((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const applyPreset = useCallback((preset: 'fixed' | 'pinned-pinned' | 'fixed-pinned' | 'pinned-fixed') => {
    switch (preset) {
      case 'fixed':
        setReleases({
          startAxial: false,
          startShear: false,
          startMoment: false,
          endAxial: false,
          endShear: false,
          endMoment: false,
        });
        break;
      case 'pinned-pinned':
        setReleases({
          startAxial: false,
          startShear: false,
          startMoment: true,
          endAxial: false,
          endShear: false,
          endMoment: true,
        });
        break;
      case 'fixed-pinned':
        setReleases({
          startAxial: false,
          startShear: false,
          startMoment: false,
          endAxial: false,
          endShear: false,
          endMoment: true,
        });
        break;
      case 'pinned-fixed':
        setReleases({
          startAxial: false,
          startShear: false,
          startMoment: true,
          endAxial: false,
          endShear: false,
          endMoment: false,
        });
        break;
    }
  }, []);

  const handleApply = useCallback(() => {
    if (!selectedMember) return;

    // In a full implementation, this would update the member with release info
    // updateMember(selectedMember.id, { releases: releases });

    // For now, show confirmation
    alert('Member releases would be applied. This feature requires solver updates.');
  }, [selectedMember, releases]);

  if (!selectedMember) {
    return (
      <div className="p-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 text-center border border-blue-200 dark:border-blue-800">
          <span className="material-symbols-outlined text-[32px] text-blue-400 mb-2 block">
            link_off
          </span>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
            Select a member
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            Click on a member to configure end releases
          </p>
        </div>
      </div>
    );
  }

  if (selectedMember.type === 'truss') {
    return (
      <div className="p-4">
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[20px] text-amber-500">warning</span>
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                Truss Member
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Truss members are already pin-ended and cannot have moment releases.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-[20px] text-orange-500">
            link_off
          </span>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Member Releases</h3>
          <p className="text-xs text-slate-500">Member: {selectedMember.id}</p>
        </div>
      </div>

      {/* Presets */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
          Quick Presets
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => applyPreset('fixed')}
            className="flex items-center gap-2 p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-structura-primary transition-colors"
          >
            <ReleaseIcon startMoment={false} endMoment={false} />
            <span>Fixed-Fixed</span>
          </button>
          <button
            onClick={() => applyPreset('pinned-pinned')}
            className="flex items-center gap-2 p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-structura-primary transition-colors"
          >
            <ReleaseIcon startMoment={true} endMoment={true} />
            <span>Pinned-Pinned</span>
          </button>
          <button
            onClick={() => applyPreset('fixed-pinned')}
            className="flex items-center gap-2 p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-structura-primary transition-colors"
          >
            <ReleaseIcon startMoment={false} endMoment={true} />
            <span>Fixed-Pinned</span>
          </button>
          <button
            onClick={() => applyPreset('pinned-fixed')}
            className="flex items-center gap-2 p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-structura-primary transition-colors"
          >
            <ReleaseIcon startMoment={true} endMoment={false} />
            <span>Pinned-Fixed</span>
          </button>
        </div>
      </div>

      {/* Release Configuration */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Start Node (i)
        </h4>
        <div className="grid grid-cols-3 gap-2">
          <ReleaseToggle
            label="Axial"
            icon="arrow_forward"
            released={releases.startAxial}
            onToggle={() => toggleRelease('startAxial')}
          />
          <ReleaseToggle
            label="Shear"
            icon="swap_vert"
            released={releases.startShear}
            onToggle={() => toggleRelease('startShear')}
          />
          <ReleaseToggle
            label="Moment"
            icon="rotate_right"
            released={releases.startMoment}
            onToggle={() => toggleRelease('startMoment')}
          />
        </div>

        <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider pt-2">
          End Node (j)
        </h4>
        <div className="grid grid-cols-3 gap-2">
          <ReleaseToggle
            label="Axial"
            icon="arrow_forward"
            released={releases.endAxial}
            onToggle={() => toggleRelease('endAxial')}
          />
          <ReleaseToggle
            label="Shear"
            icon="swap_vert"
            released={releases.endShear}
            onToggle={() => toggleRelease('endShear')}
          />
          <ReleaseToggle
            label="Moment"
            icon="rotate_right"
            released={releases.endMoment}
            onToggle={() => toggleRelease('endMoment')}
          />
        </div>
      </div>

      {/* Visual Preview */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
          Preview
        </h4>
        <div className="flex items-center justify-center p-4">
          <svg width="200" height="60" viewBox="0 0 200 60">
            {/* Member line */}
            <line x1="30" y1="30" x2="170" y2="30" stroke="currentColor" strokeWidth="3" className="text-slate-400" />

            {/* Start node */}
            <circle cx="30" cy="30" r="8" fill={releases.startMoment ? 'transparent' : 'currentColor'} stroke="currentColor" strokeWidth="2" className="text-structura-primary" />
            {releases.startMoment && (
              <circle cx="30" cy="30" r="3" fill="currentColor" className="text-structura-primary" />
            )}

            {/* End node */}
            <circle cx="170" cy="30" r="8" fill={releases.endMoment ? 'transparent' : 'currentColor'} stroke="currentColor" strokeWidth="2" className="text-structura-primary" />
            {releases.endMoment && (
              <circle cx="170" cy="30" r="3" fill="currentColor" className="text-structura-primary" />
            )}

            {/* Labels */}
            <text x="30" y="55" textAnchor="middle" className="text-[10px] fill-slate-500">Start (i)</text>
            <text x="170" y="55" textAnchor="middle" className="text-[10px] fill-slate-500">End (j)</text>
          </svg>
        </div>
        <p className="text-xs text-center text-slate-500">
          Filled circle = fixed, Ring = released (hinge)
        </p>
      </div>

      {/* Apply Button */}
      <button
        onClick={handleApply}
        className="w-full flex items-center justify-center gap-2 py-3 bg-structura-primary hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
      >
        <span className="material-symbols-outlined text-[20px]">check</span>
        Apply Releases
      </button>

      {/* Info */}
      <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <p className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[14px]">info</span>
          Moment release creates a hinge (internal pin)
        </p>
      </div>
    </div>
  );
}

interface ReleaseToggleProps {
  label: string;
  icon: string;
  released: boolean;
  onToggle: () => void;
}

function ReleaseToggle({ label, icon, released, onToggle }: ReleaseToggleProps): React.JSX.Element {
  return (
    <button
      onClick={onToggle}
      className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors ${
        released
          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
          : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300'
      }`}
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
      <span className="text-[10px]">{released ? 'Released' : 'Fixed'}</span>
    </button>
  );
}

interface ReleaseIconProps {
  startMoment: boolean;
  endMoment: boolean;
}

function ReleaseIcon({ startMoment, endMoment }: ReleaseIconProps): React.JSX.Element {
  return (
    <svg width="40" height="20" viewBox="0 0 40 20">
      <line x1="5" y1="10" x2="35" y2="10" stroke="currentColor" strokeWidth="2" className="text-slate-400" />
      <circle cx="5" cy="10" r="4" fill={startMoment ? 'transparent' : 'currentColor'} stroke="currentColor" strokeWidth="1.5" className="text-structura-primary" />
      <circle cx="35" cy="10" r="4" fill={endMoment ? 'transparent' : 'currentColor'} stroke="currentColor" strokeWidth="1.5" className="text-structura-primary" />
    </svg>
  );
}
