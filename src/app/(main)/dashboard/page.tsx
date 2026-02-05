/**
 * Dashboard Page - Structura Design
 *
 * Lists user's projects with create, open, and delete actions.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/supabase/server';
import { getUserProjects } from '@/server/db/projects';
import { ProjectList } from '@/components/dashboard/ProjectList';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

export default async function DashboardPage() {
  const user = await getServerUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <DashboardHeader user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              My Projects
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Create and manage your structural analysis projects
            </p>
          </div>

          <Link
            href="/project/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-structura-primary hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm shadow-blue-500/20"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            New Project
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 rounded-lg p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-structura-primary/10 rounded-lg flex items-center justify-center text-structura-primary">
                <span className="material-symbols-outlined">folder</span>
              </div>
              <div>
                <Suspense fallback={<span className="text-2xl font-bold text-slate-900 dark:text-white">-</span>}>
                  <ProjectCountWrapper />
                </Suspense>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Projects</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 rounded-lg p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center text-green-500">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">-</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Analyzed</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 rounded-lg p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500">
                <span className="material-symbols-outlined">share</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">-</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Shared</p>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">All Projects</h2>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 dark:text-slate-400">
                <span className="material-symbols-outlined text-[20px]">grid_view</span>
              </button>
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 dark:text-slate-400">
                <span className="material-symbols-outlined text-[20px]">view_list</span>
              </button>
            </div>
          </div>
          <div className="p-6">
            <Suspense fallback={<ProjectListSkeleton />}>
              <ProjectListWrapper />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}

async function ProjectListWrapper() {
  const projects = await getUserProjects();
  return <ProjectList projects={projects} />;
}

async function ProjectCountWrapper() {
  const projects = await getUserProjects();
  return <p className="text-2xl font-bold text-slate-900 dark:text-white">{projects.length}</p>;
}

function ProjectListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-6 animate-pulse"
        >
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
        </div>
      ))}
    </div>
  );
}
