'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary = brand red · accent = yellow “go” CTA · secondary/ghost/danger as usual */
  variant?: 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger' | 'outline-danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  iconOnly?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      icon,
      iconPosition = 'left',
      iconOnly = false,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center font-semibold rounded-[10px] transition-colors duration-150 select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red-500 focus-visible:ring-offset-2';

    const variantClasses = {
      primary:
        'bg-brand-red-500 hover:bg-brand-red-hover active:bg-brand-red-active text-white',
      accent:
        'bg-brand-yellow-400 hover:bg-brand-yellow-hover active:bg-[#E8C84A] text-text border border-transparent',
      secondary:
        'bg-surface hover:bg-bg active:bg-neutral text-text border border-border',
      ghost:
        'bg-transparent hover:bg-bg active:bg-neutral text-muted hover:text-text',
      danger:
        'bg-danger hover:bg-[#991B1B] text-white',
      'outline-danger':
        'bg-surface hover:bg-danger-tint border border-danger/30 text-danger',
    }[variant];

    const sizeClasses = {
      sm: iconOnly ? 'w-8 h-8 p-0' : 'h-8 px-2.5 text-xs gap-1.5',
      md: iconOnly ? 'w-10 h-10 p-0' : 'h-10 px-3.5 text-sm gap-2',
      lg: iconOnly ? 'w-11 h-11 p-0' : 'h-11 px-5 text-[15px] gap-2.5',
    }[size];

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden />
            {!iconOnly && children}
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
            {!iconOnly && children}
            {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
