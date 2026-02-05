/**
 * 404 Not Found Page - Structura Design
 *
 * Custom 404 page with structural engineering theme.
 */

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="font-sans bg-background-light dark:bg-background-dark text-slate-900 dark:text-white">
      <div className="relative flex min-h-screen w-full flex-col overflow-hidden">
        {/* Background Grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40 z-0"
          style={{
            backgroundSize: '40px 40px',
            backgroundImage:
              'linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)',
          }}
        />

        {/* Header */}
        <header className="relative z-10 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-sm px-6 lg:px-10 py-4">
          <Link href="/" className="flex items-center gap-3 text-structura-primary">
            <div className="w-8 h-8 bg-structura-primary/10 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">architecture</span>
            </div>
            <span className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-tight">
              Structura
            </span>
          </Link>
        </header>

        {/* Main Content */}
        <main className="relative z-10 flex flex-1 flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="flex max-w-[640px] flex-col items-center gap-8 text-center">
            {/* Illustration */}
            <div className="relative flex items-center justify-center p-8">
              <div className="w-64 h-64 sm:w-80 sm:h-80 relative">
                <svg
                  className="w-full h-full text-slate-300 dark:text-slate-700"
                  fill="none"
                  viewBox="0 0 400 400"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Decorative background elements */}
                  <circle
                    className="opacity-50"
                    cx="200"
                    cy="200"
                    r="160"
                    stroke="currentColor"
                    strokeDasharray="8 8"
                    strokeWidth="1"
                  />
                  <circle className="opacity-30" cx="200" cy="200" r="120" stroke="currentColor" strokeWidth="1" />

                  {/* Broken Beam Elements */}
                  <path
                    className="animate-pulse"
                    d="M120 280 L180 220"
                    stroke="#2463eb"
                    strokeLinecap="round"
                    strokeWidth="8"
                  />
                  <path
                    d="M220 180 L280 120"
                    stroke="#2463eb"
                    strokeLinecap="round"
                    strokeOpacity="0.4"
                    strokeWidth="8"
                  />

                  {/* Disconnected joint */}
                  <circle className="opacity-80" cx="200" cy="200" fill="#ef4444" r="12" />
                  <path d="M190 210 L150 250" stroke="#94a3b8" strokeLinecap="round" strokeWidth="4" />
                  <path d="M210 190 L250 150" stroke="#94a3b8" strokeLinecap="round" strokeWidth="4" />

                  {/* Floating debris */}
                  <rect fill="#2463eb" fillOpacity="0.2" height="12" rx="2" width="12" x="260" y="240" />
                  <rect fill="#2463eb" fillOpacity="0.2" height="8" rx="1" width="8" x="140" y="140" />
                  <path d="M300 200 L320 200" stroke="#94a3b8" strokeWidth="2" />
                  <path d="M80 200 L100 200" stroke="#94a3b8" strokeWidth="2" />
                </svg>
              </div>
            </div>

            {/* Text Content */}
            <div className="space-y-4 max-w-[480px]">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
                <span className="text-structura-primary">404</span>
                <br />
                Structural Failure
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg leading-relaxed">
                It seems the component you are looking for has collapsed or been moved. Let&apos;s
                get you back to a stable foundation.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mt-2">
              <Link
                href="/dashboard"
                className="flex w-full sm:w-auto min-w-[160px] cursor-pointer items-center justify-center rounded-lg h-12 px-6 bg-structura-primary hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors duration-200 gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">dashboard</span>
                Return to Dashboard
              </Link>
              <Link
                href="/"
                className="flex w-full sm:w-auto min-w-[160px] cursor-pointer items-center justify-center rounded-lg h-12 px-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-semibold transition-colors duration-200 gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">home</span>
                Go to Home
              </Link>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 w-full py-8">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <div className="flex items-center gap-6">
              <Link
                className="text-sm font-medium text-slate-500 hover:text-structura-primary dark:text-slate-400 dark:hover:text-structura-primary transition-colors"
                href="#"
              >
                Help Center
              </Link>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <Link
                className="text-sm font-medium text-slate-500 hover:text-structura-primary dark:text-slate-400 dark:hover:text-structura-primary transition-colors"
                href="#"
              >
                Status Page
              </Link>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <Link
                className="text-sm font-medium text-slate-500 hover:text-structura-primary dark:text-slate-400 dark:hover:text-structura-primary transition-colors"
                href="#"
              >
                Documentation
              </Link>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              © {new Date().getFullYear()} Structura Inc. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
