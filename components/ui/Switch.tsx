'use client';

import React from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className = '',
  id,
}: SwitchProps) {
  return (
    <label
      htmlFor={id}
      className={`inline-flex items-start gap-3 cursor-pointer select-none ${
        disabled ? 'cursor-not-allowed opacity-50' : ''
      } ${className}`}
    >
      <div className="relative inline-flex items-center shrink-0 mt-0.5">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-[#E6E8EE] peer-focus-visible:ring-2 peer-focus-visible:ring-[#E32B2B] peer-focus-visible:ring-offset-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#16A34A] transition-colors" />
      </div>

      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className="text-sm font-semibold text-[#0F172A]">{label}</span>}
          {description && (
            <span className="text-xs text-[#64748B] leading-normal">{description}</span>
          )}
        </div>
      )}
    </label>
  );
}
