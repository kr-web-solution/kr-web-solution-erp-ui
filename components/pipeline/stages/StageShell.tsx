'use client';

import React from 'react';

const ACCENT_BAR: Record<string, string> = {
  red: 'bg-brand-red-500',
  amber: 'bg-brand-yellow-400',
  green: 'bg-success',
  blue: 'bg-info',
  slate: 'bg-subtle',
};

export function StageShell({
  eyebrow,
  title,
  description,
  accent = 'red',
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  accent?: 'red' | 'amber' | 'green' | 'blue' | 'slate';
  children: React.ReactNode;
}) {
  return (
    <div className="ops-surface overflow-hidden">
      <div className={`h-1 w-full ${ACCENT_BAR[accent] || ACCENT_BAR.red}`} aria-hidden />
      <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-border">
        <p className="ops-eyebrow">{eyebrow}</p>
        <h2 className="mt-1 text-lg font-heading font-bold text-text tracking-[-0.02em]">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      <div className="p-4 sm:p-5 space-y-5">{children}</div>
    </div>
  );
}

export function StageSection({
  icon,
  title,
  subtitle,
  children,
  className = '',
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="flex items-start gap-2.5 mb-2.5">
        {icon && (
          <div
            className="w-8 h-8 rounded-lg bg-bg border border-border flex items-center justify-center text-brand-red-500 shrink-0"
            aria-hidden
          >
            {icon}
          </div>
        )}
        <div className="min-w-0 pt-0.5">
          <h3 className="text-sm font-bold text-text">{title}</h3>
          {subtitle && <p className="text-[12px] text-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
