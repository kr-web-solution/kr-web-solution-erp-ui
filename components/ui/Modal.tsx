'use client';

import React, { useEffect, useRef } from 'react';
import { XIcon } from '@/components/icons';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  zIndex?: number;
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  size = 'md',
  children,
  footer,
  className = '',
  zIndex = 50,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl sm:max-w-3xl',
    xl: 'max-w-4xl',
  }[size];

  return (
    <div
      className="fixed inset-0 flex items-end justify-center bg-[#12141C]/55 p-0 backdrop-blur-xs animate-in fade-in duration-150 sm:items-center sm:p-4"
      style={{ zIndex }}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        className={`relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-[#E6E8EE] bg-white shadow-xl animate-in slide-in-from-bottom duration-200 sm:max-h-[90vh] sm:rounded-2xl sm:zoom-in-95 sm:slide-in-from-bottom-0 ${sizeClasses} ${className}`}
      >
        {/* Header */}
        {(title || subtitle) && (
          <div className="flex shrink-0 items-center justify-between border-b border-[#E6E8EE] bg-white px-4 py-3.5 sm:px-6 sm:py-4">
            <div className="min-w-0 pr-3">
              {title && (
                <h2 className="truncate text-base leading-6 font-bold text-[#0F172A] sm:text-[18px] sm:leading-[26px]">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="mt-0.5 text-xs text-[#64748B]">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="shrink-0 cursor-pointer rounded-lg p-2 text-[#64748B] transition-colors hover:bg-[#F6F7F9] hover:text-[#0F172A]"
            >
              <XIcon size={20} />
            </button>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">{children}</div>

        {/* Sticky Footer */}
        {footer && (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-[#E6E8EE] bg-[#F6F7F9] px-4 py-3 sm:gap-3 sm:px-6 sm:py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
