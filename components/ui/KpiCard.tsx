'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export interface KpiCardProps {
  label: string;
  value: string | number;
  caption?: React.ReactNode;
  icon: React.ReactNode;
  variant?: 'green' | 'blue' | 'yellow' | 'crimson';
  href?: string;
  className?: string;
  isLoading?: boolean;
}

export function KpiCard({
  label,
  value,
  caption,
  icon,
  variant = 'blue',
  href,
  className = '',
  isLoading = false,
}: KpiCardProps) {
  const variantStyles = {
    green: {
      iconBg: 'bg-success-tint',
      iconText: 'text-success',
      cardBorder: 'border-border',
    },
    blue: {
      iconBg: 'bg-info-tint',
      iconText: 'text-info',
      cardBorder: 'border-border',
    },
    yellow: {
      iconBg: 'bg-brand-yellow-tint',
      iconText: 'text-brand-text-on-yellow',
      cardBorder: 'border-border',
    },
    crimson: {
      iconBg: 'bg-danger-tint',
      iconText: 'text-danger',
      cardBorder: 'border-danger/30',
    },
  }[variant];

  const content = (
    <div
      className={`bg-surface rounded-xl border ${variantStyles.cardBorder} p-4 hover:border-brand-yellow-400 transition-colors duration-150 group flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${variantStyles.iconBg} ${variantStyles.iconText}`}
          aria-hidden
        >
          {icon}
        </div>

        {href && (
          <div className="text-subtle group-hover:text-brand-red-500 transition-colors">
            <ArrowUpRight className="w-4 h-4" aria-hidden />
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
          {label}
        </div>
        <div className="text-[22px] leading-7 font-bold text-text tabular-nums font-mono mt-1">
          {isLoading ? (
            <div className="h-7 w-20 bg-neutral rounded animate-pulse" />
          ) : (
            value
          )}
        </div>
        {caption && (
          <div className="text-xs text-muted mt-1.5 flex items-center gap-1.5">
            {caption}
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red-500 rounded-xl"
      >
        {content}
      </Link>
    );
  }

  return content;
}
