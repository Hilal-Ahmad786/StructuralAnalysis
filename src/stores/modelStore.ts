/**
 * Structural Model Store
 * 
 * Zustand store for managing the structural model state.
 * Handles nodes, members, supports, loads, and UI state.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  Node,
  Member,
  Material,
  Section,
  Support,
  Load,
  LoadCase,
  LoadCombination,
  LoadCombinationFactor,
  StructuralModel,
  Units,
  SolverSettings,
  MemberType,
  SupportType,
} from '@/types';
import {
  DEFAULT_UNITS,
  DEFAULT_SOLVER_SETTINGS,
  DEFAULT_MATERIALS,
  DEFAULT_SECTIONS,
  createSupport,
} from '@/types/project';
import type { SolverResult, CombinationAnalysisResult } from '@/lib/solver';

// ============================================================================
// TYPES
// ============================================================================

export type EditorMode = 
  | 'select' 
  | 'pan' 
  | 'node' 
  | 'member' 
  | 'support' 
  | 'load';

export type SelectionType = 'node' | 'member' | 'support' | 'load';

export interface Selection {
  type: SelectionType;
  id: string;
}

export interface ViewState {
  zoom: number;
  panX: number;
  panY: number;
}

export interface CanvasSettings {
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
  showNodeLabels: boolean;
  showMemberLabels: boolean;
  showLoads: boolean;
  showSupports: boolean;
  showDeformed: boolean;
  deformationScale: number;
  showAxialDiagram: boolean;
  showShearDiagram: boolean;
  showMomentDiagram: boolean;
  diagramScale: number;
}

// History snapshot for undo/redo
interface HistorySnapshot {
  model: StructuralModel;
  loadCases: LoadCase[];
  loadCombinations: LoadCombination[];
}

export interface ModelStore {
  // Project metadata
  projectId: string | null;
  projectName: string;
  isDirty: boolean;
  
  // Model data
  model: StructuralModel;
  loadCases: LoadCase[];
  loadCombinations: LoadCombination[];
  activeLoadCaseId: string | null;
  
  // Undo/Redo history
  _history: {
    past: HistorySnapshot[];
    future: HistorySnapshot[];
  };
  
  // Settings
  units: Units;
  solverSettings: SolverSettings;
  
  // Analysis results
  analysisResult: SolverResult | null;
  combinationAnalysisResult: CombinationAnalysisResult | null;
  isAnalyzing: boolean;
  isAnalyzingCombinations: boolean;
  
  // UI State
  mode: EditorMode;
  selection: Selection[];
  hoveredEntity: Selection | null;
  view: ViewState;
  canvasSettings: CanvasSettings;
  
  // Member creation state
  pendingMemberStartNodeId: string | null;
  
  // Default properties for new elements
  defaultMemberType: MemberType;
  defaultMaterialId: string;
  defaultSectionId: string;
  defaultSupportType: SupportType;
  
  // Actions - Model
  setProjectName: (name: string) => void;
  markClean: () => void;
  resetModel: () => void;
  loadModel: (model: StructuralModel, loadCases: LoadCase[], loadCombinations?: LoadCombination[]) => void;
  
  // Actions - Nodes
  addNode: (x: number, y: number) => string;
  updateNode: (id: string, updates: Partial<Omit<Node, 'id'>>) => void;
  deleteNode: (id: string) => void;
  
  // Actions - Members
  addMember: (startNodeId: string, endNodeId: string, type?: MemberType) => string | null;
  updateMember: (id: string, updates: Partial<Omit<Member, 'id'>>) => void;
  deleteMember: (id: string) => void;
  
  // Actions - Materials & Sections
  addMaterial: (material: Omit<Material, 'id'>) => string;
  updateMaterial: (id: string, updates: Partial<Omit<Material, 'id'>>) => void;
  deleteMaterial: (id: string) => void;
  addSection: (section: Omit<Section, 'id'>) => string;
  updateSection: (id: string, updates: Partial<Omit<Section, 'id'>>) => void;
  deleteSection: (id: string) => void;
  
  // Actions - Supports
  addSupport: (nodeId: string, type: SupportType) => void;
  updateSupport: (nodeId: string, updates: Partial<Omit<Support, 'nodeId'>>) => void;
  deleteSupport: (nodeId: string) => void;
  
  // Actions - Loads
  addNodalLoad: (nodeId: string, fx?: number, fy?: number, mz?: number) => string;
  addMemberLoad: (memberId: string, w: number, direction: Load['direction'], wStart?: number, wEnd?: number) => string;
  addMemberPointLoad: (memberId: string, fy: number, position: number, direction: Load['direction']) => string;
  addMemberTemperatureLoad: (memberId: string, deltaT: number, gradT: number) => string;
  updateLoad: (loadCaseId: string, loadId: string, updates: Partial<Omit<Load, 'id'>>) => void;
  deleteLoad: (loadCaseId: string, loadId: string) => void;
  
  // Actions - Load Cases
  addLoadCase: (name: string, type: LoadCase['type']) => string;
  updateLoadCase: (id: string, updates: Partial<Omit<LoadCase, 'id' | 'loads'>>) => void;
  deleteLoadCase: (id: string) => void;
  setActiveLoadCase: (id: string) => void;

  // Actions - Load Combinations
  addLoadCombination: (name: string, code: string, factors: LoadCombinationFactor[]) => string;
  updateLoadCombination: (id: string, updates: Partial<Omit<LoadCombination, 'id'>>) => void;
  deleteLoadCombination: (id: string) => void;
  
  // Actions - Analysis
  setAnalysisResult: (result: SolverResult | null) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  clearAnalysisResult: () => void;
  setCombinationAnalysisResult: (result: CombinationAnalysisResult | null) => void;
  setIsAnalyzingCombinations: (analyzing: boolean) => void;
  clearCombinationAnalysisResult: () => void;
  
  // Actions - UI
  setMode: (mode: EditorMode) => void;
  select: (selection: Selection | Selection[]) => void;
  addToSelection: (selection: Selection) => void;
  removeFromSelection: (selection: Selection) => void;
  clearSelection: () => void;
  setHoveredEntity: (entity: Selection | null) => void;
  
  // Actions - View
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  resetView: () => void;
  fitToContent: () => void;
  
  // Actions - Canvas Settings
  updateCanvasSettings: (settings: Partial<CanvasSettings>) => void;

  // Actions - Solver Settings
  updateSolverSettings: (settings: Partial<SolverSettings>) => void;
  
  // Actions - Defaults
  setDefaultMemberType: (type: MemberType) => void;
  setDefaultMaterialId: (id: string) => void;
  setDefaultSectionId: (id: string) => void;
  setDefaultSupportType: (type: SupportType) => void;
  
  // Actions - Member Creation
  setPendingMemberStartNode: (nodeId: string | null) => void;
  
  // Actions - Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
  
  // Helpers
  getNodeById: (id: string) => Node | undefined;
  getMemberById: (id: string) => Member | undefined;
  getMaterialById: (id: string) => Material | undefined;
  getSectionById: (id: string) => Section | undefined;
  getSupportByNodeId: (nodeId: string) => Support | undefined;
  getActiveLoadCase: () => LoadCase | undefined;
  getSelectedNodes: () => Node[];
  getSelectedMembers: () => Member[];
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const DEFAULT_CANVAS_SETTINGS: CanvasSettings = {
  gridSize: 1, // 1 meter
  snapToGrid: true,
  showGrid: true,
  showNodeLabels: true,
  showMemberLabels: true,
  showLoads: true,
  showSupports: true,
  showDeformed: false,
  deformationScale: 100,
  showAxialDiagram: false,
  showShearDiagram: false,
  showMomentDiagram: false,
  diagramScale: 1,
};

const DEFAULT_VIEW: ViewState = {
  zoom: 50, // pixels per meter
  panX: 0,
  panY: 0,
};

function generateId(): string {
  return crypto.randomUUID().slice(0, 8);
}

function generateNodeId(existingNodes: Node[]): string {
  const maxNum = existingNodes.reduce((max, n) => {
    const match = n.id.match(/^N(\d+)$/);
    return match && match[1] ? Math.max(max, parseInt(match[1], 10)) : max;
  }, 0);
  return `N${String(maxNum + 1).padStart(4, '0')}`;
}

function generateMemberId(existingMembers: Member[]): string {
  const maxNum = existingMembers.reduce((max, m) => {
    const match = m.id.match(/^M(\d+)$/);
    return match && match[1] ? Math.max(max, parseInt(match[1], 10)) : max;
  }, 0);
  return `M${String(maxNum + 1).padStart(4, '0')}`;
}

// ============================================================================
// STORE
// ============================================================================

export const useModelStore = create<ModelStore>()(
  immer((set, get) => ({
    // Initial state
    projectId: null,
    projectName: 'Untitled Project',
    isDirty: false,
    
    model: {
      nodes: [],
      members: [],
      materials: [...DEFAULT_MATERIALS],
      sections: [...DEFAULT_SECTIONS],
      supports: [],
    },
    loadCases: [
      {
        id: generateId(),
        name: 'Dead Load',
        type: 'dead',
        loads: [],
      },
    ],
    loadCombinations: [],
    activeLoadCaseId: null,
    
    // Undo/Redo history
    _history: {
      past: [],
      future: [],
    },
    
    units: DEFAULT_UNITS,
    solverSettings: DEFAULT_SOLVER_SETTINGS,
    
    analysisResult: null,
    combinationAnalysisResult: null,
    isAnalyzing: false,
    isAnalyzingCombinations: false,

    mode: 'select',
    selection: [],
    hoveredEntity: null,
    view: DEFAULT_VIEW,
    canvasSettings: DEFAULT_CANVAS_SETTINGS,
    
    pendingMemberStartNodeId: null,
    
    defaultMemberType: 'frame',
    defaultMaterialId: 'steel-s235',
    defaultSectionId: 'ipe-200',
    defaultSupportType: 'pinned',
    
    // ========================================================================
    // MODEL ACTIONS
    // ========================================================================
    
    setProjectName: (name) => set((state) => {
      state.projectName = name;
      state.isDirty = true;
    }),
    
    markClean: () => set((state) => {
      state.isDirty = false;
    }),
    
    resetModel: () => set((state) => {
      // Save history before reset
      state._history.past.push({
        model: JSON.parse(JSON.stringify(state.model)),
        loadCases: JSON.parse(JSON.stringify(state.loadCases)),
        loadCombinations: JSON.parse(JSON.stringify(state.loadCombinations)),
      });
      state._history.future = [];
      // Limit history size
      if (state._history.past.length > 50) {
        state._history.past.shift();
      }
      
      state.model = {
        nodes: [],
        members: [],
        materials: [...DEFAULT_MATERIALS],
        sections: [...DEFAULT_SECTIONS],
        supports: [],
      };
      state.loadCases = [{
        id: generateId(),
        name: 'Dead Load',
        type: 'dead',
        loads: [],
      }];
      state.loadCombinations = [];
      state.activeLoadCaseId = null;
      state.analysisResult = null;
      state.selection = [];
      state.isDirty = false;
    }),

    loadModel: (model, loadCases, loadCombinations = []) => set((state) => {
      // Clear history on load
      state._history.past = [];
      state._history.future = [];
      
      state.model = model;
      state.loadCases = loadCases;
      state.loadCombinations = loadCombinations;
      state.activeLoadCaseId = loadCases[0]?.id ?? null;
      state.analysisResult = null;
      state.selection = [];
      state.isDirty = false;
    }),
    
    // ========================================================================
    // UNDO/REDO ACTIONS
    // ========================================================================
    
    undo: () => set((state) => {
      if (state._history.past.length === 0) return;
      
      const previous = state._history.past.pop()!;
      
      // Save current state to future
      state._history.future.push({
        model: JSON.parse(JSON.stringify(state.model)),
        loadCases: JSON.parse(JSON.stringify(state.loadCases)),
        loadCombinations: JSON.parse(JSON.stringify(state.loadCombinations)),
      });
      
      // Restore previous state
      state.model = previous.model;
      state.loadCases = previous.loadCases;
      state.loadCombinations = previous.loadCombinations;
      state.analysisResult = null;
      state.selection = [];
      state.isDirty = true;
    }),
    
    redo: () => set((state) => {
      if (state._history.future.length === 0) return;
      
      const next = state._history.future.pop()!;
      
      // Save current state to past
      state._history.past.push({
        model: JSON.parse(JSON.stringify(state.model)),
        loadCases: JSON.parse(JSON.stringify(state.loadCases)),
        loadCombinations: JSON.parse(JSON.stringify(state.loadCombinations)),
      });
      
      // Restore next state
      state.model = next.model;
      state.loadCases = next.loadCases;
      state.loadCombinations = next.loadCombinations;
      state.analysisResult = null;
      state.selection = [];
      state.isDirty = true;
    }),
    
    canUndo: () => get()._history.past.length > 0,
    
    canRedo: () => get()._history.future.length > 0,
    
    clearHistory: () => set((state) => {
      state._history.past = [];
      state._history.future = [];
    }),
    
    // ========================================================================
    // NODE ACTIONS
    // ========================================================================
    
    addNode: (x, y) => {
      const id = generateNodeId(get().model.nodes);
      set((state) => {
        // Save history
        state._history.past.push({
          model: JSON.parse(JSON.stringify(state.model)),
          loadCases: JSON.parse(JSON.stringify(state.loadCases)),
          loadCombinations: JSON.parse(JSON.stringify(state.loadCombinations)),
        });
        state._history.future = [];
        if (state._history.past.length > 50) state._history.past.shift();
        
        state.model.nodes.push({ id, x, y });
        state.isDirty = true;
        state.analysisResult = null;
      });
      return id;
    },
    
    updateNode: (id, updates) => set((state) => {
      const node = state.model.nodes.find((n) => n.id === id);
      if (node) {
        // Save history
        state._history.past.push({
          model: JSON.parse(JSON.stringify(state.model)),
          loadCases: JSON.parse(JSON.stringify(state.loadCases)),
          loadCombinations: JSON.parse(JSON.stringify(state.loadCombinations)),
        });
        state._history.future = [];
        if (state._history.past.length > 50) state._history.past.shift();
        
        Object.assign(node, updates);
        state.isDirty = true;
        state.analysisResult = null;
      }
    }),
    
    deleteNode: (id) => set((state) => {
      // Save history
      state._history.past.push({
        model: JSON.parse(JSON.stringify(state.model)),
        loadCases: JSON.parse(JSON.stringify(state.loadCases)),
        loadCombinations: JSON.parse(JSON.stringify(state.loadCombinations)),
      });
      state._history.future = [];
      if (state._history.past.length > 50) state._history.past.shift();
      
      // Remove node
      state.model.nodes = state.model.nodes.filter((n) => n.id !== id);
      // Remove connected members
      state.model.members = state.model.members.filter(
        (m) => m.startNodeId !== id && m.endNodeId !== id
      );
      // Remove support on this node
      state.model.supports = state.model.supports.filter((s) => s.nodeId !== id);
      // Remove loads on this node
      state.loadCases.forEach((lc) => {
        lc.loads = lc.loads.filter(
          (l) => !(l.target === 'node' && l.targetId === id)
        );
      });
      // Clear from selection
      state.selection = state.selection.filter(
        (s) => !(s.type === 'node' && s.id === id)
      );
      state.isDirty = true;
      state.analysisResult = null;
    }),
    
    // ========================================================================
    // MEMBER ACTIONS
    // ========================================================================
    
    addMember: (startNodeId, endNodeId, type) => {
      if (startNodeId === endNodeId) return null;

      // Check if member already exists
      const existing = get().model.members.find(
        (m) =>
          (m.startNodeId === startNodeId && m.endNodeId === endNodeId) ||
          (m.startNodeId === endNodeId && m.endNodeId === startNodeId)
      );
      if (existing) return null;

      const id = generateMemberId(get().model.members);
      const { defaultMemberType, defaultMaterialId, defaultSectionId } = get();

      set((state) => {
        // Save history
        state._history.past.push({
          model: JSON.parse(JSON.stringify(state.model)),
          loadCases: JSON.parse(JSON.stringify(state.loadCases)),
          loadCombinations: JSON.parse(JSON.stringify(state.loadCombinations)),
        });
        state._history.future = [];
        if (state._history.past.length > 50) state._history.past.shift();

        state.model.members.push({
          id,
          type: type ?? defaultMemberType,
          startNodeId,
          endNodeId,
          materialId: defaultMaterialId,
          sectionId: defaultSectionId,
        });
        state.isDirty = true;
        state.analysisResult = null;
      });
      return id;
    },
    
    updateMember: (id, updates) => set((state) => {
      const member = state.model.members.find((m) => m.id === id);
      if (member) {
        // Save history
        state._history.past.push({
          model: JSON.parse(JSON.stringify(state.model)),
          loadCases: JSON.parse(JSON.stringify(state.loadCases)),
          loadCombinations: JSON.parse(JSON.stringify(state.loadCombinations)),
        });
        state._history.future = [];
        if (state._history.past.length > 50) state._history.past.shift();
        
        Object.assign(member, updates);
        state.isDirty = true;
        state.analysisResult = null;
      }
    }),
    
    deleteMember: (id) => set((state) => {
      // Save history
      state._history.past.push({
        model: JSON.parse(JSON.stringify(state.model)),
        loadCases: JSON.parse(JSON.stringify(state.loadCases)),
        loadCombinations: JSON.parse(JSON.stringify(state.loadCombinations)),
      });
      state._history.future = [];
      if (state._history.past.length > 50) state._history.past.shift();
      
      state.model.members = state.model.members.filter((m) => m.id !== id);
      // Remove loads on this member
      state.loadCases.forEach((lc) => {
        lc.loads = lc.loads.filter(
          (l) => !(l.target === 'member' && l.targetId === id)
        );
      });
      state.selection = state.selection.filter(
        (s) => !(s.type === 'member' && s.id === id)
      );
      state.isDirty = true;
      state.analysisResult = null;
    }),
    
    // ========================================================================
    // MATERIAL & SECTION ACTIONS
    // ========================================================================
    
    addMaterial: (material) => {
      const id = `mat-${generateId()}`;
      set((state) => {
        state.model.materials.push({ id, ...material });
        state.isDirty = true;
      });
      return id;
    },
    
    updateMaterial: (id, updates) => set((state) => {
      const material = state.model.materials.find((m) => m.id === id);
      if (material) {
        Object.assign(material, updates);
        state.isDirty = true;
        state.analysisResult = null;
      }
    }),
    
    deleteMaterial: (id) => set((state) => {
      // Don't delete if in use
      const inUse = state.model.members.some((m) => m.materialId === id);
      if (!inUse) {
        state.model.materials = state.model.materials.filter((m) => m.id !== id);
        state.isDirty = true;
      }
    }),
    
    addSection: (section) => {
      const id = `sec-${generateId()}`;
      set((state) => {
        state.model.sections.push({ id, ...section });
        state.isDirty = true;
      });
      return id;
    },
    
    updateSection: (id, updates) => set((state) => {
      const section = state.model.sections.find((s) => s.id === id);
      if (section) {
        Object.assign(section, updates);
        state.isDirty = true;
        state.analysisResult = null;
      }
    }),
    
    deleteSection: (id) => set((state) => {
      const inUse = state.model.members.some((m) => m.sectionId === id);
      if (!inUse) {
        state.model.sections = state.model.sections.filter((s) => s.id !== id);
        state.isDirty = true;
      }
    }),
    
    // ========================================================================
    // SUPPORT ACTIONS
    // ========================================================================
    
    addSupport: (nodeId, type) => set((state) => {
      // Save history
      state._history.past.push({
        model: JSON.parse(JSON.stringify(state.model)),
        loadCases: JSON.parse(JSON.stringify(state.loadCases)),
        loadCombinations: JSON.parse(JSON.stringify(state.loadCombinations)),
      });
      state._history.future = [];
      if (state._history.past.length > 50) state._history.past.shift();
      
      // Remove existing support on this node
      state.model.supports = state.model.supports.filter((s) => s.nodeId !== nodeId);
      state.model.supports.push(createSupport(nodeId, type));
      state.isDirty = true;
      state.analysisResult = null;
    }),
    
    updateSupport: (nodeId, updates) => set((state) => {
      const support = state.model.supports.find((s) => s.nodeId === nodeId);
      if (support) {
        // Save history
        state._history.past.push({
          model: JSON.parse(JSON.stringify(state.model)),
          loadCases: JSON.parse(JSON.stringify(state.loadCases)),
          loadCombinations: JSON.parse(JSON.stringify(state.loadCombinations)),
        });
        state._history.future = [];
        if (state._history.past.length > 50) state._history.past.shift();
        
        Object.assign(support, updates);
        state.isDirty = true;
        state.analysisResult = null;
      }
    }),
    
    deleteSupport: (nodeId) => set((state) => {
      // Save history
      state._history.past.push({
        model: JSON.parse(JSON.stringify(state.model)),
        loadCases: JSON.parse(JSON.stringify(state.loadCases)),
        loadCombinations: JSON.parse(JSON.stringify(state.loadCombinations)),
      });
      state._history.future = [];
      if (state._history.past.length > 50) state._history.past.shift();
      
      state.model.supports = state.model.supports.filter((s) => s.nodeId !== nodeId);
      state.selection = state.selection.filter(
        (s) => !(s.type === 'support' && s.id === nodeId)
      );
      state.isDirty = true;
      state.analysisResult = null;
    }),
    
    // ========================================================================
    // LOAD ACTIONS
    // ========================================================================
    
    addNodalLoad: (nodeId, fx = 0, fy = 0, mz = 0) => {
      const activeCase = get().getActiveLoadCase();
      if (!activeCase) return '';
      
      const id = `L${generateId()}`;
      set((state) => {
        // Save history
        state._history.past.push({
          model: JSON.parse(JSON.stringify(state.model)),
          loadCases: JSON.parse(JSON.stringify(state.loadCases)),
          loadCombinations: JSON.parse(JSON.stringify(state.loadCombinations)),
        });
        state._history.future = [];
        if (state._history.past.length > 50) state._history.past.shift();
        
        const lc = state.loadCases.find((c) => c.id === activeCase.id);
        if (lc) {
          lc.loads.push({
            id,
            type: 'point',
            target: 'node',
            targetId: nodeId,
            fx,
            fy,
            mz,
          });
        }
        state.isDirty = true;
        state.analysisResult = null;
      });
      return id;
    },
    
    addMemberLoad: (memberId, w, direction = 'globalNegY', wStart, wEnd) => {
      const activeCase = get().getActiveLoadCase();
      if (!activeCase) return '';

      const id = `L${generateId()}`;
      set((state) => {
        // Save history
        state._history.past.push({
          model: JSON.parse(JSON.stringify(state.model)),
          loadCases: JSON.parse(JSON.stringify(state.loadCases)),
          loadCombinations: JSON.parse(JSON.stringify(state.loadCombinations)),
        });
        state._history.future = [];
        if (state._history.past.length > 50) state._history.past.shift();

        const lc = state.loadCases.find((c) => c.id === activeCase.id);
        if (lc) {
          const load: Load = {
            id,
            type: 'distributed',
            target: 'member',
            targetId: memberId,
            direction,
          };
          // If wStart and wEnd are provided, use trapezoidal load
          if (wStart !== undefined && wEnd !== undefined) {
            load.wStart = wStart;
            load.wEnd = wEnd;
          } else {
            load.w = w;
          }
          lc.loads.push(load);
        }
        state.isDirty = true;
        state.analysisResult = null;
      });
      return id;
    },

    addMemberPointLoad: (memberId, fy, position = 0.5, direction = 'globalNegY') => {
      const activeCase = get().getActiveLoadCase();
      if (!activeCase) return '';

      const id = `L${generateId()}`;
      set((state) => {
        // Save history
        state._history.past.push({
          model: JSON.parse(JSON.stringify(state.model)),
          loadCases: JSON.parse(JSON.stringify(state.loadCases)),
          loadCombinations: JSON.parse(JSON.stringify(state.loadCombinations)),
        });
        state._history.future = [];
        if (state._history.past.length > 50) state._history.past.shift();

        const lc = state.loadCases.find((c) => c.id === activeCase.id);
        if (lc) {
          lc.loads.push({
            id,
            type: 'point',
            target: 'member',
            targetId: memberId,
            fy,
            position,
            direction,
          });
        }
        state.isDirty = true;
        state.analysisResult = null;
      });
      return id;
    },

    addMemberTemperatureLoad: (memberId, deltaT = 0, gradT = 0) => {
      const activeCase = get().getActiveLoadCase();
      if (!activeCase) return '';

      const id = `L${generateId()}`;
      set((state) => {
        // Save history
        state._history.past.push({
          model: JSON.parse(JSON.stringify(state.model)),
          loadCases: JSON.parse(JSON.stringify(state.loadCases)),
          loadCombinations: JSON.parse(JSON.stringify(state.loadCombinations)),
        });
        state._history.future = [];
        if (state._history.past.length > 50) state._history.past.shift();

        const lc = state.loadCases.find((c) => c.id === activeCase.id);
        if (lc) {
          lc.loads.push({
            id,
            type: 'temperature',
            target: 'member',
            targetId: memberId,
            deltaT,
            gradT,
          });
        }
        state.isDirty = true;
        state.analysisResult = null;
      });
      return id;
    },

    updateLoad: (loadCaseId, loadId, updates) => set((state) => {
      const lc = state.loadCases.find((c) => c.id === loadCaseId);
      if (lc) {
        const load = lc.loads.find((l) => l.id === loadId);
        if (load) {
          // Save history
          state._history.past.push({
            model: JSON.parse(JSON.stringify(state.model)),
            loadCases: JSON.parse(JSON.stringify(state.loadCases)),
            loadCombinations: JSON.parse(JSON.stringify(state.loadCombinations)),
          });
          state._history.future = [];
          if (state._history.past.length > 50) state._history.past.shift();

          Object.assign(load, updates);
          state.isDirty = true;
          state.analysisResult = null;
        }
      }
    }),

    deleteLoad: (loadCaseId, loadId) => set((state) => {
      const lc = state.loadCases.find((c) => c.id === loadCaseId);
      if (lc) {
        // Save history
        state._history.past.push({
          model: JSON.parse(JSON.stringify(state.model)),
          loadCases: JSON.parse(JSON.stringify(state.loadCases)),
          loadCombinations: JSON.parse(JSON.stringify(state.loadCombinations)),
        });
        state._history.future = [];
        if (state._history.past.length > 50) state._history.past.shift();
        
        lc.loads = lc.loads.filter((l) => l.id !== loadId);
        state.selection = state.selection.filter(
          (s) => !(s.type === 'load' && s.id === loadId)
        );
        state.isDirty = true;
        state.analysisResult = null;
      }
    }),
    
    // ========================================================================
    // LOAD CASE ACTIONS
    // ========================================================================
    
    addLoadCase: (name, type) => {
      const id = generateId();
      set((state) => {
        state.loadCases.push({ id, name, type, loads: [] });
        state.activeLoadCaseId = id;
        state.isDirty = true;
      });
      return id;
    },
    
    updateLoadCase: (id, updates) => set((state) => {
      const lc = state.loadCases.find((c) => c.id === id);
      if (lc) {
        Object.assign(lc, updates);
        state.isDirty = true;
      }
    }),
    
    deleteLoadCase: (id) => set((state) => {
      if (state.loadCases.length <= 1) return; // Keep at least one
      state.loadCases = state.loadCases.filter((c) => c.id !== id);
      if (state.activeLoadCaseId === id) {
        state.activeLoadCaseId = state.loadCases[0]?.id ?? null;
      }
      state.isDirty = true;
      state.analysisResult = null;
    }),
    
    setActiveLoadCase: (id) => set((state) => {
      state.activeLoadCaseId = id;
    }),

    // ========================================================================
    // LOAD COMBINATION ACTIONS
    // ========================================================================

    addLoadCombination: (name, code, factors) => {
      const id = generateId();
      set((state) => {
        state.loadCombinations.push({
          id,
          name,
          code,
          factors,
        });
        state.isDirty = true;
      });
      return id;
    },

    updateLoadCombination: (id, updates) => set((state) => {
      const combination = state.loadCombinations.find((c) => c.id === id);
      if (combination) {
        Object.assign(combination, updates);
        state.isDirty = true;
      }
    }),

    deleteLoadCombination: (id) => set((state) => {
      state.loadCombinations = state.loadCombinations.filter((c) => c.id !== id);
      state.isDirty = true;
    }),

    // ========================================================================
    // ANALYSIS ACTIONS
    // ========================================================================
    
    setAnalysisResult: (result) => set((state) => {
      state.analysisResult = result;
    }),
    
    setIsAnalyzing: (analyzing) => set((state) => {
      state.isAnalyzing = analyzing;
    }),
    
    clearAnalysisResult: () => set((state) => {
      state.analysisResult = null;
    }),

    setCombinationAnalysisResult: (result) => set((state) => {
      state.combinationAnalysisResult = result;
    }),

    setIsAnalyzingCombinations: (analyzing) => set((state) => {
      state.isAnalyzingCombinations = analyzing;
    }),

    clearCombinationAnalysisResult: () => set((state) => {
      state.combinationAnalysisResult = null;
    }),

    // ========================================================================
    // UI ACTIONS
    // ========================================================================
    
    setMode: (mode) => set((state) => {
      state.mode = mode;
      state.pendingMemberStartNodeId = null;
      if (mode !== 'select') {
        state.selection = [];
      }
    }),
    
    select: (selection) => set((state) => {
      state.selection = Array.isArray(selection) ? selection : [selection];
    }),
    
    addToSelection: (selection) => set((state) => {
      const exists = state.selection.some(
        (s) => s.type === selection.type && s.id === selection.id
      );
      if (!exists) {
        state.selection.push(selection);
      }
    }),
    
    removeFromSelection: (selection) => set((state) => {
      state.selection = state.selection.filter(
        (s) => !(s.type === selection.type && s.id === selection.id)
      );
    }),
    
    clearSelection: () => set((state) => {
      state.selection = [];
    }),
    
    setHoveredEntity: (entity) => set((state) => {
      state.hoveredEntity = entity;
    }),
    
    // ========================================================================
    // VIEW ACTIONS
    // ========================================================================
    
    setZoom: (zoom) => set((state) => {
      state.view.zoom = Math.max(5, Math.min(500, zoom));
    }),
    
    setPan: (x, y) => set((state) => {
      state.view.panX = x;
      state.view.panY = y;
    }),
    
    resetView: () => set((state) => {
      state.view = DEFAULT_VIEW;
    }),
    
    fitToContent: () => {
      const { nodes } = get().model;
      if (nodes.length === 0) {
        set((state) => {
          state.view = DEFAULT_VIEW;
        });
        return;
      }
      
      const xs = nodes.map((n) => n.x);
      const ys = nodes.map((n) => n.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      
      const width = maxX - minX || 10;
      const height = maxY - minY || 10;
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      
      // Assume canvas is ~800x600, fit with 20% margin
      const zoom = Math.min(600 / width, 400 / height) * 0.8;
      
      set((state) => {
        state.view.zoom = Math.max(10, Math.min(200, zoom));
        state.view.panX = -centerX * state.view.zoom + 400;
        state.view.panY = centerY * state.view.zoom + 300;
      });
    },
    
    // ========================================================================
    // CANVAS SETTINGS
    // ========================================================================
    
    updateCanvasSettings: (settings) => set((state) => {
      Object.assign(state.canvasSettings, settings);
    }),

    // ========================================================================
    // SOLVER SETTINGS
    // ========================================================================

    updateSolverSettings: (settings) => set((state) => {
      Object.assign(state.solverSettings, settings);
    }),

    // ========================================================================
    // DEFAULTS
    // ========================================================================
    
    setDefaultMemberType: (type) => set((state) => {
      state.defaultMemberType = type;
    }),
    
    setDefaultMaterialId: (id) => set((state) => {
      state.defaultMaterialId = id;
    }),
    
    setDefaultSectionId: (id) => set((state) => {
      state.defaultSectionId = id;
    }),
    
    setDefaultSupportType: (type) => set((state) => {
      state.defaultSupportType = type;
    }),
    
    setPendingMemberStartNode: (nodeId) => set((state) => {
      state.pendingMemberStartNodeId = nodeId;
    }),
    
    // ========================================================================
    // HELPERS
    // ========================================================================
    
    getNodeById: (id) => get().model.nodes.find((n) => n.id === id),
    getMemberById: (id) => get().model.members.find((m) => m.id === id),
    getMaterialById: (id) => get().model.materials.find((m) => m.id === id),
    getSectionById: (id) => get().model.sections.find((s) => s.id === id),
    getSupportByNodeId: (nodeId) => get().model.supports.find((s) => s.nodeId === nodeId),
    
    getActiveLoadCase: () => {
      const { loadCases, activeLoadCaseId } = get();
      if (activeLoadCaseId) {
        return loadCases.find((c) => c.id === activeLoadCaseId);
      }
      return loadCases[0];
    },
    
    getSelectedNodes: () => {
      const { selection, model } = get();
      return selection
        .filter((s) => s.type === 'node')
        .map((s) => model.nodes.find((n) => n.id === s.id))
        .filter((n): n is Node => n !== undefined);
    },
    
    getSelectedMembers: () => {
      const { selection, model } = get();
      return selection
        .filter((s) => s.type === 'member')
        .map((s) => model.members.find((m) => m.id === s.id))
        .filter((m): m is Member => m !== undefined);
    },
  }))
);

// Initialize active load case
const initialState = useModelStore.getState();
if (!initialState.activeLoadCaseId && initialState.loadCases.length > 0) {
  useModelStore.setState({ activeLoadCaseId: initialState.loadCases[0]!.id });
}
