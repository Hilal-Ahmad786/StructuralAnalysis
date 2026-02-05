/**
 * Solver Web Worker
 * 
 * Runs structural analysis in a background thread to keep UI responsive.
 * Uses comlink for typed async communication.
 */

import * as Comlink from 'comlink';
import { solve } from '@/lib/solver';
import type { StructuralModel, LoadCase } from '@/types';
import type { SolverResult } from '@/lib/solver';

export interface SolverWorkerApi {
  solve: (model: StructuralModel, loadCase: LoadCase) => SolverResult;
  ping: () => string;
}

const workerApi: SolverWorkerApi = {
  /**
   * Run structural analysis
   */
  solve(model: StructuralModel, loadCase: LoadCase): SolverResult {
    return solve(model, loadCase);
  },
  
  /**
   * Health check
   */
  ping(): string {
    return 'pong';
  }
};

Comlink.expose(workerApi);
