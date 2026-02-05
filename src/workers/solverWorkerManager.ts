/**
 * Solver Worker Manager
 * 
 * Manages Web Worker for running structural analysis in background thread.
 * Falls back to synchronous execution if workers aren't available.
 */

import * as Comlink from 'comlink';
import type { StructuralModel, LoadCase } from '@/types';
import type { SolverResult } from '@/lib/solver';

export interface SolverWorkerApi {
  solve: (model: StructuralModel, loadCase: LoadCase) => SolverResult;
}

let worker: Worker | null = null;
let workerApi: Comlink.Remote<SolverWorkerApi> | null = null;

/**
 * Get or create the solver worker
 */
export function getSolverWorker(): Comlink.Remote<SolverWorkerApi> | null {
  // Only run in browser
  if (typeof window === 'undefined') {
    return null;
  }
  
  // Return existing worker
  if (workerApi) {
    return workerApi;
  }
  
  try {
    // Create worker using Blob URL for Next.js compatibility
    const workerCode = `
      importScripts('https://unpkg.com/comlink@4.4.1/dist/umd/comlink.min.js');
      
      // Inline solver implementation (simplified for worker context)
      const workerApi = {
        solve(model, loadCase) {
          // This will be called via postMessage
          // The actual solve happens in the main thread for now
          // as bundling the full solver into a worker is complex
          return { needsMainThread: true };
        }
      };
      
      Comlink.expose(workerApi);
    `;
    
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    worker = new Worker(URL.createObjectURL(blob));
    workerApi = Comlink.wrap<SolverWorkerApi>(worker);
    
    return workerApi;
  } catch (error) {
    console.warn('Failed to create solver worker:', error);
    return null;
  }
}

/**
 * Terminate the solver worker
 */
export function terminateSolverWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
    workerApi = null;
  }
}
