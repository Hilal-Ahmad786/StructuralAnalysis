/**
 * Loading Skeleton Components
 * 
 * Provides visual placeholders during loading states.
 */

import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps): JSX.Element {
  const baseClasses = 'bg-gray-800';
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  const style: React.CSSProperties = {
    width: width ?? (variant === 'text' ? '100%' : undefined),
    height: height ?? (variant === 'text' ? '1em' : undefined),
  };

  return (
    <div
      className={`${baseClasses} ${animationClasses[animation]} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

/**
 * SkeletonText - Multiple lines of text skeleton
 */
interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className = '' }: SkeletonTextProps): JSX.Element {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height={16}
          width={i === lines - 1 ? '70%' : '100%'}
        />
      ))}
    </div>
  );
}

/**
 * SkeletonCard - Card placeholder
 */
interface SkeletonCardProps {
  className?: string;
  showImage?: boolean;
}

export function SkeletonCard({ className = '', showImage = true }: SkeletonCardProps): JSX.Element {
  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-lg p-4 ${className}`}>
      {showImage && (
        <Skeleton height={120} className="mb-4" />
      )}
      <Skeleton variant="text" height={20} width="60%" className="mb-2" />
      <SkeletonText lines={2} />
    </div>
  );
}

/**
 * SkeletonTable - Table placeholder
 */
interface SkeletonTableProps {
  rows?: number;
  cols?: number;
  className?: string;
}

export function SkeletonTable({ rows = 5, cols = 4, className = '' }: SkeletonTableProps): JSX.Element {
  return (
    <div className={`overflow-hidden rounded-lg border border-gray-800 ${className}`}>
      {/* Header */}
      <div className="bg-gray-800 flex gap-4 p-3">
        {Array.from({ length: cols }, (_, i) => (
          <Skeleton key={i} height={16} width={i === 0 ? 100 : 80} />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-3 border-t border-gray-800">
          {Array.from({ length: cols }, (_, colIndex) => (
            <Skeleton key={colIndex} height={14} width={colIndex === 0 ? 100 : 80} />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * SkeletonProjectCard - Project card placeholder for dashboard
 */
export function SkeletonProjectCard(): JSX.Element {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <Skeleton height={20} width={150} />
        <Skeleton variant="circular" width={24} height={24} />
      </div>
      <Skeleton height={12} width={100} className="mb-3" />
      <div className="flex gap-2">
        <Skeleton height={20} width={60} />
        <Skeleton height={20} width={60} />
        <Skeleton height={20} width={60} />
      </div>
    </div>
  );
}

/**
 * SkeletonDashboard - Full dashboard loading state
 */
export function SkeletonDashboard(): JSX.Element {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-800">
        <Skeleton height={28} width={180} />
        <div className="flex gap-4">
          <Skeleton height={36} width={100} />
          <Skeleton variant="circular" width={36} height={36} />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Title */}
        <div className="flex items-center justify-between mb-6">
          <Skeleton height={32} width={200} />
          <Skeleton height={40} width={140} />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <SkeletonProjectCard key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}

/**
 * SkeletonEditor - Editor loading state
 */
export function SkeletonEditor(): JSX.Element {
  return (
    <div className="h-screen flex flex-col bg-gray-950">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton height={24} width={200} />
        </div>
        <div className="flex gap-3">
          <Skeleton height={32} width={80} />
          <Skeleton height={32} width={80} />
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 border-b border-gray-800">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} width={36} height={36} />
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Canvas placeholder */}
        <div className="flex-1 bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <Skeleton variant="circular" width={48} height={48} className="mx-auto mb-4" />
            <Skeleton height={16} width={120} className="mx-auto" />
          </div>
        </div>

        {/* Side panel */}
        <div className="w-72 bg-gray-900 border-l border-gray-800 p-4">
          <Skeleton height={20} width={100} className="mb-4" />
          <SkeletonText lines={4} />
        </div>
      </div>
    </div>
  );
}

/**
 * LoadingSpinner - Animated spinner
 */
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps): JSX.Element {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  return (
    <svg
      className={`animate-spin ${sizeClasses[size]} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
