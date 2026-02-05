/**
 * ProjectList Component - Structura Design
 *
 * Grid of project cards with actions.
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Database } from '@/types/database';

type Project = Database['public']['Tables']['projects']['Row'];

interface ProjectListProps {
  projects: Project[];
}

export function ProjectList({ projects }: ProjectListProps) {
  const router = useRouter();

  if (projects.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} onDeleted={() => router.refresh()} />
      ))}
    </div>
  );
}

interface ProjectCardProps {
  project: Project;
  onDeleted: () => void;
}

function ProjectCard({ project, onDeleted }: ProjectCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        onDeleted();
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'duplicate' }),
      });

      if (res.ok) {
        onDeleted(); // Refresh the list
      }
    } catch (error) {
      console.error('Failed to duplicate project:', error);
    }
    setMenuOpen(false);
  };

  // Parse project data for summary
  const data = project.data as { model?: { nodes?: unknown[]; members?: unknown[] } };
  const nodeCount = data?.model?.nodes?.length ?? 0;
  const memberCount = data?.model?.members?.length ?? 0;

  const updatedAt = new Date(project.updated_at);
  const formattedDate = updatedAt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: updatedAt.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });

  return (
    <div className="group relative bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-structura-primary/50 hover:shadow-lg transition-all">
      <Link href={`/project/${project.id}`} className="block p-5">
        {/* Project Icon */}
        <div className="w-12 h-12 bg-structura-primary/10 rounded-xl flex items-center justify-center text-structura-primary mb-4 group-hover:scale-105 transition-transform">
          <span className="material-symbols-outlined text-[24px]">architecture</span>
        </div>

        <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate group-hover:text-structura-primary transition-colors">
          {project.name}
        </h3>

        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">radio_button_unchecked</span>
            {nodeCount} nodes
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">segment</span>
            {memberCount} members
          </span>
        </p>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
          <span className="material-symbols-outlined text-[14px] text-slate-400">schedule</span>
          <p className="text-xs text-slate-400 dark:text-slate-500">Updated {formattedDate}</p>
        </div>
      </Link>

      {/* Actions menu */}
      <div className="absolute top-4 right-4">
        <button
          onClick={(e) => {
            e.preventDefault();
            setMenuOpen(!menuOpen);
          }}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors opacity-0 group-hover:opacity-100"
        >
          <span className="material-symbols-outlined text-[20px]">more_vert</span>
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20 overflow-hidden">
              <button
                onClick={handleDuplicate}
                className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px] text-slate-400">
                  content_copy
                </span>
                Duplicate
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setShowDeleteConfirm(true);
                }}
                className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                Delete
              </button>
            </div>
          </>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-sm mx-4 shadow-2xl">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-[24px]">
                warning
              </span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 text-center">
              Delete project?
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 text-center">
              Are you sure you want to delete &ldquo;{project.name}&rdquo;? This action cannot be
              undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-[40px]">
          folder_open
        </span>
      </div>
      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No projects yet</h3>
      <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">
        Create your first structural analysis project to get started
      </p>
      <Link
        href="/project/new"
        className="inline-flex items-center gap-2 px-6 py-3 bg-structura-primary hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm shadow-blue-500/20"
      >
        <span className="material-symbols-outlined text-[20px]">add</span>
        New Project
      </Link>
    </div>
  );
}
