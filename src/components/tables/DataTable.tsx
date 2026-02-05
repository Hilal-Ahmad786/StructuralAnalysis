/**
 * DataTable - Generic data table component
 * 
 * Displays tabular data with sorting, selection, and actions.
 */

'use client';

import React, { useState, useMemo } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T extends { id: string }> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  onRowSelect?: (selectedIds: string[]) => void;
  selectable?: boolean;
  emptyMessage?: string;
  className?: string;
  compact?: boolean;
}

type SortDirection = 'asc' | 'desc' | null;

// ============================================================================
// Component
// ============================================================================

export function DataTable<T extends { id: string }>({
  data,
  columns,
  onRowClick,
  onRowSelect,
  selectable = false,
  emptyMessage = 'No data available',
  className = '',
  compact = false,
}: DataTableProps<T>): JSX.Element {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Handle sorting
  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortKey(null);
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const aVal = getNestedValue(a, sortKey);
      const bVal = getNestedValue(b, sortKey);

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal < bVal ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortKey, sortDirection]);

  // Handle selection
  const handleSelectAll = () => {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
      onRowSelect?.([]);
    } else {
      const allIds = new Set(data.map((row) => row.id));
      setSelectedIds(allIds);
      onRowSelect?.(Array.from(allIds));
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    onRowSelect?.(Array.from(newSelected));
  };

  // Cell padding based on compact mode
  const cellPadding = compact ? 'px-3 py-2' : 'px-4 py-3';

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-800 border-b border-gray-700">
            {selectable && (
              <th className={`${cellPadding} w-10`}>
                <input
                  type="checkbox"
                  checked={selectedIds.size === data.length && data.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={`
                  ${cellPadding} text-xs font-semibold text-gray-400 uppercase tracking-wider
                  ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}
                  ${column.sortable ? 'cursor-pointer hover:text-white' : ''}
                `}
                style={{ width: column.width }}
                onClick={() => column.sortable && handleSort(String(column.key))}
              >
                <span className="flex items-center gap-1">
                  {column.header}
                  {column.sortable && sortKey === String(column.key) && (
                    <SortIcon direction={sortDirection} />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className={`${cellPadding} text-center text-gray-500`}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((row, rowIndex) => (
              <tr
                key={row.id}
                className={`
                  border-b border-gray-800 
                  ${onRowClick ? 'cursor-pointer hover:bg-gray-800/50' : ''}
                  ${selectedIds.has(row.id) ? 'bg-blue-900/20' : ''}
                `}
                onClick={() => onRowClick?.(row)}
              >
                {selectable && (
                  <td className={cellPadding} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(row.id)}
                      onChange={() => handleSelectRow(row.id)}
                      className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                )}
                {columns.map((column) => {
                  const value = getNestedValue(row, String(column.key));
                  return (
                    <td
                      key={String(column.key)}
                      className={`
                        ${cellPadding} text-sm text-gray-300
                        ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}
                      `}
                    >
                      {column.render
                        ? column.render(value, row, rowIndex)
                        : formatValue(value)}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function getNestedValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce((acc: unknown, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

function formatValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined) return '–';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return value.toString();
    return value.toFixed(3);
  }
  return String(value);
}

function SortIcon({ direction }: { direction: SortDirection }): JSX.Element {
  if (direction === 'asc') {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    );
  }
  if (direction === 'desc') {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  );
}

// ============================================================================
// Specialized Tables
// ============================================================================

/**
 * ResultsTable - Pre-configured table for analysis results
 */
interface ResultsTableProps {
  title: string;
  data: Array<{ id: string; [key: string]: unknown }>;
  columns: Column<{ id: string; [key: string]: unknown }>[];
}

export function ResultsTable({ title, data, columns }: ResultsTableProps): JSX.Element {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">
        {title}
      </h3>
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <DataTable data={data} columns={columns} compact />
      </div>
    </div>
  );
}
