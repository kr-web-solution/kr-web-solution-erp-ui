'use client';

import React from 'react';

export interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const PALETTES = [
  { bg: 'bg-[#FFF1F0]', text: 'text-[#E32B2B]', border: 'border-[#E32B2B]/20' },
  { bg: 'bg-[#FEF6D8]', text: 'text-[#5B4300]', border: 'border-[#FADC59]/30' },
  { bg: 'bg-[#E8F0FE]', text: 'text-[#2563EB]', border: 'border-[#2563EB]/20' },
  { bg: 'bg-[#E8F7EE]', text: 'text-[#16A34A]', border: 'border-[#16A34A]/20' },
  { bg: 'bg-[#F1EAFE]', text: 'text-[#7C3AED]', border: 'border-[#7C3AED]/20' },
  { bg: 'bg-[#EEF1F5]', text: 'text-[#12141C]', border: 'border-[#12141C]/20' },
];

function getPalette(name: string) {
  if (!name) return PALETTES[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTES.length;
  return PALETTES[index];
}

function getInitials(name?: string) {
  if (!name) return 'KR';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name = '', src, size = 'md', className = '' }: AvatarProps) {
  const palette = getPalette(name);
  const initials = getInitials(name);

  const sizeClasses = {
    sm: 'w-6 h-6 text-[11px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
    xl: 'w-14 h-14 text-base font-bold',
  }[size];

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover shrink-0 border border-[#E6E8EE] ${sizeClasses} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold font-mono shrink-0 select-none border ${palette.bg} ${palette.text} ${palette.border} ${sizeClasses} ${className}`}
      title={name}
    >
      {initials}
    </div>
  );
}

export interface AvatarStackProps {
  names: string[];
  max?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function AvatarStack({ names = [], max = 3, size = 'sm', className = '' }: AvatarStackProps) {
  const visible = names.slice(0, max);
  const remaining = names.length - max;

  const sizeClass = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-7 h-7 text-xs';

  if (names.length === 0) {
    return <span className="text-xs text-[#94A3B8]">—</span>;
  }

  return (
    <div className={`flex items-center -space-x-1.5 overflow-hidden ${className}`}>
      {visible.map((name, i) => (
        <Avatar
          key={`${name}-${i}`}
          name={name}
          size={size}
          className={`ring-2 ring-white ${sizeClass}`}
        />
      ))}
      {remaining > 0 && (
        <div
          className={`rounded-full bg-[#F6F7F9] border border-[#E6E8EE] text-[#64748B] flex items-center justify-center font-bold font-mono ring-2 ring-white shrink-0 ${sizeClass}`}
          title={`${remaining} more members`}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
