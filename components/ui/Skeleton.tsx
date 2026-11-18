'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className = '', width, height }: SkeletonProps) {
  return (
    <div
      style={{ width, height }}
      className={cn('animate-pulse rounded-lg bg-[#EEF1F5]', className)}
      aria-hidden
    />
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-[#E6E8EE]/60">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <Skeleton className={cn('h-4 w-full', i === 0 ? 'max-w-[140px]' : 'max-w-[100px]')} />
        </td>
      ))}
    </tr>
  );
}

export function TableSkeleton({
  rows = 6,
  cols = 5,
  className,
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-label="Loading"
      aria-live="polite"
      className={cn('overflow-hidden rounded-2xl border border-[#E6E8EE] bg-white', className)}
    >
      <div className="hidden border-b border-[#E6E8EE] bg-[#F6F7F9]/80 px-4 py-3 md:grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-16" />
        ))}
      </div>
      <table className="hidden w-full md:table">
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} cols={cols} />
          ))}
        </tbody>
      </table>
      <div className="divide-y divide-[#E6E8EE] md:hidden">
        {Array.from({ length: Math.min(rows, 4) }).map((_, i) => (
          <div key={i} className="space-y-2 p-4">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-3 rounded-2xl border border-[#E6E8EE] bg-white p-5', className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-5 w-44" />
      <Skeleton className="h-3 w-full" />
      <div className="flex justify-between border-t border-[#E6E8EE] pt-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-3', className)}
    >
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function KpiSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-[#E6E8EE] bg-white p-4', className)}>
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-2 h-7 w-28" />
      <Skeleton className="mt-3 h-3 w-16" />
    </div>
  );
}

export function KpiRowSkeleton({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn('grid gap-3 sm:grid-cols-2 xl:grid-cols-4', className)}
    >
      {Array.from({ length: count }).map((_, i) => (
        <KpiSkeleton key={i} />
      ))}
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function PanelSkeleton({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn('space-y-4 rounded-2xl border border-[#E6E8EE] bg-white p-5', className)}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function DetailPageSkeleton({ className }: { className?: string }) {
  return (
    <div role="status" aria-label="Loading" className={cn('w-full min-w-0 space-y-6 pb-12', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>
      <KpiRowSkeleton count={4} />
      <div className="grid gap-4 lg:grid-cols-3">
        <PanelSkeleton className="lg:col-span-2" />
        <PanelSkeleton />
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function ListPageSkeleton({
  showKpis = false,
  cols = 5,
  className,
}: {
  showKpis?: boolean;
  cols?: number;
  className?: string;
}) {
  return (
    <div role="status" aria-label="Loading" className={cn('w-full min-w-0 space-y-6', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-10 w-full max-w-xl rounded-lg" />
        <Skeleton className="h-4 w-40" />
      </div>
      {showKpis ? <KpiRowSkeleton /> : null}
      <TableSkeleton cols={cols} />
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function FormPageSkeleton({ className }: { className?: string }) {
  return (
    <div role="status" aria-label="Loading" className={cn('mx-auto w-full max-w-4xl space-y-6', className)}>
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="space-y-5 rounded-2xl border border-[#E6E8EE] bg-white p-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
        <div className="flex justify-end gap-2 pt-2">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function PageSkeleton({
  variant = 'list',
  className,
  cols = 5,
  showKpis = false,
}: {
  variant?: 'list' | 'detail' | 'form' | 'dashboard' | 'panel';
  className?: string;
  cols?: number;
  showKpis?: boolean;
}) {
  if (variant === 'detail') return <DetailPageSkeleton className={className} />;
  if (variant === 'form') return <FormPageSkeleton className={className} />;
  if (variant === 'panel') return <PanelSkeleton className={className} />;
  if (variant === 'dashboard') {
    return (
      <div role="status" aria-label="Loading" className={cn('w-full min-w-0 space-y-6', className)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
        <KpiRowSkeleton count={4} />
        <div className="grid gap-4 lg:grid-cols-3">
          <TableSkeleton className="lg:col-span-2" cols={4} rows={5} />
          <PanelSkeleton />
        </div>
        <KpiRowSkeleton count={3} />
        <span className="sr-only">Loading</span>
      </div>
    );
  }
  return <ListPageSkeleton className={className} cols={cols} showKpis={showKpis} />;
}
