'use client';

import React from 'react';

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: number | string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
}

export function formatINR(val: number | string): string {
  const num = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : val;
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('en-IN').format(num);
}

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

export function rupeesToPaise(rupees: number | string): number {
  const num = typeof rupees === 'string' ? parseFloat(rupees.replace(/,/g, '')) : rupees;
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, error, helperText, disabled, className = '', ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Allow only numbers and optional decimal
      const clean = e.target.value.replace(/[^0-9.]/g, '');
      onChange(clean);
    };

    return (
      <div className="w-full">
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#64748B] pointer-events-none select-none">
            ₹
          </span>
          <input
            ref={ref}
            type="text"
            inputMode="decimal"
            disabled={disabled}
            value={value}
            onChange={handleChange}
            placeholder="0"
            className={`w-full h-10 pl-8 pr-3.5 bg-white border rounded-[10px] text-sm font-mono font-medium text-[#0F172A] placeholder:text-[#94A3B8] tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E32B2B] focus-visible:border-[#E32B2B] disabled:bg-[#F6F7F9] disabled:cursor-not-allowed ${
              error ? 'border-[#B91C1C]' : 'border-[#E6E8EE]'
            } ${className}`}
            {...props}
          />
        </div>
        {helperText && !error && (
          <p className="mt-1 text-[11px] text-[#64748B]">{helperText}</p>
        )}
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
