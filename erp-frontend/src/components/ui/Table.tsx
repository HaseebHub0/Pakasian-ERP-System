import React from 'react';
import EmptyState from './EmptyState';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T = any> {
  key: string;
  label: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
}

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

interface TableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  pagination?: PaginationProps;
  rowKey?: string | ((row: T) => string | number);
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  className?: string;
}

function SkeletonRow({ columns }: { columns: Column[] }) {
  return (
    <tr>
      {columns.map((col) => (
        <td key={col.key} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        </td>
      ))}
    </tr>
  );
}

export default function Table<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  pagination,
  rowKey = 'id',
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your search or filters.',
  onRowClick,
  className = '',
}: TableProps<T>) {
  const getKey = (row: T, index: number): string | number => {
    if (typeof rowKey === 'function') return rowKey(row);
    return row[rowKey] ?? index;
  };

  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
    : 1;

  return (
    <div className={`flex flex-col gap-0 ${className}`}>
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          {/* Header */}
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap ${col.headerClassName ?? ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <SkeletonRow key={i} columns={columns} />
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={getKey(row, index)}
                  onClick={() => onRowClick?.(row)}
                  className={`transition-colors duration-100 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  } ${onRowClick ? 'cursor-pointer hover:bg-indigo-50/60' : 'hover:bg-gray-50'}`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 text-gray-700 whitespace-nowrap ${col.className ?? ''}`}
                    >
                      {col.render
                        ? col.render(row[col.key], row, index)
                        : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && !loading && data.length > 0 && (
        <div className="flex items-center justify-between px-1 pt-4">
          <p className="text-sm text-gray-500">
            Showing{' '}
            <span className="font-medium text-gray-700">
              {Math.min((pagination.page - 1) * pagination.pageSize + 1, pagination.total)}
            </span>{' '}
            –{' '}
            <span className="font-medium text-gray-700">
              {Math.min(pagination.page * pagination.pageSize, pagination.total)}
            </span>{' '}
            of <span className="font-medium text-gray-700">{pagination.total}</span> results
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
              Prev
            </button>

            <span className="text-sm font-medium text-gray-600 px-2">
              Page {pagination.page} of {totalPages}
            </span>

            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
