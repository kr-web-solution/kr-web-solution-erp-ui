'use client';

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary = brand red · accent = yellow “go” CTA · secondary/ghost/danger as usual */
  variant?: 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger' | 'outline-danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  iconOnly?: boolean;
}

function Spinner({ light }: { light?: boolean }) {
  return (
    <span
      className={`inline-block h-3.5 w-3.5 shrink-0 rounded-full border-2 animate-spin ${
        light ? 'border-white/35 border-t-white' : 'border-black/15 border-t-black/65'
      }`}
      aria-hidden
    />
  );
}

/** Keep only text nodes so icons inside children are not doubled with the loading spinner. */
function textFromChildren(children: React.ReactNode): React.ReactNode {
  if (children == null || typeof children === 'boolean') return null;
  if (typeof children === 'string' || typeof children === 'number') return children;

  const parts: React.ReactNode[] = [];
  React.Children.forEach(children, (child) => {
    if (typeof child === 'string' || typeof child === 'number') {
      const t = String(child).trim();
      if (t) parts.push(t);
      return;
    }
    if (!React.isValidElement(child)) return;
    // Keep plain <span>Label</span>; skip lucide/svg icon elements
    if (child.type === 'span') {
      parts.push(child);
    }
  });
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0];
  return parts;
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
      'inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-semibold rounded-[10px] transition-[background-color,transform,box-shadow,opacity] duration-200 ease-out select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red-500 focus-visible:ring-offset-2 active:scale-[0.98]';

    const variantClasses = {
      primary:
        'bg-brand-red-500 hover:bg-brand-red-hover active:bg-brand-red-active text-white',
      accent:
        'bg-brand-yellow-400 hover:bg-brand-yellow-hover active:bg-[#E8C84A] text-text border border-transparent',
      secondary:
        'bg-surface hover:bg-bg active:bg-neutral text-text border border-border',
      ghost:
        'bg-transparent hover:bg-bg active:bg-neutral text-muted hover:text-text',
      danger: 'bg-danger hover:bg-[#991B1B] text-white',
      'outline-danger':
        'bg-surface hover:bg-danger-tint border border-danger/30 text-danger',
    }[variant];

    const sizeClasses = {
      sm: iconOnly ? 'w-8 h-8 p-0' : 'h-8 px-2.5 text-xs',
      md: iconOnly ? 'w-10 h-10 p-0' : 'h-10 px-3.5 text-sm',
      lg: iconOnly ? 'w-11 h-11 p-0' : 'h-11 px-5 text-[15px]',
    }[size];

    const lightSpinner = variant === 'primary' || variant === 'danger';
    const loadingLabel = textFromChildren(children);

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <Spinner light={lightSpinner} />
            {!iconOnly && loadingLabel != null && (
              <span className="truncate">{loadingLabel}</span>
            )}
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
