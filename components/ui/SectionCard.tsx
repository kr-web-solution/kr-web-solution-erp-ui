'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export interface SectionCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconColor?: string;
  badge?: React.ReactNode;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  headerSlot?: React.ReactNode;
  id?: string;
}

export function SectionCard({
  title,
  subtitle,
  icon,
  badge,
  action,
  children,
  className = '',
  bodyClassName = '',
  headerSlot,
  id,
}: SectionCardProps) {
  return (
    <div
      id={id}
      className={`bg-surface rounded-xl border border-border overflow-hidden flex flex-col ${className}`}
    >
      <div className="px-4 py-3 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-surface">
        <div className="flex items-center gap-2.5 min-w-0">
          {icon && (
            <div
              className="w-8 h-8 rounded-lg bg-bg border border-border flex items-center justify-center text-brand-red-500 shrink-0"
              aria-hidden
            >
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] leading-[22px] font-bold text-text truncate">
                {title}
              </h2>
              {badge}
            </div>
            {subtitle && (
              <p className="text-xs text-muted mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {headerSlot}
          {action && action.href && (
            <Link
              href={action.href}
              className="text-xs font-semibold text-brand-red-500 hover:text-brand-red-hover inline-flex items-center gap-1"
            >
              <span>{action.label}</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden />
            </Link>
          )}
          {action && action.onClick && (
            <button
              type="button"
              onClick={action.onClick}
              className="text-xs font-semibold text-brand-red-500 hover:text-brand-red-hover inline-flex items-center gap-1 cursor-pointer"
            >
              <span>{action.label}</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden />
            </button>
          )}
        </div>
      </div>

      <div className={`p-4 flex-1 ${bodyClassName}`}>{children}</div>
    </div>
  );
}
