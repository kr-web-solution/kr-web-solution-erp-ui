'use client';

import React from 'react';

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  id?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  required = false,
  hint,
  error,
  id,
  className = '',
  children,
}: FormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-[#0F172A]"
        >
          {label}
          {required && <span className="text-[#E32B2B] ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="text-[12px] text-[#64748B] leading-normal">{hint}</p>
      )}
      {error && (
        <p className="text-[12px] font-medium text-[#B91C1C] leading-normal">{error}</p>
      )}
    </div>
  );
}
