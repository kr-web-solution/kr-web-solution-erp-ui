'use client';

import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error, disabled, rows = 3, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        disabled={disabled}
        className={`w-full p-3 bg-white border rounded-[10px] text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E32B2B] focus-visible:border-[#E32B2B] disabled:bg-[#F6F7F9] disabled:text-[#94A3B8] disabled:cursor-not-allowed ${
          error ? 'border-[#B91C1C] focus-visible:ring-[#B91C1C]' : 'border-[#E6E8EE]'
        } ${className}`}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
