/**
 * SettingsClient - Structura Design
 *
 * Client component for settings page.
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface SettingsClientProps {
  user: {
    id: string;
    email: string;
    createdAt: string;
  };
}

type UnitSystem = 'si' | 'imperial';
type Theme = 'dark' | 'light' | 'system';

interface UserPreferences {
  unitSystem: UnitSystem;
  theme: Theme;
  autoSave: boolean;
  autoSaveInterval: number;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  showTutorials: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  unitSystem: 'si',
  theme: 'light',
  autoSave: true,
  autoSaveInterval: 30,
  showGrid: true,
  snapToGrid: true,
  gridSize: 1,
  showTutorials: true,
};

export function SettingsClient({ user }: SettingsClientProps) {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('userPreferences');
      if (saved) {
        try {
          return { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
        } catch {
          // Ignore parse errors
        }
      }
    }
    return DEFAULT_PREFERENCES;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'account' | 'units' | 'editor' | 'appearance'>(
    'account'
  );

  const handleChange = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const savePreferences = () => {
    setIsSaving(true);

    // Save to localStorage
    localStorage.setItem('userPreferences', JSON.stringify(preferences));

    setTimeout(() => {
      setIsSaving(false);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    }, 300);
  };

  const resetPreferences = () => {
    if (confirm('Reset all settings to default values?')) {
      setPreferences(DEFAULT_PREFERENCES);
      localStorage.setItem('userPreferences', JSON.stringify(DEFAULT_PREFERENCES));
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: 'person' },
    { id: 'units', label: 'Units', icon: 'straighten' },
    { id: 'editor', label: 'Editor', icon: 'edit' },
    { id: 'appearance', label: 'Appearance', icon: 'palette' },
  ] as const;

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-card-dark border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Back to dashboard"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-structura-primary/10 rounded-lg flex items-center justify-center text-structura-primary">
                  <span className="material-symbols-outlined text-[20px]">settings</span>
                </div>
                <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Settings</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {showSaved && (
                <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  Saved
                </span>
              )}
              <button
                onClick={savePreferences}
                disabled={isSaving}
                className="px-5 py-2 bg-structura-primary hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-blue-500/20"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <nav className="lg:w-56 flex-shrink-0">
            <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 rounded-xl p-2 lg:sticky lg:top-24">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-structura-primary/10 text-structura-primary'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Account Section */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Account Information
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Manage your account details
                    </p>
                  </div>
                  <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    <div className="px-6 py-4">
                      <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Email Address
                      </label>
                      <p className="text-slate-900 dark:text-white font-medium">{user.email}</p>
                    </div>
                    <div className="px-6 py-4">
                      <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Member Since
                      </label>
                      <p className="text-slate-900 dark:text-white">
                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="px-6 py-4">
                      <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Account ID
                      </label>
                      <p className="text-slate-500 dark:text-slate-400 font-mono text-sm">
                        {user.id}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sign Out */}
                <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-white">Sign Out</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Sign out from your account on this device
                      </p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Units Section */}
            {activeTab === 'units' && (
              <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Unit System
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Choose your preferred measurement system
                  </p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleChange('unitSystem', 'si')}
                      className={`relative p-5 rounded-xl border-2 text-left transition-all ${
                        preferences.unitSystem === 'si'
                          ? 'border-structura-primary bg-structura-primary/5'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {preferences.unitSystem === 'si' && (
                        <div className="absolute top-3 right-3 w-6 h-6 bg-structura-primary rounded-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-white text-[16px]">
                            check
                          </span>
                        </div>
                      )}
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-structura-primary text-[24px]">
                          straighten
                        </span>
                      </div>
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                        SI (Metric)
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        kN, m, kPa, °C
                      </p>
                    </button>
                    <button
                      onClick={() => handleChange('unitSystem', 'imperial')}
                      className={`relative p-5 rounded-xl border-2 text-left transition-all ${
                        preferences.unitSystem === 'imperial'
                          ? 'border-structura-primary bg-structura-primary/5'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {preferences.unitSystem === 'imperial' && (
                        <div className="absolute top-3 right-3 w-6 h-6 bg-structura-primary rounded-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-white text-[16px]">
                            check
                          </span>
                        </div>
                      )}
                      <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[24px]">
                          square_foot
                        </span>
                      </div>
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Imperial</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        kip, ft, ksi, °F
                      </p>
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
                    Units can be changed per-project. This sets the default for new projects.
                  </p>
                </div>
              </div>
            )}

            {/* Editor Section */}
            {activeTab === 'editor' && (
              <div className="space-y-6">
                {/* Auto-save */}
                <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Auto-save
                    </h2>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-white">
                          Enable Auto-save
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          Automatically save changes while editing
                        </p>
                      </div>
                      <Toggle
                        checked={preferences.autoSave}
                        onChange={(checked) => handleChange('autoSave', checked)}
                      />
                    </div>
                    {preferences.autoSave && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Save interval
                        </label>
                        <select
                          value={preferences.autoSaveInterval}
                          onChange={(e) => handleChange('autoSaveInterval', Number(e.target.value))}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm focus:border-structura-primary focus:ring-2 focus:ring-structura-primary/20 focus:outline-none"
                        >
                          <option value={15}>15 seconds</option>
                          <option value={30}>30 seconds</option>
                          <option value={60}>1 minute</option>
                          <option value={120}>2 minutes</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Grid Settings */}
                <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Grid Settings
                    </h2>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-white">Show Grid</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          Display grid lines in the editor
                        </p>
                      </div>
                      <Toggle
                        checked={preferences.showGrid}
                        onChange={(checked) => handleChange('showGrid', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-white">Snap to Grid</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          Automatically align nodes to grid
                        </p>
                      </div>
                      <Toggle
                        checked={preferences.snapToGrid}
                        onChange={(checked) => handleChange('snapToGrid', checked)}
                      />
                    </div>
                    {preferences.showGrid && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Grid size ({preferences.unitSystem === 'si' ? 'm' : 'ft'})
                        </label>
                        <select
                          value={preferences.gridSize}
                          onChange={(e) => handleChange('gridSize', Number(e.target.value))}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm focus:border-structura-primary focus:ring-2 focus:ring-structura-primary/20 focus:outline-none"
                        >
                          <option value={0.5}>0.5</option>
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                          <option value={5}>5</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tutorials */}
                <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-white">Show Tutorials</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Display helpful tips for new users
                      </p>
                    </div>
                    <Toggle
                      checked={preferences.showTutorials}
                      onChange={(checked) => handleChange('showTutorials', checked)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Section */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Theme</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Choose your preferred color scheme
                    </p>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-3 gap-4">
                      <ThemeOption
                        label="Light"
                        value="light"
                        selected={preferences.theme === 'light'}
                        onClick={() => handleChange('theme', 'light')}
                        icon="light_mode"
                      />
                      <ThemeOption
                        label="Dark"
                        value="dark"
                        selected={preferences.theme === 'dark'}
                        onClick={() => handleChange('theme', 'dark')}
                        icon="dark_mode"
                      />
                      <ThemeOption
                        label="System"
                        value="system"
                        selected={preferences.theme === 'system'}
                        onClick={() => handleChange('theme', 'system')}
                        icon="computer"
                      />
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-white dark:bg-card-dark border border-red-200 dark:border-red-900/50 rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20">
                    <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
                      Danger Zone
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-white">
                          Reset Settings
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          Restore all settings to their default values
                        </p>
                      </div>
                      <button
                        onClick={resetPreferences}
                        className="px-4 py-2.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg border border-red-200 dark:border-red-800 transition-colors"
                      >
                        Reset All
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function Toggle({ checked, onChange, disabled = false }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        ${checked ? 'bg-structura-primary' : 'bg-slate-200 dark:bg-slate-700'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform
          ${checked ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );
}

interface ThemeOptionProps {
  label: string;
  value: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  icon: string;
}

function ThemeOption({ label, selected, onClick, disabled, icon }: ThemeOptionProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 text-sm transition-all
        ${
          selected
            ? 'border-structura-primary bg-structura-primary/5'
            : disabled
              ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 opacity-50 cursor-not-allowed'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
        }
      `}
    >
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-structura-primary rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-[14px]">check</span>
        </div>
      )}
      <span
        className={`material-symbols-outlined text-[28px] ${selected ? 'text-structura-primary' : 'text-slate-400 dark:text-slate-500'}`}
      >
        {icon}
      </span>
      <span
        className={`font-medium ${selected ? 'text-structura-primary' : 'text-slate-700 dark:text-slate-300'}`}
      >
        {label}
      </span>
    </button>
  );
}
