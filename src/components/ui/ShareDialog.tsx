/**
 * Share Dialog
 *
 * Share project via link with access controls.
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useModelStore } from '@/stores/modelStore';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type AccessLevel = 'view' | 'edit' | 'comment';

export function ShareDialog({ isOpen, onClose }: ShareDialogProps): React.JSX.Element | null {
  const { projectName, model } = useModelStore();
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('view');
  const [expiresIn, setExpiresIn] = useState<string>('7d');
  const [copied, setCopied] = useState(false);

  const generateShareLink = useCallback(async () => {
    setIsGenerating(true);

    // Simulate API call to generate share token
    // In production, this would call /api/share
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Generate a mock share token
    const token = `share_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    const link = `${window.location.origin}/share/${token}`;

    setShareLink(link);
    setIsGenerating(false);
  }, []);

  const copyToClipboard = useCallback(async () => {
    if (!shareLink) return;

    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareLink]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-card-dark rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px] text-green-500">
                share
              </span>
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">Share Project</h2>
              <p className="text-xs text-slate-500">{projectName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Project Summary */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Project Summary
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
              <div>Nodes: {model.nodes.length}</div>
              <div>Members: {model.members.length}</div>
              <div>Supports: {model.supports.length}</div>
              <div>Materials: {model.materials.length}</div>
            </div>
          </div>

          {/* Access Level */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Access Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'view', label: 'View Only', icon: 'visibility' },
                { value: 'comment', label: 'Comment', icon: 'chat' },
                { value: 'edit', label: 'Edit', icon: 'edit' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setAccessLevel(option.value as AccessLevel)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors ${
                    accessLevel === option.value
                      ? 'border-structura-primary bg-structura-primary/5 text-structura-primary'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{option.icon}</span>
                  <span className="text-xs font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Expiration */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Link Expires In
            </label>
            <select
              value={expiresIn}
              onChange={(e) => setExpiresIn(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-structura-primary"
            >
              <option value="1h">1 hour</option>
              <option value="24h">24 hours</option>
              <option value="7d">7 days</option>
              <option value="30d">30 days</option>
              <option value="never">Never</option>
            </select>
          </div>

          {/* Share Link */}
          {shareLink ? (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Share Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-600 dark:text-slate-400"
                />
                <button
                  onClick={copyToClipboard}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    copied
                      ? 'bg-green-500 text-white'
                      : 'bg-structura-primary hover:bg-blue-700 text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                </button>
              </div>
              {copied && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  Link copied to clipboard!
                </p>
              )}
            </div>
          ) : (
            <button
              onClick={generateShareLink}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 py-3 bg-structura-primary hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">
                    progress_activity
                  </span>
                  Generating Link...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">link</span>
                  Generate Share Link
                </>
              )}
            </button>
          )}

          {/* Quick Actions */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Quick Actions</p>
            <div className="flex gap-2">
              <button
                onClick={() => window.open(`/project/${model.nodes[0]?.id || 'new'}/report`, '_blank')}
                className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">description</span>
                View Report
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
                Print
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
