'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { Sparkline } from '@/components/ui/Sparkline';
import { cn } from '@/lib/utils/cn';

export interface KpiCardProps {
  label: string;
  value: string | number;
  caption?: React.ReactNode;
  icon: React.ReactNode;
  variant?: 'green' | 'blue' | 'yellow' | 'crimson' | 'brand';
  emphasis?: 'soft' | 'solid';
  trend?: { label: string; positive?: boolean };
  sparkline?: number[];
  href?: string;
  className?: string;
  isLoading?: boolean;
}

const SOFT = {
  green: {
    iconBg: 'bg-success-tint',
    iconText: 'text-success',
    border: 'border-border',
  },
  blue: {
    iconBg: 'bg-info-tint',
    iconText: 'text-info',
    border: 'border-border',
  },
  yellow: {
    iconBg: 'bg-brand-yellow-tint',
    iconText: 'text-brand-text-on-yellow',
    border: 'border-border',
  },
  crimson: {
    iconBg: 'bg-danger-tint',
    iconText: 'text-danger',
    border: 'border-border',
  },
  brand: {
    iconBg: 'bg-brand-red-tint',
    iconText: 'text-brand-red-500',
    border: 'border-border',
  },
} as const;

/**
 * SilverLogix-style KPI: icon + label, big value, sparkline, trend %.
 */
export function KpiCard({
  label,
  value,
  caption,
  icon,
  variant = 'blue',
  emphasis = 'soft',
  trend,
  sparkline,
  href,
  className = '',
  isLoading = false,
}: KpiCardProps) {
  const soft = SOFT[variant];
  const solid = emphasis === 'solid';
  const trendPositive = trend?.positive !== false;

  const content = (
    <div
      className={cn(
        'group flex h-full min-h-[118px] flex-col justify-between rounded-2xl border p-4 transition-colors duration-150',
        solid
          ? 'border-transparent bg-brand-red-500 text-white shadow-[0_10px_28px_rgba(227,43,43,0.18)]'
          : cn('bg-surface shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:border-brand-red-500/25', soft.border),
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              solid ? 'bg-white/15 text-white' : cn(soft.iconBg, soft.iconText)
            )}
            aria-hidden
          >
            {icon}
          </div>
          <div className="min-w-0">
            <p
              className={cn(
                'truncate text-xs font-semibold',
                solid ? 'text-white/80' : 'text-muted'
              )}
            >
              {label}
            </p>
            <div
              className={cn(
                'mt-0.5 font-mono text-[24px] font-bold leading-7 tabular-nums tracking-tight',
                solid ? 'text-white' : 'text-text'
              )}
            >
              {isLoading ? (
                <Skeleton className="mt-1 h-7 w-24" />
              ) : (
                value
              )}
            </div>
          </div>
        </div>

        {sparkline && sparkline.length > 0 && !isLoading && (
          <Sparkline values={sparkline} positive={trendPositive} className="mt-1 hidden sm:block" />
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        {trend ? (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-bold tabular-nums',
              solid
                ? 'text-white'
                : trendPositive
                  ? 'text-success'
                  : 'text-danger'
            )}
          >
            {trendPositive ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {trend.label}
          </span>
        ) : (
          <span />
        )}
        {caption && (
          <span className={cn('truncate text-[11px]', solid ? 'text-white/65' : 'text-subtle')}>
            {caption}
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red-500"
      >
        {content}
      </Link>
    );
  }

  return content;
}
