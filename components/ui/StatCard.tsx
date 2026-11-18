import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  href?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  href,
  trend,
  className,
}: StatCardProps) {
  const content = (
    <div
      className={cn(
        'bg-white rounded-xl border border-[#E7E9EF] p-5 shadow-xs hover:border-[#FD322E]/40 transition-all flex flex-col justify-between h-full',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#667085]">
            {title}
          </span>
          <div className="mt-2 text-2xl lg:text-3xl font-bold text-[#191919] tabular-nums tracking-tight">
            {value}
          </div>
        </div>
        <div className="p-2.5 rounded-lg bg-[#F8F9FB] text-[#620C13] border border-[#E7E9EF] shrink-0" aria-hidden="true">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-4 pt-3 border-t border-[#E7E9EF]/60 flex items-center justify-between text-xs text-[#667085]">
          {subtitle && <span>{subtitle}</span>}
          {trend && (
            <span
              className={cn(
                'font-semibold inline-flex items-center gap-1',
                trend.isPositive ? 'text-[#027A48]' : 'text-[#B42318]'
              )}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FD322E] rounded-xl"
        aria-label={`${title}: ${value}. Click to view details.`}
      >
        {content}
      </Link>
    );
  }

  return (
    <div role="region" aria-label={`${title}: ${value}`}>
      {content}
    </div>
  );
}

