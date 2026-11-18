'use client';

import React from 'react';
import { Minus, Plus } from 'lucide-react';

export interface StepperProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  disabled?: boolean;
  className?: string;
}

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 28,
  step = 1,
  suffix = '',
  disabled = false,
  className = '',
}: StepperProps) {
  const handleDecrement = () => {
    if (value > min) onChange(value - step);
  };

  const handleIncrement = () => {
    if (value < max) onChange(value + step);
  };

  return (
    <div
      className={`inline-flex items-center bg-white border border-[#E6E8EE] rounded-[10px] h-10 p-1 shadow-2xs ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      } ${className}`}
    >
      <button
        type="button"
        disabled={value <= min || disabled}
        onClick={handleDecrement}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F6F7F9] active:bg-[#EEF1F5] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Decrease value"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      <div className="flex-1 min-w-[52px] px-2 text-center font-mono font-semibold text-sm text-[#0F172A] tabular-nums select-none">
        {value} {suffix && <span className="text-xs font-normal text-[#64748B]">{suffix}</span>}
      </div>

      <button
        type="button"
        disabled={value >= max || disabled}
        onClick={handleIncrement}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F6F7F9] active:bg-[#EEF1F5] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Increase value"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
