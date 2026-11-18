import React from 'react';
import { getStatusStyle } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

export interface BadgeProps {
  status: string;
  className?: string;
}

export function Badge({ status, className }: BadgeProps) {
  const { bg, text, label } = getStatusStyle(status);

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
        bg,
        text,
        className
      )}
      role="status"
    >
      {label}
    </span>
  );
}

