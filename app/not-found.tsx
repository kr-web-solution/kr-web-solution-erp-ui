import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="bg-white border border-[#E6E8EE] rounded-2xl p-8 text-center max-w-md w-full shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_16px_rgba(16,24,40,0.04)]">
        <div className="w-14 h-14 bg-[#F6F7F9] border border-[#E6E8EE] rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#94A3B8]">
          <FileQuestion className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-[#0F172A] mb-1 font-heading">
          Page Not Found
        </h1>
        <p className="text-xs text-[#64748B] mb-6 leading-relaxed">
          The requested page or resource does not exist in KR Workspace.
        </p>
        <Link href="/dashboard">
          <Button variant="primary" size="sm" className="shadow-sm">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Return to Dashboard</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
