'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  MoreVertical,
} from 'lucide-react';
import { CardSkeleton, TableRowSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  accessor?: (row: T) => any;
  render?: (row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  searchPlaceholder?: string;
  searchFilter?: (row: T, query: string) => boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyAction?: {
    label: string;
    onClick: () => void;
  };
  emptyState?: React.ReactNode;
  toolbarSlot?: React.ReactNode;
  pageSize?: number;
  mobileCardRenderer?: (row: T) => React.ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  isLoading = false,
  searchPlaceholder,
  searchFilter,
  emptyTitle = 'No records found',
  emptySubtitle = 'Try adjusting your filters or search terms.',
  emptyAction,
  emptyState,
  toolbarSlot,
  pageSize: initialPageSize = 10,
  mobileCardRenderer,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Search filter
  const filteredData = useMemo(() => {
    if (!search.trim() || !searchFilter) return data;
    return data.filter((row) => searchFilter(row, search.trim()));
  }, [data, search, searchFilter]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return filteredData;

    return [...filteredData].sort((a, b) => {
      const valA = col.accessor ? col.accessor(a) : (a as any)[col.key];
      const valB = col.accessor ? col.accessor(b) : (b as any)[col.key];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortKey, sortDirection, columns]);

  // Pagination calculations
  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else {
        setSortKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-3">
      {/* Optional Toolbar: Search & Slot */}
      {(searchFilter || toolbarSlot) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {searchFilter && (
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={searchPlaceholder || 'Search records...'}
                className="w-full h-10 pl-9 pr-3.5 bg-white border border-[#E6E8EE] rounded-[10px] text-xs sm:text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E32B2B]"
              />
            </div>
          )}
          {toolbarSlot && <div className="flex items-center gap-2">{toolbarSlot}</div>}
        </div>
      )}

      {/* Main Table Container (Desktop) */}
      <div className="bg-white rounded-2xl border border-[#E6E8EE] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_16px_rgba(16,24,40,0.04)] overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E6E8EE] bg-[#F6F7F9]/70 text-[#64748B] uppercase tracking-wider font-semibold text-[11px] sticky top-0 z-10 select-none">
                {columns.map((col) => {
                  const isSorted = sortKey === col.key;
                  return (
                    <th
                      key={col.key}
                      scope="col"
                      onClick={() => col.sortable && handleSort(col.key)}
                      className={`px-4 py-3.5 ${
                        col.sortable ? 'cursor-pointer hover:text-[#0F172A]' : ''
                      } ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${
                        col.className || ''
                      }`}
                    >
                      <div
                        className={`inline-flex items-center gap-1.5 ${
                          col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'
                        }`}
                      >
                        <span>{col.header}</span>
                        {col.sortable && (
                          <span className="text-[#94A3B8]">
                            {isSorted ? (
                              sortDirection === 'asc' ? (
                                <ChevronUp className="w-3.5 h-3.5 text-[#E32B2B]" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-[#E32B2B]" />
                              )
                            ) : (
                              <ChevronsUpDown className="w-3.5 h-3.5" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E8EE]">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={columns.length} />
                ))
              ) : paginatedData.length > 0 ? (
                paginatedData.map((row) => (
                  <tr
                    key={keyExtractor(row)}
                    onClick={() => onRowClick?.(row)}
                    className={`transition-colors ${
                      onRowClick ? 'cursor-pointer hover:bg-[#F6F7F9]' : 'hover:bg-[#F6F7F9]/50'
                    }`}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3.5 text-[#0F172A] ${
                          col.align === 'right' ? 'text-right tabular-nums' : col.align === 'center' ? 'text-center' : 'text-left'
                        } ${col.className || ''}`}
                      >
                        {col.render ? col.render(row) : (row as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="p-8 text-center">
                    {emptyState || (
                      <EmptyState
                        title={emptyTitle}
                        subtitle={emptySubtitle}
                        action={emptyAction}
                        className="border-none shadow-none"
                      />
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View (Cards) below 768px */}
        <div className="md:hidden divide-y divide-[#E6E8EE]">
          {isLoading ? (
            <div className="space-y-0 divide-y divide-[#E6E8EE]">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4">
                  <CardSkeleton className="border-0 p-0 shadow-none" />
                </div>
              ))}
            </div>
          ) : paginatedData.length > 0 ? (
            paginatedData.map((row) => (
              <div
                key={keyExtractor(row)}
                onClick={() => onRowClick?.(row)}
                className={`p-4 transition-colors ${onRowClick ? 'cursor-pointer active:bg-[#F6F7F9]' : ''}`}
              >
                {mobileCardRenderer ? (
                  mobileCardRenderer(row)
                ) : (
                  <div className="space-y-1.5">
                    {columns.map((col) => (
                      <div key={col.key} className="flex justify-between items-center text-xs">
                        <span className="text-[#64748B] font-medium">{col.header}</span>
                        <span className="text-[#0F172A] font-semibold text-right">
                          {col.render ? col.render(row) : (row as any)[col.key]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-6 text-center">
              {emptyState || (
                <EmptyState
                  title={emptyTitle}
                  subtitle={emptySubtitle}
                  action={emptyAction}
                  className="border-none shadow-none"
                />
              )}
            </div>
          )}
        </div>

        {/* Orders / GlobalBank Pagination Footer */}
        {totalItems > 0 && (
          <div className="px-5 py-3.5 border-t border-[#E6E8EE] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#64748B]">
            <div className="font-mono tabular-nums">
              Showing <span className="font-bold text-[#0F172A]">{startIndex + 1}</span> to{' '}
              <span className="font-bold text-[#0F172A]">{endIndex}</span> of{' '}
              <span className="font-bold text-[#0F172A]">{totalItems}</span> results
            </div>

            <div className="flex items-center gap-4 self-end sm:self-auto">
              <div className="flex items-center gap-1.5">
                <span>Items per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="h-8 px-2 bg-white border border-[#E6E8EE] rounded-md text-xs font-semibold text-[#0F172A] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E32B2B]"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-md border border-[#E6E8EE] hover:bg-[#F6F7F9] text-[#64748B] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-mono font-bold text-[#0F172A] tabular-nums">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-md border border-[#E6E8EE] hover:bg-[#F6F7F9] text-[#64748B] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
