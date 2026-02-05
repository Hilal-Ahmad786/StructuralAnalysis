/**
 * Login Page - Structura Design
 *
 * Email/password and OAuth login options.
 */

'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Lazily create Supabase client only on client side
  const supabase = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return createClient();
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    if (!supabase) return;
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
      },
    });

    if (error) {
      setError(error.message);
    }
  };

  return (
    <div className="font-sans bg-background-light dark:bg-background-dark min-h-screen flex flex-col relative overflow-x-hidden">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundSize: '40px 40px',
          backgroundImage:
            'linear-gradient(to right, rgba(36, 99, 235, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(36, 99, 235, 0.05) 1px, transparent 1px)',
        }}
      />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center p-4 sm:p-6">
        {/* Card Container */}
        <div className="w-full max-w-[440px] bg-white dark:bg-card-dark rounded-lg shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
          <div className="px-8 pt-10 pb-8 flex flex-col items-center">
            {/* Branding / Logo */}
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-structura-primary/10 rounded-lg flex items-center justify-center text-structura-primary">
                <span className="material-symbols-outlined text-[28px]">architecture</span>
              </div>
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Structura
              </span>
            </Link>

            {/* Page Heading */}
            <div className="text-center mb-8">
              <h1 className="text-slate-900 dark:text-white tracking-tight text-[28px] font-bold leading-tight mb-2">
                Log in to your workspace
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-normal leading-normal">
                Enter your credentials to access the platform.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="w-full mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleEmailLogin} className="w-full flex flex-col gap-5">
              {/* Email Field */}
              <div className="flex flex-col gap-2">
                <label
                  className="text-slate-900 dark:text-slate-200 text-sm font-medium leading-normal"
                  htmlFor="email"
                >
                  Email address
                </label>
                <input
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white h-12 px-4 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-structura-primary focus:ring-2 focus:ring-structura-primary/20 focus:outline-none transition-all text-base"
                  id="email"
                  placeholder="user@company.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-2">
                <label
                  className="text-slate-900 dark:text-slate-200 text-sm font-medium leading-normal"
                  htmlFor="password"
                >
                  Password
                </label>
                <div className="relative w-full">
                  <input
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white h-12 pl-4 pr-12 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-structura-primary focus:ring-2 focus:ring-structura-primary/20 focus:outline-none transition-all text-base"
                    id="password"
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-white transition-colors focus:outline-none"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember & Forgot Password */}
              <div className="flex items-center justify-between mt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    className="h-4 w-4 cursor-pointer rounded border-slate-300 text-structura-primary focus:ring-structura-primary focus:ring-offset-0 transition-all"
                    type="checkbox"
                  />
                  <span className="text-sm text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                    Remember me
                  </span>
                </label>
                <Link
                  className="text-sm font-medium text-structura-primary hover:text-blue-700 transition-colors"
                  href="#"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Sign In Button */}
              <button
                className="w-full bg-structura-primary hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium h-12 rounded-lg transition-colors mt-2 shadow-sm shadow-blue-500/20"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              {/* Divider */}
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                <span className="flex-shrink-0 mx-4 text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                  Or continue with
                </span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
              </div>

              {/* Google OAuth Button */}
              <button
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-medium h-12 rounded-lg transition-colors flex items-center justify-center gap-3"
                type="button"
                onClick={() => handleOAuthLogin('google')}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign in with Google
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 py-5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              New to Structura?{' '}
              <Link
                className="font-medium text-structura-primary hover:text-blue-700 transition-colors ml-1"
                href="/signup"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Demo mode link */}
        <p className="mt-6 text-sm text-slate-400 dark:text-slate-500">
          <Link href="/editor" className="hover:text-structura-primary transition-colors">
            Try the editor without an account →
          </Link>
        </p>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400/60 dark:text-slate-500">
            © {new Date().getFullYear()} Structura Inc. Structural Analysis Platform.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            Loading...
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
