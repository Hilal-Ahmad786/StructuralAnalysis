/**
 * ReportHeader - Project identification and date
 */

import React from 'react';

interface ReportHeaderProps {
  projectName: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  userName?: string | undefined;
}

export function ReportHeader({ 
  projectName, 
  projectId, 
  createdAt, 
  updatedAt,
  userName 
}: ReportHeaderProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <header className="mb-8 pb-6 border-b-2 border-gray-300">
      {/* Logo and Title */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Structural Analysis Report
          </h1>
          <p className="text-lg text-gray-600">{projectName}</p>
        </div>
        <div className="text-right text-sm text-gray-500">
          <p className="font-mono">ID: {projectId.slice(0, 8)}</p>
        </div>
      </div>

      {/* Meta Information */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        {userName && (
          <div>
            <p className="text-gray-500">Author</p>
            <p className="font-medium text-gray-900">{userName}</p>
          </div>
        )}
        <div>
          <p className="text-gray-500">Created</p>
          <p className="font-medium text-gray-900">{formatDate(createdAt)}</p>
        </div>
        <div>
          <p className="text-gray-500">Last Modified</p>
          <p className="font-medium text-gray-900">{formatDate(updatedAt)}</p>
        </div>
        <div>
          <p className="text-gray-500">Generated</p>
          <p className="font-medium text-gray-900">{formatDate(new Date().toISOString())}</p>
        </div>
      </div>
    </header>
  );
}
