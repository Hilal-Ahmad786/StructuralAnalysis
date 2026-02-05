# Structura - Structural Analysis Web Application
## Complete Architecture, Blueprint & Context Document

**Version:** 1.0.0  
**Last Updated:** January 2026  
**Status:** MVP Complete - Production Ready

---

# Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Overview](#2-project-overview)
3. [Technical Architecture](#3-technical-architecture)
4. [Data Models & Types](#4-data-models--types)
5. [Solver Engine](#5-solver-engine)
6. [File Structure](#6-file-structure)
7. [API Reference](#7-api-reference)
8. [Component Architecture](#8-component-architecture)
9. [State Management](#9-state-management)
10. [Database Schema](#10-database-schema)
11. [Authentication & Security](#11-authentication--security)
12. [Development Guide](#12-development-guide)
13. [Testing Strategy](#13-testing-strategy)
14. [Deployment](#14-deployment)
15. [Decision Log](#15-decision-log)
16. [Acceptance Criteria](#16-acceptance-criteria)

---

# 1. Executive Summary

Structura is a browser-based 2D structural analysis application for civil/structural engineers. It enables creation, analysis, and reporting of frame and truss structures using the direct stiffness method.

## Key Capabilities

- **Modeling:** Create nodes, members (frame/truss), supports, materials, sections
- **Loading:** Point loads, distributed loads, multiple load cases
- **Analysis:** Direct stiffness method with Cholesky/LU factorization
- **Results:** Reactions, displacements, internal forces, diagrams (V, M, N, δ)
- **Reporting:** HTML reports with print-to-PDF
- **Collaboration:** Shareable read-only links

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| Canvas | react-konva |
| State | Zustand + immer |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Testing | Vitest + Testing Library |
| CI/CD | GitHub Actions + Vercel |

---

# 2. Project Overview

## 2.1 Problem Statement

Structural engineers need accessible tools for quick structural analysis without expensive desktop software licenses. Existing web solutions lack the rigor needed for professional use.

## 2.2 Solution

A web-based application that provides:
- Professional-grade structural analysis
- Intuitive visual modeling interface
- Comprehensive validation and error detection
- Shareable results and reports

## 2.3 Target Users

- Structural engineers
- Civil engineering students
- Architects needing quick structural checks
- Engineering consultants

## 2.4 Core Workflows

```
1. Create Project → 2. Model Structure → 3. Apply Loads → 4. Analyze → 5. Review Results → 6. Generate Report
```

---

# 3. Technical Architecture

## 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Canvas    │  │   Panels    │  │      Web Worker         │ │
│  │ (Konva.js)  │  │ (React UI)  │  │   (Solver Engine)       │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
│         │                │                      │               │
│         └────────────────┼──────────────────────┘               │
│                          │                                      │
│                   ┌──────▼──────┐                               │
│                   │   Zustand   │                               │
│                   │    Store    │                               │
│                   └──────┬──────┘                               │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │  Next.js    │
                    │  API Routes │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──────┐ ┌───▼───┐ ┌─────▼─────┐
       │  Supabase   │ │  RLS  │ │  Storage  │
       │  Database   │ │       │ │  (Files)  │
       └─────────────┘ └───────┘ └───────────┘
```

## 3.2 Request Flow

```
User Action
    │
    ▼
Canvas/UI Component
    │
    ▼
Zustand Store (state update)
    │
    ├──► Local State Update (immediate)
    │
    └──► Auto-save (debounced 30s)
              │
              ▼
         API Route (/api/projects)
              │
              ▼
         Supabase (with RLS)
```

## 3.3 Analysis Flow

```
User clicks "Analyze"
    │
    ▼
Pre-validation (lib/validation)
    │
    ├── Errors? → Show validation panel
    │
    └── Valid? → Continue
              │
              ▼
         Web Worker spawned
              │
              ▼
         Solver Engine (lib/solver)
              │
              ├── Build DOF Map
              ├── Assemble K matrix
              ├── Apply boundary conditions
              ├── Solve: Cholesky → LU fallback
              ├── Post-process results
              └── Stability checks
              │
              ▼
         Results → Zustand Store
              │
              ▼
         UI Updates (diagrams, tables)
```

---

# 4. Data Models & Types

## 4.1 Core Types (src/types/project.ts)

### Node
```typescript
interface Node {
  id: string;
  x: number;  // meters (canonical)
  y: number;  // meters (canonical)
  label?: string;
}
```

### Member
```typescript
type MemberType = 'frame' | 'truss';

interface Member {
  id: string;
  type: MemberType;
  startNodeId: string;
  endNodeId: string;
  materialId: string;
  sectionId: string;
  label?: string;
}
```

### Material
```typescript
interface Material {
  id: string;
  name: string;
  E: number;       // kPa (Young's modulus)
  density?: number; // kg/m³
}
```

### Section
```typescript
interface Section {
  id: string;
  name: string;
  A: number;  // m² (cross-sectional area)
  I: number;  // m⁴ (moment of inertia)
}
```

### Support
```typescript
type SupportType = 'fixed' | 'pinned' | 'rollerX' | 'rollerY';

interface Support {
  nodeId: string;
  type: SupportType;
  dx: boolean;  // restrain X translation
  dy: boolean;  // restrain Y translation
  rz: boolean;  // restrain Z rotation
  
  // Settlement (optional)
  settlementX?: number;
  settlementY?: number;
  settlementRz?: number;
}
```

### Load
```typescript
type LoadType = 'point' | 'distributed';
type LoadTargetType = 'node' | 'member';
type LoadDirection = 'localY' | 'globalY';

interface Load {
  id: string;
  type: LoadType;
  target: LoadTargetType;
  targetId: string;
  
  // Point load (on node)
  fx?: number;  // kN
  fy?: number;  // kN
  mz?: number;  // kN·m
  
  // Distributed load (on member)
  w?: number;           // kN/m
  direction?: LoadDirection;
}
```

### LoadCase
```typescript
type LoadCaseType = 'dead' | 'live' | 'wind' | 'snow' | 'other';

interface LoadCase {
  id: string;
  name: string;
  type: LoadCaseType;
  loads: Load[];
}
```

### StructuralModel
```typescript
interface StructuralModel {
  nodes: Node[];
  members: Member[];
  materials: Material[];
  sections: Section[];
  supports: Support[];
}
```

## 4.2 Units System

### Canonical Internal Units
| Property | Canonical Unit | Notes |
|----------|---------------|-------|
| Length | m (meters) | |
| Area | m² | |
| Moment of Inertia | m⁴ | |
| Force | kN | |
| Moment | kN·m | |
| Stress | kPa | |
| Displacement | m | |
| Rotation | rad | |

### Conversion Contract
- **All solver formulas assume canonical units**
- **NO hidden conversions inside solver**
- **Conversion ONLY at UI boundaries** (input parsing, display formatting)
- **All database storage in canonical units**

---

# 5. Solver Engine

## 5.1 Direct Stiffness Method Overview

The solver implements the classical direct stiffness method:

```
1. Build DOF map (which DOFs exist at each node)
2. Compute element stiffness matrices in local coordinates
3. Transform to global coordinates
4. Assemble global stiffness matrix K
5. Compute fixed-end forces (FEF) for member loads
6. Apply boundary conditions (partition free/restrained DOFs)
7. Solve: K_ff * d_f = F_f (using Cholesky or LU)
8. Compute reactions: R = K_rf * d_f - F_r
9. Post-process: member forces, diagrams
```

## 5.2 Element Types & DOFs

### Truss Element
- **DOFs per node:** 2 (ux, uy)
- **Local stiffness matrix:** 4×4
- **Forces:** Axial only (N)

```
k_local = (EA/L) * [  1  0 -1  0 ]
                   [  0  0  0  0 ]
                   [ -1  0  1  0 ]
                   [  0  0  0  0 ]
```

### Frame Element
- **DOFs per node:** 3 (ux, uy, rz)
- **Local stiffness matrix:** 6×6
- **Forces:** Axial (N), Shear (V), Moment (M)

```
k_local = [ EA/L    0         0      -EA/L    0         0     ]
          [  0    12EI/L³   6EI/L²    0   -12EI/L³   6EI/L²  ]
          [  0     6EI/L²   4EI/L     0    -6EI/L²   2EI/L   ]
          [-EA/L    0         0       EA/L    0         0     ]
          [  0   -12EI/L³  -6EI/L²    0    12EI/L³  -6EI/L²  ]
          [  0     6EI/L²   2EI/L     0    -6EI/L²   4EI/L   ]
```

## 5.3 Mixed DOF Mapping

**Critical Decision:** Node has rotation DOF (rz) if and only if:
1. Connected to ≥1 FRAME element, OR
2. Has support with rz restraint, OR
3. Has applied nodal moment (Mz ≠ 0)

### Algorithm
```typescript
function buildDOFMap(model: StructuralModel, loadCase: LoadCase): DOFMap {
  // Step 1: Identify nodes needing rotation DOF
  const nodesNeedingRotation = new Set<string>();
  
  for (const member of model.members) {
    if (member.type === 'frame') {
      nodesNeedingRotation.add(member.startNodeId);
      nodesNeedingRotation.add(member.endNodeId);
    }
  }
  
  for (const support of model.supports) {
    if (support.rz) {
      nodesNeedingRotation.add(support.nodeId);
    }
  }
  
  for (const load of loadCase.loads) {
    if (load.target === 'node' && load.mz !== undefined && load.mz !== 0) {
      nodesNeedingRotation.add(load.targetId);
    }
  }
  
  // Step 2: Assign global DOF indices
  let dofIndex = 0;
  const nodeInfo = new Map<string, NodeDOFInfo>();
  
  for (const node of model.nodes) {
    const hasRotation = nodesNeedingRotation.has(node.id);
    const startIndex = dofIndex;
    const dofCount = hasRotation ? 3 : 2;
    
    nodeInfo.set(node.id, {
      startIndex,
      dofCount,
      hasRotation,
      dofIndices: {
        ux: dofIndex++,
        uy: dofIndex++,
        rz: hasRotation ? dofIndex++ : undefined,
      }
    });
  }
  
  return { nodeInfo, totalDOFs: dofIndex };
}
```

## 5.4 Fixed-End Forces (FEF)

For UDL on frame element (local y-direction):
```
F1y = wL/2,    M1 = wL²/12
F2y = wL/2,    M2 = -wL²/12
```

For point load at distance 'a' from start:
```
b = L - a
F1y = Pb²(3a+b)/L³,    M1 = Pab²/L²
F2y = Pa²(a+3b)/L³,    M2 = -Pa²b/L²
```

**Assembly:** FEFs transformed to global, added to load vector with opposite sign:
```
F_equivalent_nodal = -FEF_global
```

## 5.5 Boundary Conditions

**Method:** DOF Partitioning (not penalty method)

```
[ K_ff  K_fr ] [ d_f ]   [ F_f ]
[ K_rf  K_rr ] [ d_r ] = [ F_r ]

Where:
  f = free DOFs
  r = restrained DOFs
  d_r = prescribed displacements (usually 0)
  
Solution:
  d_f = K_ff⁻¹ * (F_f - K_fr * d_r)
  R = K_rf * d_f + K_rr * d_r - F_r
```

## 5.6 Linear Algebra

### Cholesky Factorization (Primary)
```
K = L * Lᵀ
L * y = F  (forward substitution)
Lᵀ * x = y (back substitution)
```

### LU Factorization (Fallback)
Used when Cholesky fails (non-positive-definite matrix):
```
K = L * U
L * y = F
U * x = y
```

### Performance Targets
| Size | DOFs | Target Time |
|------|------|-------------|
| 100 nodes | 300 | <20ms |
| 200 nodes | 600 | <100ms |
| 500 nodes | 1500 | ~500ms (warning) |

## 5.7 Diagram Computation

### End Forces Definition
```
f_total_local = k_local · d_local + fef_local
```

### Shear Force V(x)
```
V(x) = V1 + w·x
```

### Bending Moment M(x)
```
M(x) = M1 + V1·x + w·x²/2
```

### Deflection (Hermite Shape Functions)
```
v(x) = v1·N1(ξ) + θ1·L·N2(ξ) + v2·N3(ξ) + θ2·L·N4(ξ)

where ξ = x/L

N1(ξ) = 1 - 3ξ² + 2ξ³
N2(ξ) = ξ - 2ξ² + ξ³
N3(ξ) = 3ξ² - 2ξ³
N4(ξ) = -ξ² + ξ³
```

**Important:** NO v_load term needed. Load effects are already reflected in solved DOFs.

## 5.8 Instability Detection

Multi-layer approach:

1. **Pre-assembly:** DOF count sanity check
2. **Post-assembly:** Zero/near-zero diagonal detection
3. **During solve:** Cholesky failure → LU fallback
4. **Post-solve:** Equilibrium check (tolerance: 0.1% of total load)

### Numerical Tolerances
| Type | Value |
|------|-------|
| Relative | 1e-9 |
| Absolute | 1e-12 |
| Equilibrium | 1e-6 (as fraction of total load) |

---

# 6. File Structure

```
structural-app/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/              # Auth routes (login, signup)
│   │   ├── (main)/              # Protected routes
│   │   │   ├── dashboard/       # Project list
│   │   │   ├── project/[id]/    # Project editor
│   │   │   └── settings/        # User settings
│   │   ├── api/                 # API routes
│   │   │   ├── projects/        # Project CRUD
│   │   │   └── share/           # Share link API
│   │   ├── share/[token]/       # Public share view
│   │   └── layout.tsx           # Root layout
│   │
│   ├── components/
│   │   ├── canvas/              # Konva canvas components
│   │   │   ├── StructuralCanvas.tsx
│   │   │   ├── NodeLayer.tsx
│   │   │   ├── MemberLayer.tsx
│   │   │   ├── SupportLayer.tsx
│   │   │   ├── LoadLayer.tsx
│   │   │   ├── DiagramLayer.tsx
│   │   │   └── GridLayer.tsx
│   │   ├── ui/                  # UI components
│   │   │   ├── Toolbar.tsx
│   │   │   ├── PropertyPanel.tsx
│   │   │   ├── AnalysisPanel.tsx
│   │   │   ├── ValidationPanel.tsx
│   │   │   └── LoadDialog.tsx
│   │   ├── common/              # Shared components
│   │   ├── dashboard/           # Dashboard components
│   │   ├── editor/              # Editor wrapper
│   │   ├── project/             # Project components
│   │   ├── report/              # Report components
│   │   ├── share/               # Share components
│   │   ├── layout/              # Layout components
│   │   └── tables/              # Data tables
│   │
│   ├── features/                # Feature modules
│   │   ├── analysis/
│   │   │   └── hooks/useAnalysis.ts
│   │   ├── loads/
│   │   │   └── hooks/index.ts
│   │   ├── modeling/
│   │   │   ├── hooks/index.ts
│   │   │   └── utils/index.ts
│   │   └── results/
│   │       └── hooks/index.ts
│   │
│   ├── lib/
│   │   ├── math/                # Matrix math
│   │   │   ├── matrix.ts        # Dense matrix operations
│   │   │   ├── cholesky.ts      # Cholesky factorization
│   │   │   └── lu.ts            # LU factorization
│   │   ├── solver/              # Structural solver
│   │   │   ├── index.ts         # Main solver entry
│   │   │   ├── dofMap.ts        # DOF mapping
│   │   │   ├── assembly.ts      # Matrix assembly
│   │   │   ├── boundary.ts      # Boundary conditions
│   │   │   ├── solve.ts         # Linear system solve
│   │   │   ├── postprocess.ts   # Results processing
│   │   │   ├── stability.ts     # Stability checks
│   │   │   ├── validation.ts    # Pre-solve validation
│   │   │   ├── geometry.ts      # Geometry utilities
│   │   │   ├── tolerances.ts    # Numerical tolerances
│   │   │   ├── elements/        # Element formulations
│   │   │   │   ├── truss.ts
│   │   │   │   └── frame.ts
│   │   │   └── loads/           # Load processing
│   │   │       └── fixedEndForces.ts
│   │   ├── supabase/            # Supabase clients
│   │   │   ├── client.ts        # Browser client
│   │   │   ├── server.ts        # Server client
│   │   │   └── admin.ts         # Admin client (service role)
│   │   ├── units/               # Unit conversion
│   │   │   └── index.ts
│   │   ├── validation/          # Model validation
│   │   │   └── index.ts
│   │   └── demos/               # Demo structures
│   │       └── scenes.ts
│   │
│   ├── schemas/                 # Zod schemas
│   │   └── index.ts
│   │
│   ├── server/                  # Server utilities
│   │   ├── auth/index.ts        # Auth helpers
│   │   ├── db/projects.ts       # Database operations
│   │   └── storage/index.ts     # File storage
│   │
│   ├── stores/                  # Zustand stores
│   │   └── modelStore.ts        # Main model store
│   │
│   ├── tests/                   # Test files
│   │   ├── solver/              # Solver tests
│   │   ├── api/                 # API tests
│   │   └── components/          # Component tests
│   │
│   ├── types/                   # TypeScript types
│   │   ├── project.ts           # Project types
│   │   ├── analysis.ts          # Analysis types
│   │   └── database.ts          # Database types
│   │
│   ├── workers/                 # Web Workers
│   │   ├── solver.worker.ts
│   │   └── solverWorkerManager.ts
│   │
│   └── middleware.ts            # Auth middleware
│
├── supabase/
│   └── schema.sql               # Database schema
│
├── Dockerfile                   # Docker config
├── docker-compose.yml           # Docker Compose
├── vitest.config.ts            # Test config
└── package.json
```

---

# 7. API Reference

## 7.1 Projects API

### GET /api/projects
List user's projects.

**Response:**
```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "My Project",
      "created_at": "2026-01-25T00:00:00Z",
      "updated_at": "2026-01-25T00:00:00Z"
    }
  ]
}
```

### POST /api/projects
Create new project.

**Request:**
```json
{
  "name": "New Project",
  "model": { /* StructuralModel */ },
  "loadCases": [ /* LoadCase[] */ ]
}
```

### GET /api/projects/[id]
Get project by ID.

### PUT /api/projects/[id]
Update project.

### DELETE /api/projects/[id]
Delete project.

## 7.2 Share API

### POST /api/share
Create share link.

**Request:**
```json
{
  "projectId": "uuid",
  "expiresAt": "2026-02-25T00:00:00Z" // optional
}
```

**Response:**
```json
{
  "token": "uuid",
  "url": "https://app.com/share/uuid"
}
```

### GET /api/share/[token]
Get shared project data (read-only).

### POST /api/share/[token]/hit
Track share link access.

---

# 8. Component Architecture

## 8.1 Canvas Components

```
StructuralCanvas
├── GridLayer          # Background grid
├── MemberLayer        # Member lines
├── NodeLayer          # Node circles
├── SupportLayer       # Support symbols
├── LoadLayer          # Load arrows
└── DiagramLayer       # V, M, N diagrams
```

### Key Props

```typescript
interface StructuralCanvasProps {
  width: number;
  height: number;
  onNodeClick?: (nodeId: string) => void;
  onMemberClick?: (memberId: string) => void;
  onCanvasClick?: (x: number, y: number) => void;
}
```

## 8.2 Editor Layout

```
EditorPage
├── Header (project name, save status)
├── Toolbar (tool buttons)
├── Main Content
│   ├── Canvas (left, 70%)
│   └── Side Panel (right, 30%)
│       ├── PropertyPanel
│       ├── LoadCasePanel
│       └── ValidationPanel
└── Bottom Panel
    ├── StructureTab (nodes, members tables)
    └── ResultsTab (reactions, displacements)
```

---

# 9. State Management

## 9.1 Model Store Structure

```typescript
interface ModelStore {
  // Project metadata
  projectId: string | null;
  projectName: string;
  isDirty: boolean;
  
  // Model data
  model: StructuralModel;
  loadCases: LoadCase[];
  activeLoadCaseId: string | null;
  
  // Undo/Redo
  _history: {
    past: HistorySnapshot[];
    future: HistorySnapshot[];
  };
  
  // Settings
  units: Units;
  solverSettings: SolverSettings;
  
  // Analysis
  analysisResult: SolverResult | null;
  isAnalyzing: boolean;
  
  // UI State
  mode: EditorMode;
  selection: Selection[];
  view: ViewState;
  canvasSettings: CanvasSettings;
  
  // Actions...
}
```

## 9.2 Editor Modes

```typescript
type EditorMode = 
  | 'select'   // Select/move entities
  | 'pan'      // Pan canvas
  | 'node'     // Create nodes
  | 'member'   // Create members
  | 'support'  // Add supports
  | 'load';    // Add loads
```

## 9.3 Undo/Redo Implementation

Using immer patches:

```typescript
// Before any model change
const snapshot = {
  model: structuredClone(state.model),
  loadCases: structuredClone(state.loadCases),
};

// Push to history
state._history.past.push(snapshot);
state._history.future = []; // Clear redo stack
```

---

# 10. Database Schema

## 10.1 Tables

### projects
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  model JSONB NOT NULL,
  load_cases JSONB NOT NULL DEFAULT '[]',
  units JSONB,
  solver_settings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### share_links
```sql
CREATE TABLE share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 10.2 Row Level Security (RLS)

```sql
-- Users can only access their own projects
CREATE POLICY "Users can CRUD own projects"
  ON projects
  FOR ALL
  USING (auth.uid() = user_id);

-- Share links: no public SELECT (server-side only via service role)
CREATE POLICY "Users can manage own share links"
  ON share_links
  FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );
```

## 10.3 Functions

```sql
-- Atomic share link access increment
CREATE FUNCTION increment_share_access(share_token UUID)
RETURNS void AS $$
UPDATE share_links
SET access_count = access_count + 1
WHERE token = share_token
  AND is_active = true
  AND (expires_at IS NULL OR expires_at > NOW());
$$ LANGUAGE SQL;
```

---

# 11. Authentication & Security

## 11.1 Auth Flow

```
1. User visits /login
2. Enters email/password OR clicks Google OAuth
3. Supabase Auth handles authentication
4. Session cookie set (httpOnly, secure)
5. Middleware validates session on protected routes
6. If invalid, redirect to /login
```

## 11.2 Share Link Security

**Critical:** Share links use server-side validation only.

```
User visits /share/[token]
    │
    ▼
Server Component (page.tsx)
    │
    ▼
Fetch with supabaseAdmin (service role)
    │
    ├── Validates token exists
    ├── Checks is_active = true
    ├── Checks expiry
    │
    ▼
Returns sanitized read-only data
```

**No public RLS access to projects table.** Service role key never exposed to client.

## 11.3 Middleware

```typescript
// src/middleware.ts
export async function middleware(request: NextRequest) {
  const supabase = createServerClient(/* ... */);
  const { data: { session } } = await supabase.auth.getSession();
  
  const isProtected = request.nextUrl.pathname.startsWith('/dashboard') ||
                      request.nextUrl.pathname.startsWith('/project');
  
  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}
```

---

# 12. Development Guide

## 12.1 Setup

```bash
# Clone and install
git clone <repo>
cd structural-app
npm install

# Environment variables
cp .env.example .env.local
# Fill in Supabase credentials

# Run development server
npm run dev
```

## 12.2 Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx  # Server-only
```

## 12.3 Code Conventions

### TypeScript
- Strict mode enabled
- No `any` types (use `unknown` if needed)
- Prefer interfaces over types for objects
- Use discriminated unions for variants

### Components
- Functional components only
- Props interface defined inline or exported
- Use `'use client'` directive for client components

### Naming
- Components: PascalCase
- Files: PascalCase for components, camelCase for utilities
- Hooks: `use` prefix
- Constants: SCREAMING_SNAKE_CASE

## 12.4 Adding a New Feature

1. **Types:** Add types to `src/types/`
2. **Store:** Add state/actions to `modelStore.ts`
3. **Hooks:** Create feature hook in `src/features/`
4. **Components:** Build UI in `src/components/`
5. **Tests:** Add tests in `src/tests/`
6. **API:** Add routes if needed in `src/app/api/`

---

# 13. Testing Strategy

## 13.1 Test Categories

| Category | Location | Focus |
|----------|----------|-------|
| Solver | `tests/solver/` | Numerical accuracy, edge cases |
| API | `tests/api/` | Route handlers, validation |
| Components | `tests/components/` | UI behavior, interactions |

## 13.2 Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific file
npx vitest run src/tests/solver/simpleBeam.test.ts
```

## 13.3 Benchmark Tests

Each solver test includes benchmark structures:

- **Simple Beam:** UDL, reactions, deflection
- **Cantilever:** Tip deflection, reactions
- **Portal Frame:** Sway, moment distribution
- **Truss:** Axial forces only, V=M=0
- **Mechanism:** Instability detection

---

# 14. Deployment

## 14.1 Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production
vercel --prod
```

## 14.2 Docker Deployment

```bash
# Build image
docker build -t structura .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=xxx \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx \
  -e SUPABASE_SERVICE_ROLE_KEY=xxx \
  structura
```

## 14.3 Environment Setup

1. Create Supabase project
2. Run `supabase/schema.sql` in SQL editor
3. Enable Google OAuth (optional)
4. Set environment variables in Vercel/host

---

# 15. Decision Log

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Element types | Separate TRUSS + FRAME | Releases cause numerical issues |
| 2 | Truss DOFs | 2 DOF/node | Smaller system, no zero-stiffness |
| 3 | Distributed on truss | Error | Clearer semantics |
| 4 | Boundary conditions | Partitioning | Clean, stable, smaller system |
| 5 | Factorization | Cholesky + LU | Fastest for SPD, fallback for edge cases |
| 6 | Matrix storage | Dense + abstraction | Simpler, allows future sparse |
| 7 | Internal units | kN-m-kPa | Common in practice |
| 8 | Auth | Supabase Auth only | Simpler, RLS integration |
| 9 | Share links | DB token | Revocable, trackable |
| 10 | PDF generation | HTML + print | Zero dependencies |
| 11 | Diagram sampling | Fixed 21 points | Deterministic |
| 12 | Instability | Multi-layer checks | Better UX |
| 13 | Mixed DOF | Node gets rz if frame/support/Mz | Prevents singular matrices |
| 14 | Moment on truss node | ERROR | No rotational stiffness |
| 15 | Fixed on truss node | Allow + warning | rz restrained → no singularity |
| 16 | Diagram math | Hermite + analytical | Consistent with theory |
| 17 | Share access | Server-side service role | Security |
| 18 | Tolerance | Rel 1e-9, Abs 1e-12 | Practical floating-point |
| 19 | Stress unit | kPa | Consistent with kN-m |
| 20 | Diagram start | f_total_local | No double-counting |
| 21 | Deflection | Hermite only | Load in DOFs |
| 22 | Share hit tracking | Client-side POST | Non-blocking |

---

# 16. Acceptance Criteria

## 16.1 Solver Correctness (10 criteria)

- [ ] Simple beam UDL: M_max within 0.1% of wL²/8
- [ ] Simple beam UDL: reactions within 0.1%
- [ ] Cantilever: tip deflection within 0.1% of PL³/3EI
- [ ] Portal frame: expected sway pattern
- [ ] Truss: V=M=0 (< 1e-10)
- [ ] Equilibrium: ΣF + ΣR < 0.1% of max load
- [ ] Mechanism detection: error with "unstable" message
- [ ] Insufficient supports: pre-validation error
- [ ] Reproducibility: identical across 10 runs (tolerance)
- [ ] Unit conversion round-trip: ±1e-10

## 16.2 Data Integrity (5 criteria)

- [ ] Project save/load without data loss
- [ ] Analysis results with correct metadata
- [ ] Undo/redo restores exact state
- [ ] Share link grants read-only access
- [ ] Expired share link returns error

## 16.3 Numerical Robustness (5 criteria)

- [ ] 200-node frame in <200ms
- [ ] Cholesky failure → LU gracefully
- [ ] Near-zero stiffness triggers warning
- [ ] Large displacement warning at δ > L/10
- [ ] E ratio 1e6 solves without NaN

## 16.4 User Experience (5 criteria)

- [ ] Node creation with grid snap
- [ ] Canvas ↔ table sync
- [ ] Keyboard shortcuts functional
- [ ] Validation errors highlight entities
- [ ] Analysis <2s for 50-node frame

## 16.5 Reporting (5 criteria)

- [ ] All required sections present
- [ ] Prints to PDF without clipping
- [ ] Includes solver version and timestamp
- [ ] Diagrams render in print
- [ ] Units on all numeric values

## 16.6 Authentication & Security (5 criteria)

- [ ] Unauthenticated redirect to /login
- [ ] User A cannot access User B's project
- [ ] RLS policies enforce ownership
- [ ] OAuth login works
- [ ] Session persists across refresh

## 16.7 Mixed DOF & Diagrams (18 criteria)

- [ ] Mixed DOF assembly: correct matrix size
- [ ] Truss doesn't contribute to rz DOFs
- [ ] Frame requires rz at both ends
- [ ] Moment diagram matches analytical (0.01%)
- [ ] Shear integrates to moment
- [ ] Share link works without auth
- [ ] Share link doesn't expose service key
- [ ] Expired share link error
- [ ] Results use tolerance comparison
- [ ] All values use canonical units
- [ ] Moment on truss-only blocks analysis
- [ ] Fixed on truss-only shows warning
- [ ] V(L) = -V2, M(L) = M2 (1e-9)
- [ ] Deflection at ends matches DOFs
- [ ] Share hit tracking increments
- [ ] Hit tracking non-blocking

---

# Appendix A: Keyboard Shortcuts

| Key | Action |
|-----|--------|
| V | Select mode |
| N | Node mode |
| M | Member mode |
| S | Support mode |
| L | Load mode |
| Delete | Delete selected |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+S | Save |
| G | Toggle grid |
| Enter | Run analysis |
| Escape | Cancel/deselect |
| Space+Drag | Pan |
| Scroll | Zoom |

---

# Appendix B: Common Material Properties

| Material | E (GPa) | E (kPa) | Density (kg/m³) |
|----------|---------|---------|-----------------|
| Steel | 200 | 200,000,000 | 7,850 |
| Concrete | 30 | 30,000,000 | 2,400 |
| Aluminum | 70 | 70,000,000 | 2,700 |
| Timber | 12 | 12,000,000 | 600 |

---

# Appendix C: Troubleshooting

## "Matrix is singular"
- Check for mechanism (insufficient supports)
- Check for disconnected parts
- Verify no zero-length members

## "Analysis takes too long"
- Reduce model size (<500 nodes)
- Check for very stiff elements (E ratio > 1e6)

## "Results seem wrong"
- Verify units are consistent
- Check load directions
- Verify support types

## "Share link not working"
- Check if link is expired
- Check if link is deactivated
- Verify project still exists

---

**End of Document**
