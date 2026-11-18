'use client';

import React from 'react';
import { FolderOpen } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  className?: string;
}

export function EmptyState({
  title,
  subtitle,
  icon,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`p-10 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-[#E6E8EE] ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-[#F6F7F9] border border-[#E6E8EE] flex items-center justify-center text-[#94A3B8] mb-3.5 shadow-2xs">
        {icon || <FolderOpen className="w-6 h-6 stroke-[1.75]" />}
      </div>
      <h3 className="text-sm font-bold text-[#0F172A]">{title}</h3>
      {subtitle && (
        <p className="text-xs text-[#64748B] max-w-sm mt-1 leading-normal">
          {subtitle}
        </p>
      )}
      {action && (
        <div className="mt-4">
          <Button
            variant="primary"
            size="sm"
            onClick={action.onClick}
            icon={action.icon}
          >
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
