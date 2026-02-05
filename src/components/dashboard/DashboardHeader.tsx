/**
 * DashboardHeader Component - Structura Design
 *
 * Top navigation bar for authenticated pages.
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface DashboardHeaderProps {
  user: User;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const initials = user.email ? user.email.slice(0, 2).toUpperCase() : 'U';

  return (
    <header className="bg-white dark:bg-card-dark border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-structura-primary/10 rounded-lg flex items-center justify-center text-structura-primary">
              <span className="material-symbols-outlined text-[24px]">architecture</span>
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Structura
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Projects
            </Link>
            <Link
              href="/editor"
              className="px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Quick Editor
            </Link>
            <Link
              href="/settings"
              className="px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Settings
            </Link>
          </nav>

          {/* User menu */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-[22px]">notifications</span>
            </button>

            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="w-9 h-9 bg-structura-primary/10 rounded-full flex items-center justify-center text-sm font-semibold text-structura-primary">
                  {initials}
                </div>
                <span className="material-symbols-outlined text-[18px] text-slate-400 hidden sm:block">
                  expand_more
                </span>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-20 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Signed in as
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="material-symbols-outlined text-[18px] text-slate-400">
                          dashboard
                        </span>
                        Dashboard
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="material-symbols-outlined text-[18px] text-slate-400">
                          settings
                        </span>
                        Settings
                      </Link>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-700 py-1">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">logout</span>
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
