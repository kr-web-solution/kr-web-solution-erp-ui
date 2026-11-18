'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { SALES_PIPELINE_STAGES, stageLabel } from '@/lib/workflow';

type Mode = 'founder' | 'worker' | 'client';

interface Props {
  currentStage: number;
  focusStage?: number;
  mode?: Mode;
  onSelectStage?: (stage: number) => void;
  deliveryPhaseLabel?: string | null;
}

export function EngagementStageStepper({
  currentStage,
  focusStage,
  mode = 'founder',
  onSelectStage,
  deliveryPhaseLabel,
}: Props) {
  const stages = SALES_PIPELINE_STAGES;
  const inDelivery = currentStage > 5;
  const focused = focusStage ?? Math.min(currentStage, 5);

  return (
    <ol className="relative space-y-1">
      <div className="absolute left-[19px] top-3 bottom-3 w-px bg-border" aria-hidden />
      {stages.map((stage) => {
        const done = stage.number < currentStage || inDelivery;
        const active = !inDelivery && stage.number === currentStage;
        const isFocus = stage.number === focused;
        const label = stageLabel(stage.number, mode);
        return (
          <li key={stage.number} className="relative">
            <button
              type="button"
              onClick={() => onSelectStage?.(stage.number)}
              className={`w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-colors duration-150 border cursor-pointer ${
                isFocus
                  ? 'bg-brand-yellow-tint border-brand-yellow-400'
                  : active
                  ? 'bg-surface border-brand-red-500/35'
                  : done
                  ? 'bg-success-tint/60 border-success/20'
                  : 'bg-surface border-transparent hover:border-border'
              }`}
            >
              <span
                className={`relative z-[1] w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                  isFocus || active
                    ? 'bg-brand-red-500 text-white'
                    : done
                    ? 'bg-success text-white'
                    : 'bg-bg text-muted border border-border'
                }`}
              >
                {done && !isFocus ? (
                  <Check className="w-3.5 h-3.5" aria-hidden />
                ) : (
                  String(stage.number).padStart(2, '0')
                )}
              </span>
              <div className="min-w-0">
                <span
                  className={`block text-xs font-bold leading-snug ${
                    isFocus || active ? 'text-text' : done ? 'text-success' : 'text-muted'
                  }`}
                >
                  {label}
                </span>
                {active && !isFocus && (
                  <span className="text-[10px] font-semibold text-brand-red-500">Current</span>
                )}
                {isFocus && (
                  <span className="text-[10px] font-semibold text-brand-text-on-yellow">Viewing</span>
                )}
              </div>
            </button>
          </li>
        );
      })}

      {inDelivery && (
        <li className="relative">
          <div className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 border bg-ink-900 border-ink-900 text-white">
            <span className="relative z-[1] w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 bg-brand-yellow-400 text-text">
              {String(currentStage).padStart(2, '0')}
            </span>
            <div>
              <p className="text-xs font-bold leading-snug">
                {deliveryPhaseLabel || stageLabel(currentStage, mode)}
              </p>
              <p className="text-[10px] text-white/60 mt-0.5">Managed on Project</p>
            </div>
          </div>
        </li>
      )}
    </ol>
  );
}
