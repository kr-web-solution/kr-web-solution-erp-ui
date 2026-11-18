'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
  showToast?: boolean;
}

export function CopyButton({
  value,
  label,
  className = '',
  showToast = true,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (showToast) {
        toast.success(`Copied ${label || 'text'} to clipboard`);
      }
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={`Copy ${label || value}`}
      className={`inline-flex items-center gap-1 p-1 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F6F7F9] rounded-md transition-colors cursor-pointer ${className}`}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-[#16A34A] stroke-[2.5]" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
      {label && <span className="text-xs font-mono">{label}</span>}
    </button>
  );
}
