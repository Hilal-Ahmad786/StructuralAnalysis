/**
 * Unsaved Changes Warning
 *
 * Warns user before leaving page with unsaved changes.
 */

'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { useModelStore } from '@/stores/modelStore';

export function UnsavedChangesWarning() {
  const { isDirty } = useModelStore();

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent): void => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return null;
}

// Modal version for in-app navigation
interface UnsavedChangesModalProps {
  isOpen: boolean;
  onStay: () => void;
  onLeave: () => void;
  onSaveAndLeave?: () => void;
}

export function UnsavedChangesModal({ isOpen, onStay, onLeave, onSaveAndLeave }: UnsavedChangesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onStay} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-card-dark rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full overflow-hidden">
        {/* Icon */}
        <div className="pt-8 pb-4 flex justify-center">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px] text-amber-600 dark:text-amber-400">
              warning
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 text-center">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Unsaved Changes
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            You have unsaved changes that will be lost if you leave this page.
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex flex-col gap-3">
          {onSaveAndLeave && (
            <button
              onClick={onSaveAndLeave}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-structura-primary hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              Save and Leave
            </button>
          )}
          <button
            onClick={onLeave}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">exit_to_app</span>
            Leave Without Saving
          </button>
          <button
            onClick={onStay}
            className="w-full px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 font-medium rounded-xl transition-colors"
          >
            Stay on Page
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook for handling navigation with unsaved changes
export function useUnsavedChangesGuard() {
  const { isDirty } = useModelStore();
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  const guardNavigation = useCallback((navigate: () => void) => {
    if (isDirty) {
      setPendingNavigation(() => navigate);
      return false;
    }
    navigate();
    return true;
  }, [isDirty]);

  const confirmLeave = useCallback(() => {
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  }, [pendingNavigation]);

  const cancelLeave = useCallback(() => {
    setPendingNavigation(null);
  }, []);

  return {
    showWarning: pendingNavigation !== null,
    guardNavigation,
    confirmLeave,
    cancelLeave,
  };
}
