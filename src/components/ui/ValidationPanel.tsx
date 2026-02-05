/**
 * ValidationPanel - Displays validation messages and solver warnings
 *
 * Updated with Structura Design System.
 */

'use client';

import React from 'react';
import { useModelStore } from '@/stores/modelStore';
import type { ValidationMessage } from '@/types/analysis';

interface ValidationPanelProps {
  messages: ValidationMessage[];
  className?: string;
}

export function ValidationPanel({ messages, className = '' }: ValidationPanelProps) {
  const { select, setMode } = useModelStore();

  const errors = messages.filter((m) => m.severity === 'error');
  const warnings = messages.filter((m) => m.severity === 'warning');

  const handleMessageClick = (msg: ValidationMessage) => {
    if (msg.entityType && msg.entityId) {
      // Select the entity and switch to select mode
      setMode('select');
      select({ type: msg.entityType as 'node' | 'member' | 'support' | 'load', id: msg.entityId });
    }
  };

  if (messages.length === 0) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span className="text-sm font-medium">No issues found</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Model is ready for analysis
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">error</span>
            Errors ({errors.length})
          </h4>
          <div className="space-y-1">
            {errors.map((msg, i) => (
              <MessageItem key={i} message={msg} onClick={() => handleMessageClick(msg)} />
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">warning</span>
            Warnings ({warnings.length})
          </h4>
          <div className="space-y-1">
            {warnings.map((msg, i) => (
              <MessageItem key={i} message={msg} onClick={() => handleMessageClick(msg)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface MessageItemProps {
  message: ValidationMessage;
  onClick: () => void;
}

function MessageItem({ message, onClick }: MessageItemProps) {
  const isClickable = message.entityType && message.entityId;

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={`
        px-3 py-2 rounded-lg text-xs
        ${
          message.severity === 'error'
            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
        }
        ${isClickable ? 'cursor-pointer hover:shadow-sm transition-shadow' : ''}
      `}
    >
      <div className="flex items-start gap-2">
        <span className="flex-1">{message.message}</span>
        {isClickable && (
          <span className="material-symbols-outlined text-[14px] text-slate-400">
            arrow_forward
          </span>
        )}
      </div>
      {message.entityType && message.entityId && (
        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
          <span className="material-symbols-outlined text-[12px]">
            {message.entityType === 'node'
              ? 'radio_button_unchecked'
              : message.entityType === 'member'
                ? 'segment'
                : 'category'}
          </span>
          {message.entityType}: {message.entityId}
        </div>
      )}
    </div>
  );
}

/**
 * Compact validation summary for toolbar/header
 */
export function ValidationSummary({ messages }: { messages: ValidationMessage[] }) {
  const errors = messages.filter((m) => m.severity === 'error').length;
  const warnings = messages.filter((m) => m.severity === 'warning').length;

  if (errors === 0 && warnings === 0) {
    return (
      <span className="text-green-600 dark:text-green-400 text-xs flex items-center gap-1 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
        <span className="material-symbols-outlined text-[12px]">check_circle</span>
        Valid
      </span>
    );
  }

  return (
    <span className="text-xs flex items-center gap-2">
      {errors > 0 && (
        <span className="text-red-600 dark:text-red-400 flex items-center gap-1 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
          <span className="material-symbols-outlined text-[12px]">error</span>
          {errors}
        </span>
      )}
      {warnings > 0 && (
        <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
          <span className="material-symbols-outlined text-[12px]">warning</span>
          {warnings}
        </span>
      )}
    </span>
  );
}
