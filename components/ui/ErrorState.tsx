'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We could not complete your request. Please try again.',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={`p-8 bg-[#FFF1F0]/50 border border-[#B91C1C]/20 rounded-2xl flex flex-col items-center justify-center text-center ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-[#FDECEC] border border-[#B91C1C]/20 flex items-center justify-center text-[#B91C1C] mb-3 shadow-2xs">
        <AlertTriangle className="w-6 h-6 stroke-[1.75]" />
      </div>
      <h3 className="text-sm font-bold text-[#0F172A]">{title}</h3>
      <p className="text-xs text-[#64748B] max-w-sm mt-1 leading-normal">{message}</p>
      {onRetry && (
        <div className="mt-4">
          <Button
            variant="danger"
            size="sm"
            onClick={onRetry}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}

export function GlobalApiBanner({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="bg-[#B91C1C] text-white px-4 py-2 text-xs font-semibold flex items-center justify-between sticky top-0 z-50 shadow-md">
      <div className="flex items-center gap-2 mx-auto sm:mx-0">
        <WifiOff className="w-4 h-4 shrink-0" />
        <span>Can&apos;t reach the server. Please verify your connection or backend status.</span>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="ml-4 px-2.5 py-1 bg-white text-[#B91C1C] rounded font-bold hover:bg-white/90 text-xs shrink-0 cursor-pointer"
        >
          Retry
        </button>
      )}
    </div>
  );
}
