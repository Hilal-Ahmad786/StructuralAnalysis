/**
 * Toast Notification System
 * 
 * Provides user feedback for actions like save, copy, errors, etc.
 */

'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string | undefined;
  duration?: number | undefined;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
}

// ============================================================================
// Context
// ============================================================================

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// ============================================================================
// Provider
// ============================================================================

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps): JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    // Auto remove after duration
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  }, [removeToast]);

  const success = useCallback((message: string, description?: string) => {
    addToast({ type: 'success', message, description });
  }, [addToast]);

  const error = useCallback((message: string, description?: string) => {
    addToast({ type: 'error', message, description, duration: 8000 });
  }, [addToast]);

  const warning = useCallback((message: string, description?: string) => {
    addToast({ type: 'warning', message, description });
  }, [addToast]);

  const info = useCallback((message: string, description?: string) => {
    addToast({ type: 'info', message, description });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// ============================================================================
// Toast Container
// ============================================================================

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps): JSX.Element | null {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

// ============================================================================
// Toast Item
// ============================================================================

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps): JSX.Element {
  const [isExiting, setIsExiting] = useState(false);

  const handleRemove = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 200);
  }, [toast.id, onRemove]);

  const config = getToastConfig(toast.type);

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg shadow-lg border backdrop-blur-sm
        transform transition-all duration-200 ease-out
        ${isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}
        ${config.bg} ${config.border}
      `}
      role="alert"
    >
      <div className={`flex-shrink-0 ${config.iconColor}`}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${config.textColor}`}>
          {toast.message}
        </p>
        {toast.description && (
          <p className={`text-xs mt-1 ${config.descColor}`}>
            {toast.description}
          </p>
        )}
      </div>
      <button
        onClick={handleRemove}
        className={`flex-shrink-0 p-1 rounded hover:bg-black/10 transition-colors ${config.closeColor}`}
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function getToastConfig(type: ToastType) {
  switch (type) {
    case 'success':
      return {
        bg: 'bg-green-900/90',
        border: 'border-green-700',
        iconColor: 'text-green-400',
        textColor: 'text-green-100',
        descColor: 'text-green-300',
        closeColor: 'text-green-300',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ),
      };
    case 'error':
      return {
        bg: 'bg-red-900/90',
        border: 'border-red-700',
        iconColor: 'text-red-400',
        textColor: 'text-red-100',
        descColor: 'text-red-300',
        closeColor: 'text-red-300',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ),
      };
    case 'warning':
      return {
        bg: 'bg-yellow-900/90',
        border: 'border-yellow-700',
        iconColor: 'text-yellow-400',
        textColor: 'text-yellow-100',
        descColor: 'text-yellow-300',
        closeColor: 'text-yellow-300',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ),
      };
    case 'info':
    default:
      return {
        bg: 'bg-blue-900/90',
        border: 'border-blue-700',
        iconColor: 'text-blue-400',
        textColor: 'text-blue-100',
        descColor: 'text-blue-300',
        closeColor: 'text-blue-300',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      };
  }
}
