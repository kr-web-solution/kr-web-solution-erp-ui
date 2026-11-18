'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/** Single primary yellow “go” CTA for stage footers (KR Flat Ops). */
export function StageAdvanceBar({
  title,
  hint,
  ctaLabel,
  disabled,
  busy,
  onAdvance,
}: {
  title: string;
  hint?: string;
  ctaLabel: string;
  disabled?: boolean;
  busy?: boolean;
  onAdvance: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-bg px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-bold text-text">{title}</p>
        {hint && <p className="text-xs text-muted mt-0.5">{hint}</p>}
      </div>
      <Button
        size="sm"
        variant="accent"
        disabled={disabled}
        isLoading={busy}
        onClick={onAdvance}
        icon={<ArrowRight className="w-3.5 h-3.5" aria-hidden />}
        iconPosition="right"
        className="shrink-0"
      >
        {ctaLabel}
      </Button>
    </div>
  );
}
