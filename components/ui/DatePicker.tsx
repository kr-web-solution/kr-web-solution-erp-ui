'use client';

import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

export interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className = '', error, disabled, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <input
          ref={ref}
          type="date"
          disabled={disabled}
          className={`w-full h-10 pl-3.5 pr-10 bg-white border rounded-[10px] text-sm text-[#0F172A] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E32B2B] focus-visible:border-[#E32B2B] disabled:bg-[#F6F7F9] disabled:text-[#94A3B8] disabled:cursor-not-allowed ${
            error ? 'border-[#B91C1C]' : 'border-[#E6E8EE]'
          } ${className}`}
          {...props}
        />
        <CalendarIcon className="w-4 h-4 text-[#64748B] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';
