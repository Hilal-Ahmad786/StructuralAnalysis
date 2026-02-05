/**
 * MainLayout - Standard layout wrapper for authenticated pages
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps): JSX.Element {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {children}
    </div>
  );
}

/**
 * PageHeader - Consistent header for main pages
 */
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  backLink?: string;
}

export function PageHeader({ 
  title, 
  description, 
  actions, 
  backLink 
}: PageHeaderProps): JSX.Element {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-start gap-4">
        {backLink && (
          <Link
            href={backLink}
            className="mt-1 p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
        )}
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {description && (
            <p className="text-gray-400 mt-1">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}

/**
 * PageContainer - Centered content container
 */
interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export function PageContainer({ 
  children, 
  maxWidth = 'xl' 
}: PageContainerProps): JSX.Element {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full',
  };

  return (
    <main className={`mx-auto w-full ${maxWidthClasses[maxWidth]} px-4 py-8`}>
      {children}
    </main>
  );
}

/**
 * Sidebar - Side navigation panel
 */
interface SidebarProps {
  children: React.ReactNode;
  width?: number;
}

export function Sidebar({ children, width = 256 }: SidebarProps): JSX.Element {
  return (
    <aside 
      className="bg-gray-900 border-r border-gray-800 h-full overflow-y-auto"
      style={{ width }}
    >
      {children}
    </aside>
  );
}

/**
 * SidebarNav - Navigation links for sidebar
 */
interface NavItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

interface SidebarNavProps {
  items: NavItem[];
}

export function SidebarNav({ items }: SidebarNavProps): JSX.Element {
  const pathname = usePathname();

  return (
    <nav className="p-4 space-y-1">
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
              ${isActive 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }
            `}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Card - Content card component
 */
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ 
  children, 
  className = '', 
  padding = 'md' 
}: CardProps): JSX.Element {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-lg ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
}

/**
 * CardHeader - Header section for cards
 */
interface CardHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function CardHeader({ title, description, action }: CardHeaderProps): JSX.Element {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {description && (
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/**
 * EmptyState - Placeholder for empty content
 */
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action 
}: EmptyStateProps): JSX.Element {
  return (
    <div className="text-center py-12">
      {icon && (
        <div className="mx-auto w-12 h-12 text-gray-600 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-white mb-1">{title}</h3>
      {description && (
        <p className="text-gray-400 mb-4">{description}</p>
      )}
      {action}
    </div>
  );
}
