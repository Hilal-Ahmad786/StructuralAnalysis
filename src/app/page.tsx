import Link from 'next/link';

export default function HomePage(): JSX.Element {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-sans">
      {/* Background Pattern */}
      <div className="fixed inset-0 z-0 bg-engineering-grid pointer-events-none opacity-50" />

      {/* Navigation */}
      <nav className="relative z-10 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-structura-primary/10 rounded-lg flex items-center justify-center text-structura-primary">
                <span className="material-symbols-outlined text-[28px]">architecture</span>
              </div>
              <span className="text-2xl font-bold tracking-tight">Structura</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-slate-600 dark:text-slate-300 hover:text-structura-primary transition-colors font-medium">
                Features
              </Link>
              <Link href="#how-it-works" className="text-slate-600 dark:text-slate-300 hover:text-structura-primary transition-colors font-medium">
                How It Works
              </Link>
              <Link href="/editor" className="text-slate-600 dark:text-slate-300 hover:text-structura-primary transition-colors font-medium">
                Demo
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-slate-600 dark:text-slate-300 hover:text-structura-primary transition-colors font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="bg-structura-primary hover:bg-blue-700 px-5 py-2.5 rounded-lg font-semibold text-white transition-colors shadow-sm shadow-blue-500/20"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10">
        <div className="container mx-auto px-6 pt-20 pb-24">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-structura-primary/10 border border-structura-primary/20 rounded-full text-sm text-structura-primary font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-structura-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-structura-primary"></span>
              </span>
              Now with Real-time Collaboration
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight leading-tight">
              Structural Analysis
              <br />
              <span className="text-structura-primary">Made Simple</span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Professional 2D frame and truss analysis for engineers, architects, and students.
              Design, analyze, and generate reports — all in your browser.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/editor"
                className="inline-flex items-center justify-center gap-2 bg-structura-primary hover:bg-blue-700 px-8 py-4 rounded-lg font-semibold text-lg text-white transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
              >
                <span className="material-symbols-outlined">play_arrow</span>
                Try Demo Editor
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 border-2 border-slate-300 dark:border-slate-600 hover:border-structura-primary hover:bg-structura-primary/5 px-8 py-4 rounded-lg font-semibold text-lg transition-all"
              >
                Create Free Account
              </Link>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-16 mt-16">
              <div className="text-center">
                <p className="text-4xl font-bold text-structura-primary">100%</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Browser-based</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-structura-primary">&lt;1s</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Analysis time</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-structura-primary">Free</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">For students</p>
              </div>
            </div>
          </div>

          {/* Preview Image */}
          <div className="mt-20 max-w-6xl mx-auto">
            <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl bg-white dark:bg-card-dark">
              {/* Browser chrome */}
              <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 flex items-center gap-3 border-b border-slate-200 dark:border-slate-700">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex-1 ml-4">
                  <div className="bg-white dark:bg-slate-900 rounded-md px-4 py-1.5 text-sm text-slate-500 max-w-md border border-slate-200 dark:border-slate-700">
                    structura.app/editor
                  </div>
                </div>
              </div>

              {/* App preview */}
              <div className="bg-background-light dark:bg-background-dark aspect-[16/10]">
                <EditorPreview />
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <section id="features" className="py-24 bg-white dark:bg-card-dark border-t border-b border-slate-200 dark:border-slate-800">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Everything you need to analyze structures quickly and accurately
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <FeatureCard
                icon="bolt"
                title="Lightning Fast"
                description="From sketch to results in seconds. Direct stiffness method runs instantly in your browser."
              />
              <FeatureCard
                icon="cloud_sync"
                title="Cloud Native"
                description="Projects saved securely in the cloud. Access from anywhere, share with a single link."
              />
              <FeatureCard
                icon="monitoring"
                title="Instant Diagrams"
                description="Shear force, bending moment, axial force, and deflection diagrams generated automatically."
              />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-24">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Four simple steps to analyze your structure
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              <StepCard
                number={1}
                icon="edit"
                title="Draw Structure"
                description="Click to place nodes, drag to create members. Add supports with a single click."
              />
              <StepCard
                number={2}
                icon="arrow_downward"
                title="Apply Loads"
                description="Point loads, moments, or distributed loads. Organize into load cases."
              />
              <StepCard
                number={3}
                icon="play_arrow"
                title="Run Analysis"
                description="Hit analyze and get reactions, displacements, and internal forces instantly."
              />
              <StepCard
                number={4}
                icon="picture_as_pdf"
                title="Export Results"
                description="View diagrams, check equilibrium, and generate professional PDF reports."
              />
            </div>
          </div>
        </section>

        {/* Technical Highlights */}
        <section className="py-24 bg-white dark:bg-card-dark border-t border-b border-slate-200 dark:border-slate-800">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for Engineers</h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Proper element formulations, correct sign conventions, and validated against analytical solutions.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              <TechCard icon="view_in_ar" title="2D Frames & Trusses" description="Euler-Bernoulli beams, 2-node truss elements" />
              <TechCard icon="layers" title="Multiple Load Cases" description="Dead, live, wind, snow — organize and combine" />
              <TechCard icon="straighten" title="SI & Imperial Units" description="Work in kN-m or kip-ft, switch anytime" />
              <TechCard icon="description" title="PDF Reports" description="Professional reports with inputs and results" />
              <TechCard icon="monitoring" title="Real-time Diagrams" description="N, V, M, δ diagrams update as you edit" />
              <TechCard icon="verified" title="Equilibrium Check" description="ΣF = 0, ΣM = 0 verified automatically" />
              <TechCard icon="cloud" title="Cloud Storage" description="Projects auto-save to your account" />
              <TechCard icon="share" title="Share Links" description="Send read-only links to collaborators" />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-structura-primary/10 to-blue-600/5 border border-structura-primary/20 rounded-2xl p-12 md:p-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start?</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg">
                Create your free account and start analyzing structures in minutes.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-structura-primary hover:bg-blue-700 px-8 py-4 rounded-lg font-semibold text-lg text-white transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl"
              >
                Get Started Free
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-card-dark">
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-structura-primary/10 rounded-lg flex items-center justify-center text-structura-primary">
                <span className="material-symbols-outlined text-[20px]">architecture</span>
              </div>
              <span className="font-bold text-lg">Structura</span>
            </div>
            <div className="flex items-center gap-8 text-sm">
              <Link href="/editor" className="text-slate-500 hover:text-structura-primary transition-colors font-medium">Demo</Link>
              <Link href="#features" className="text-slate-500 hover:text-structura-primary transition-colors font-medium">Features</Link>
              <Link href="/login" className="text-slate-500 hover:text-structura-primary transition-colors font-medium">Sign In</Link>
            </div>
            <p className="text-slate-400 text-sm">
              © {new Date().getFullYear()} Structura Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// Components
// ============================================================================

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}): JSX.Element {
  return (
    <div className="bg-background-light dark:bg-background-dark border border-slate-200 dark:border-slate-700 rounded-xl p-8 hover:border-structura-primary/50 hover:shadow-lg transition-all group">
      <div className="w-14 h-14 bg-structura-primary/10 rounded-xl flex items-center justify-center text-structura-primary mb-6 group-hover:scale-110 transition-transform">
        <span className="material-symbols-outlined text-[28px]">{icon}</span>
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

function TechCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}): JSX.Element {
  return (
    <div className="bg-background-light dark:bg-background-dark border border-slate-200 dark:border-slate-700 rounded-lg p-5 hover:border-structura-primary/30 transition-colors">
      <div className="flex items-center gap-3 mb-2">
        <span className="material-symbols-outlined text-structura-primary text-[20px]">{icon}</span>
        <h4 className="font-semibold">{title}</h4>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  icon,
  title,
  description,
}: {
  number: number;
  icon: string;
  title: string;
  description: string;
}): JSX.Element {
  return (
    <div className="text-center group">
      <div className="relative inline-block mb-6">
        <div className="w-16 h-16 bg-structura-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-[28px]">{icon}</span>
        </div>
        <div className="absolute -top-2 -right-2 w-7 h-7 bg-white dark:bg-slate-800 border-2 border-structura-primary rounded-full flex items-center justify-center text-sm font-bold text-structura-primary">
          {number}
        </div>
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

function EditorPreview(): JSX.Element {
  return (
    <svg className="w-full h-full" viewBox="0 0 800 500" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background */}
      <rect width="800" height="500" fill="#f6f6f8" />

      {/* Grid */}
      <g stroke="#e5e7eb" strokeWidth="0.5">
        {Array.from({ length: 17 }, (_, i) => (
          <line key={`h-${i}`} x1="0" y1={i * 30 + 10} x2="800" y2={i * 30 + 10} />
        ))}
        {Array.from({ length: 27 }, (_, i) => (
          <line key={`v-${i}`} x1={i * 30 + 10} y1="0" x2={i * 30 + 10} y2="500" />
        ))}
      </g>

      {/* Left Toolbar background */}
      <rect x="0" y="0" width="64" height="500" fill="#ffffff" />
      <rect x="64" y="0" width="1" height="500" fill="#e5e7eb" />

      {/* Toolbar buttons */}
      {['near_me', 'radio_button_unchecked', 'segment', 'change_history', 'arrow_downward'].map((_, i) => (
        <g key={i}>
          <rect x={12} y={16 + i * 56} width="40" height="40" rx="8" fill={i === 2 ? '#2463eb15' : '#f6f6f8'} />
        </g>
      ))}

      {/* Portal frame structure */}
      <g transform="translate(180, 100)">
        {/* Columns */}
        <line x1="0" y1="280" x2="0" y2="0" stroke="#1e293b" strokeWidth="6" />
        <line x1="400" y1="280" x2="400" y2="0" stroke="#1e293b" strokeWidth="6" />

        {/* Rafters */}
        <line x1="0" y1="0" x2="200" y2="-40" stroke="#1e293b" strokeWidth="6" />
        <line x1="400" y1="0" x2="200" y2="-40" stroke="#1e293b" strokeWidth="6" />

        {/* Nodes */}
        <circle cx="0" cy="0" r="8" fill="white" stroke="#1e293b" strokeWidth="3" />
        <circle cx="400" cy="0" r="8" fill="white" stroke="#1e293b" strokeWidth="3" />
        <circle cx="200" cy="-40" r="8" fill="white" stroke="#1e293b" strokeWidth="3" />
        <circle cx="0" cy="280" r="8" fill="white" stroke="#1e293b" strokeWidth="3" />
        <circle cx="400" cy="280" r="8" fill="white" stroke="#1e293b" strokeWidth="3" />

        {/* Fixed supports */}
        <polygon points="-12,280 12,280 0,300" fill="#64748b" />
        <polygon points="388,280 412,280 400,300" fill="#64748b" />

        {/* Distributed load arrows */}
        {Array.from({ length: 5 }, (_, i) => (
          <g key={i} transform={`translate(${40 + i * 80}, -40)`}>
            <line x1="0" y1="-35" x2="0" y2="-8" stroke="#dc2626" strokeWidth="2" />
            <polygon points="-5,-12 5,-12 0,-2" fill="#dc2626" />
          </g>
        ))}
        <text x="200" y="-60" textAnchor="middle" fill="#dc2626" fontSize="14" fontWeight="600">10 kN/m</text>

        {/* Moment diagram (green fill) */}
        <path d="M 0 0 L 0 -50 Q 100 -90 200 -60 Q 300 -30 400 -50 L 400 0" fill="#22c55e" fillOpacity="0.15" stroke="#22c55e" strokeWidth="2" />

        {/* Labels */}
        <text x="-25" y="5" fill="#64748b" fontSize="11" fontWeight="500">N2</text>
        <text x="415" y="5" fill="#64748b" fontSize="11" fontWeight="500">N3</text>
        <text x="200" y="-55" fill="#64748b" fontSize="11" fontWeight="500">N5</text>
      </g>

      {/* Side panel */}
      <rect x="600" y="0" width="200" height="500" fill="#ffffff" />
      <rect x="600" y="0" width="1" height="500" fill="#e5e7eb" />

      {/* Panel content */}
      <text x="620" y="35" fill="#1e293b" fontSize="16" fontWeight="700">Properties</text>
      <rect x="620" y="50" width="160" height="1" fill="#e5e7eb" />

      <text x="620" y="80" fill="#64748b" fontSize="12" fontWeight="500">Selected Member</text>
      <text x="620" y="100" fill="#1e293b" fontSize="14" fontWeight="600">M2 (Rafter Left)</text>

      <rect x="620" y="120" width="160" height="1" fill="#e5e7eb" />

      <text x="620" y="150" fill="#64748b" fontSize="12" fontWeight="500">Section Profile</text>
      <rect x="620" y="160" width="160" height="36" rx="6" fill="#f6f6f8" stroke="#e5e7eb" />
      <text x="632" y="183" fill="#1e293b" fontSize="13">IPE 300</text>

      <text x="620" y="225" fill="#64748b" fontSize="12" fontWeight="500">Material</text>
      <rect x="620" y="235" width="160" height="36" rx="6" fill="#f6f6f8" stroke="#e5e7eb" />
      <text x="632" y="258" fill="#1e293b" fontSize="13">S355 Steel</text>

      {/* Bottom panel */}
      <rect x="65" y="380" width="534" height="120" fill="#ffffff" />
      <rect x="65" y="380" width="534" height="1" fill="#e5e7eb" />

      {/* Tabs */}
      <text x="85" y="405" fill="#2463eb" fontSize="12" fontWeight="600">Nodes</text>
      <text x="145" y="405" fill="#64748b" fontSize="12" fontWeight="500">Members</text>
      <text x="220" y="405" fill="#64748b" fontSize="12" fontWeight="500">Loads</text>

      {/* Table headers */}
      <text x="85" y="435" fill="#64748b" fontSize="11" fontWeight="500">Node ID</text>
      <text x="160" y="435" fill="#64748b" fontSize="11" fontWeight="500">X (m)</text>
      <text x="230" y="435" fill="#64748b" fontSize="11" fontWeight="500">Y (m)</text>
      <text x="300" y="435" fill="#64748b" fontSize="11" fontWeight="500">Restraint</text>

      {/* Table rows */}
      <text x="85" y="460" fill="#1e293b" fontSize="12" fontFamily="monospace">N1</text>
      <text x="160" y="460" fill="#1e293b" fontSize="12">0.000</text>
      <text x="230" y="460" fill="#1e293b" fontSize="12">0.000</text>
      <rect x="300" y="448" width="45" height="18" rx="4" fill="#f1f5f9" stroke="#e2e8f0" />
      <text x="308" y="461" fill="#64748b" fontSize="10" fontWeight="500">Fixed</text>

      <text x="85" y="485" fill="#2463eb" fontSize="12" fontFamily="monospace" fontWeight="600">N2</text>
      <text x="160" y="485" fill="#1e293b" fontSize="12">0.000</text>
      <text x="230" y="485" fill="#1e293b" fontSize="12">5.000</text>
      <text x="300" y="485" fill="#94a3b8" fontSize="12">-</text>
    </svg>
  );
}
