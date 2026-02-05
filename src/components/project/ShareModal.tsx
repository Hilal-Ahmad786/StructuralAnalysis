/**
 * ShareModal - Create and manage share links for a project
 */

'use client';

import React, { useState, useEffect } from 'react';

interface ShareLink {
  id: string;
  token: string;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
  access_count: number;
}

interface ShareModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ projectId, isOpen, onClose }: ShareModalProps) {
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<string>('7'); // days

  // Fetch existing share links
  useEffect(() => {
    const fetchLinks = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const res = await fetch(`/api/share?projectId=${projectId}`);
        if (!res.ok) throw new Error('Failed to fetch share links');
        
        const data = await res.json();
        setLinks(data.links || []);
      } catch (err) {
        setError('Failed to load share links');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    if (isOpen) {
      fetchLinks();
    }
  }, [isOpen, projectId]);

  const createLink = async () => {
    setCreating(true);
    setError(null);
    
    try {
      const expiresAt = expiresIn === 'never' 
        ? null 
        : new Date(Date.now() + parseInt(expiresIn) * 24 * 60 * 60 * 1000).toISOString();
      
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, expiresAt }),
      });
      
      if (!res.ok) throw new Error('Failed to create share link');
      
      const data = await res.json();
      setLinks([data.link, ...links]);
    } catch (err) {
      setError('Failed to create share link');
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const deleteLink = async (linkId: string) => {
    try {
      const link = links.find(l => l.id === linkId);
      if (!link) return;
      
      const res = await fetch(`/api/share/${link.token}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) throw new Error('Failed to delete share link');
      
      setLinks(links.filter(l => l.id !== linkId));
    } catch (err) {
      setError('Failed to delete share link');
      console.error(err);
    }
  };

  const copyLink = async (token: string, linkId: string) => {
    const url = `${window.location.origin}/share/${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(linkId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gray-900 rounded-lg shadow-xl border border-gray-800 w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Share Project</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="px-6 py-4">
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
              {error}
            </div>
          )}
          
          {/* Create new link */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Create new share link
            </label>
            <div className="flex gap-2">
              <select
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">Expires in 1 day</option>
                <option value="7">Expires in 7 days</option>
                <option value="30">Expires in 30 days</option>
                <option value="never">Never expires</option>
              </select>
              <button
                onClick={createLink}
                disabled={creating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white text-sm font-medium rounded-md transition-colors"
              >
                {creating ? 'Creating...' : 'Create Link'}
              </button>
            </div>
          </div>
          
          {/* Existing links */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-2">
              Active Links ({links.filter(l => l.is_active).length})
            </h3>
            
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : links.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No share links yet. Create one above.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {links.map((link) => (
                  <div
                    key={link.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      link.is_active ? 'bg-gray-800' : 'bg-gray-800/50 opacity-60'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-blue-400 truncate">
                          /share/{link.token.slice(0, 8)}...
                        </code>
                        {!link.is_active && (
                          <span className="text-xs text-red-400">Expired</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Created {formatDate(link.created_at)}
                        {link.expires_at && ` · Expires ${formatDate(link.expires_at)}`}
                        {!link.expires_at && ' · Never expires'}
                        {' · '}{link.access_count} views
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => copyLink(link.token, link.id)}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        title="Copy link"
                      >
                        {copiedId === link.id ? (
                          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => deleteLink(link.id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        title="Delete link"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
