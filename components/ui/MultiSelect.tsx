'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Check, ChevronDown, Search } from 'lucide-react';
import { Avatar } from './Avatar';

export interface MultiSelectOption {
  value: string;
  label: string;
  subtitle?: string;
  avatar?: string;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  selectedValues,
  onChange,
  placeholder = 'Select members...',
  emptyText = 'No workers selected',
  className = '',
  disabled = false,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedValues.filter((v) => v !== value));
  };

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase()) ||
      (opt.subtitle && opt.subtitle.toLowerCase().includes(search.toLowerCase()))
  );

  const selectedOptions = options.filter((opt) => selectedValues.includes(opt.value));

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Selected chips bar */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`min-h-10 p-1.5 px-3 bg-white border border-[#E6E8EE] rounded-[10px] flex flex-wrap items-center gap-1.5 cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-[#E32B2B] focus-within:border-[#E32B2B] ${
          disabled ? 'bg-[#F6F7F9] cursor-not-allowed opacity-60' : ''
        }`}
      >
        {selectedOptions.length > 0 ? (
          selectedOptions.map((opt) => (
            <span
              key={opt.value}
              className="inline-flex items-center gap-1.5 py-0.5 pl-1 pr-2 bg-[#F6F7F9] border border-[#E6E8EE] rounded-full text-xs font-medium text-[#0F172A]"
            >
              <Avatar name={opt.label} size="sm" className="w-5 h-5 text-[10px]" />
              <span className="truncate max-w-[120px]">{opt.label}</span>
              <button
                type="button"
                onClick={(e) => handleRemove(opt.value, e)}
                className="text-[#94A3B8] hover:text-[#B91C1C] rounded-full p-0.5"
                title={`Remove ${opt.label}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        ) : (
          <span className="text-xs text-[#94A3B8] px-1">{emptyText}</span>
        )}
        <ChevronDown className="w-4 h-4 text-[#64748B] ml-auto shrink-0" />
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-[#E6E8EE] rounded-[10px] shadow-lg max-h-60 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-[#E6E8EE] bg-[#F6F7F9] flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[#94A3B8]" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter members..."
              className="w-full bg-transparent text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none"
            />
          </div>

          <div className="overflow-y-auto p-1 divide-y divide-[#E6E8EE]/40">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = selectedValues.includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleToggle(opt.value)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                      isSelected
                        ? 'bg-[#FFF1F0] text-[#E32B2B] font-semibold'
                        : 'hover:bg-[#F6F7F9] text-[#0F172A]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar name={opt.label} size="sm" className="w-6 h-6 text-[10px]" />
                      <div className="truncate">
                        <div className="truncate">{opt.label}</div>
                        {opt.subtitle && (
                          <div className="text-[11px] text-[#64748B] truncate">{opt.subtitle}</div>
                        )}
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#E32B2B] shrink-0" />}
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-[#94A3B8]">
                No matching members
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
