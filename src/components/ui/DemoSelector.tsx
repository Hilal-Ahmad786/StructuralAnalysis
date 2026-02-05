/**
 * DemoSelector - Quick load demo scenes for testing
 *
 * Updated with Structura Design System.
 */

'use client';

import React from 'react';
import { useModelStore } from '@/stores/modelStore';
import { demoScenes, type DemoScene } from '@/lib/demos/scenes';

export function DemoSelector() {
  const { loadModel, setProjectName, clearAnalysisResult, fitToContent } = useModelStore();

  const handleLoadDemo = (demo: DemoScene) => {
    loadModel(demo.model, demo.loadCases);
    setProjectName(demo.name);
    clearAnalysisResult();
    // Fit view after a short delay to allow state to update
    setTimeout(() => {
      fitToContent();
    }, 100);
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px] text-structura-primary">
          play_circle
        </span>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Demo Scenes</h3>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Load a pre-built model to explore:
      </p>

      <div className="space-y-2">
        {demoScenes.map((demo) => (
          <button
            key={demo.name}
            onClick={() => handleLoadDemo(demo)}
            className="w-full text-left p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-structura-primary/50 rounded-xl transition-all group"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-structura-primary transition-colors">
                architecture
              </span>
              <span className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-structura-primary transition-colors">
                {demo.name}
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-6">
              {demo.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
