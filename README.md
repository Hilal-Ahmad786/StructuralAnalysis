# StructuraApp

A browser-based structural analysis web application for rapid 2D frame and truss analysis.

## 🎯 Overview

StructuraApp enables engineers, architects, and students to quickly model and analyze 2D structures. Go from sketch to results in under 30 seconds with instant shear force, bending moment, and deflection diagrams.

**Target Users:**
- Engineering students learning structural analysis
- Architects doing quick feasibility checks
- Structural engineers for verification and hand-checks

## 🚀 Features (MVP)

- [x] 2D frame and truss elements
- [x] Visual canvas-based modeling
- [x] Point loads and distributed loads
- [x] Fixed, pinned, and roller supports
- [x] Client-side solver (Web Worker)
- [x] Shear/moment/axial/deflection diagrams
- [x] Cloud project storage
- [x] PDF report generation
- [x] Share projects via link

## 🛠️ Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **Canvas:** react-konva
- **State:** Zustand + Immer
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Testing:** Vitest + Testing Library
- **Deployment:** Vercel

## 📦 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier works)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/structural-app.git
cd structural-app

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Add your Supabase credentials to .env.local

# Start development server
npm run dev
```

Visit `http://localhost:3000`

### Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── (main)/            # Main app pages (dashboard, project)
│   ├── api/               # API routes
│   └── share/             # Public share pages
├── components/
│   ├── ui/                # Primitive UI components
│   ├── layout/            # Layout components
│   ├── canvas/            # Konva canvas components
│   └── tables/            # Data tables
├── features/
│   ├── modeling/          # Node/member/support creation
│   ├── loads/             # Load management
│   ├── analysis/          # Solver integration
│   └── results/           # Results display
├── lib/
│   ├── math/              # Matrix operations
│   ├── solver/            # Structural solver
│   ├── units/             # Unit conversion
│   └── validation/        # Model validation
├── server/
│   ├── db/                # Database queries
│   ├── auth/              # Auth configuration
│   └── storage/           # File storage
├── stores/                # Zustand stores
├── types/                 # TypeScript types
├── schemas/               # Zod schemas
└── tests/                 # Test files
```

## 🧪 Testing

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# UI mode
npm run test:ui
```

### Solver Verification

The solver includes benchmark tests against known solutions:
- Simply supported beam with UDL
- Cantilever with point load
- Portal frame with lateral load
- Simple truss

## 📐 Technical Details

### Sign Conventions

- **Axial (N):** Tension positive
- **Shear (V):** Causes CW rotation of left segment = positive
- **Moment (M):** Tension on bottom fiber (sagging) = positive
- **Local Y:** 90° CCW from member axis

### Canonical Units (Internal)

| Quantity | Unit |
|----------|------|
| Length | m |
| Force | kN |
| Moment | kN·m |
| Stress | kPa |

### Solver Method

- Direct Stiffness Method (Matrix Stiffness)
- Cholesky factorization (LU fallback)
- Runs in Web Worker for non-blocking UI

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

## ⚠️ Disclaimer

This tool is for **educational and preliminary analysis only**. Final structural designs must be verified by a licensed professional engineer.
