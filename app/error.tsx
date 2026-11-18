'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application runtime error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="bg-white border border-[#E6E8EE] rounded-2xl p-8 text-center max-w-md w-full shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_16px_rgba(16,24,40,0.04)]">
        <div className="w-14 h-14 bg-[#FDECEC] border border-[#B91C1C]/20 text-[#B91C1C] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-[#0F172A] mb-1 font-heading">
          Something went wrong
        </h2>
        <p className="text-xs text-[#64748B] mb-6 leading-relaxed">
          {error.message || 'An unexpected error occurred while loading this view.'}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="primary" size="sm" onClick={reset}>
            <RotateCcw className="w-4 h-4 mr-1.5" />
            <span>Try Again</span>
          </Button>
          <Link href="/dashboard">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
