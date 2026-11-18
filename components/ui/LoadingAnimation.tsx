'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

export type LoadingSize = 'sm' | 'md' | 'lg';

export interface LoadingAnimationProps {
  /** Optional caption under the spinner */
  label?: string;
  /** Spinner size — sm for buttons, md default, lg for full-page */
  size?: LoadingSize;
  /** Pin to viewport center (true screen-center overlay) */
  fullPage?: boolean;
  className?: string;
  /** Accessible status text (defaults to label or “Loading”) */
  'aria-label'?: string;
}

const LOGO_SRC = '/assets/kr-logo.png';

const SIZE: Record<
  LoadingSize,
  { box: string; logo: string; ring: string; label: string }
> = {
  sm: { box: 'h-4 w-4', logo: 'h-2.5 w-2.5', ring: 'border-[1.5px]', label: 'text-[10px]' },
  md: { box: 'h-16 w-16', logo: 'h-9 w-9', ring: 'border-[2.5px]', label: 'text-xs' },
  lg: { box: 'h-24 w-24', logo: 'h-14 w-14', ring: 'border-[3px]', label: 'text-sm' },
};

/**
 * Shared KR Workspace loader — logo mark centered with orbiting brand ring.
 * Use `fullPage` to lock the animation to the middle of the screen.
 */
export function LoadingAnimation({
  label,
  size = 'md',
  fullPage = false,
  className,
  'aria-label': ariaLabel,
}: LoadingAnimationProps) {
  const resolvedSize: LoadingSize = fullPage ? 'lg' : size;
  const s = SIZE[resolvedSize];
  const status = ariaLabel || label || 'Loading';
  const showLogo = resolvedSize !== 'sm';

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={status}
      className={cn(
        'flex flex-col items-center justify-center gap-4',
        fullPage
          ? 'fixed inset-0 z-[80] w-screen h-[100dvh] bg-bg/90 backdrop-blur-[2px]'
          : 'w-full min-h-[12rem]',
        className
      )}
    >
      <div className={cn('relative shrink-0', s.box)} aria-hidden>
        {/* Outer brand ring */}
        <span
          className={cn(
            'absolute inset-0 rounded-full border-border/70 border-t-brand-red-500 border-r-brand-yellow-400/80 kr-loader-spin',
            s.ring
          )}
        />
        {/* Soft glow */}
        <span className="absolute inset-[12%] rounded-full bg-brand-red-500/5 kr-loader-pulse" />

        {showLogo ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src={LOGO_SRC}
              alt=""
              className={cn('object-contain kr-loader-logo', s.logo)}
              draggable={false}
            />
          </div>
        ) : (
          <span className="absolute inset-[28%] rounded-full bg-brand-red-500/90 kr-loader-pulse" />
        )}
      </div>

      {label ? (
        <p className={cn('font-medium text-muted tracking-wide', s.label)}>{label}</p>
      ) : (
        <span className="sr-only">{status}</span>
      )}
    </div>
  );
}

export default LoadingAnimation;
