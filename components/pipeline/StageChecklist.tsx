'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface ChecklistLike {
  id: string;
  stage_number: number;
  sort_order: number;
  is_done: boolean;
  label: string;
}

interface Props {
  items: ChecklistLike[];
  stage: number;
  disabled?: boolean;
  onToggle?: (itemId: string) => void;
}

export function StageChecklist({ items, stage, disabled, onToggle }: Props) {
  const scoped = items
    .filter((i) => i.stage_number === stage)
    .sort((a, b) => a.sort_order - b.sort_order);

  if (!scoped.length) {
    return (
      <p className="text-sm text-muted py-3">
        No checklist for this stage. Set enquiry source / details, then advance.
      </p>
    );
  }

  const done = scoped.filter((i) => i.is_done).length;
  const pct = Math.round((done / scoped.length) * 100);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-text">Stage checklist</p>
          <p className="text-[11px] text-muted mt-0.5">
            {done} of {scoped.length} complete
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-text tabular-nums bg-bg border border-border rounded-md px-2 py-1">
          {pct}%
        </span>
      </div>
      <div className="ops-progress">
        <span style={{ width: `${pct}%` }} />
      </div>
      <ul className="space-y-1.5">
        {scoped.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onToggle?.(item.id)}
              className={`w-full flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors duration-150 ${
                item.is_done
                  ? 'bg-success-tint border-success/20 text-success'
                  : 'bg-surface border-border text-text hover:border-brand-yellow-400 hover:bg-brand-yellow-tint/40'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span
                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                  item.is_done
                    ? 'bg-success border-success text-white'
                    : 'bg-surface border-border text-transparent'
                }`}
                aria-hidden
              >
                <Check className="w-3 h-3" strokeWidth={3} />
              </span>
              <span className={`font-semibold ${item.is_done ? 'line-through decoration-success/40' : ''}`}>
                {item.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
