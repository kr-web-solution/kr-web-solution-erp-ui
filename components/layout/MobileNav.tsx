'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  NAV_SECTIONS,
  UserRole,
  isNavItemActive,
  labelForNavItem,
} from '@/lib/nav';
import { routes } from '@/lib/routes';
import { Avatar } from '@/components/ui/Avatar';

const ANIMATION_MS = 280;

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: UserRole;
}

export function MobileNav({ isOpen, onClose, userRole = 'founder_ceo' }: MobileNavProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const effectiveRole = (user?.role as UserRole) || userRole;
  const prevPathname = useRef(pathname);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  // Keep mounted during exit so close can animate
  useEffect(() => {
    let frame = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (isOpen) {
      setMounted(true);
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      timer = setTimeout(() => setMounted(false), ANIMATION_MS);
    }

    return () => {
      if (frame) cancelAnimationFrame(frame);
      if (timer) clearTimeout(timer);
    };
  }, [isOpen]);

  // Close only when the route changes — not when onClose identity changes
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      onClose();
    }
  }, [pathname, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex lg:hidden"
      role="presentation"
      aria-hidden={!visible}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-[#12141C]/50 backdrop-blur-[2px] transition-opacity duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label="Close navigation overlay"
        tabIndex={visible ? 0 : -1}
        onClick={onClose}
      />
      <div
        className={`relative z-[61] flex h-full w-[min(280px,85vw)] flex-col border-r border-border bg-surface text-text shadow-xl transition-transform duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${
          visible ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
          <Link
            href={routes.dashboard}
            className="flex min-w-0 items-center gap-2.5"
            onClick={onClose}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border bg-bg p-1">
              <img
                src="/brand/krws-mark.png"
                alt="Logo"
                className="h-full w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/brand/kr-logo.png';
                }}
              />
            </div>
            <div className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-bold tracking-tight text-text">
                KR Workspace
              </span>
              <span className="block truncate text-[10px] font-medium uppercase tracking-wider text-muted">
                {effectiveRole === 'client' ? 'Client portal' : 'Internal ERP · CRM'}
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 cursor-pointer rounded-lg p-1.5 text-muted hover:bg-bg hover:text-text"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-3">
          {NAV_SECTIONS.map((section) => {
            const visibleItems = section.items.filter((item) =>
              item.roles.includes(effectiveRole)
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.id} className="space-y-1">
                <div className="px-2.5 pb-1 text-[10px] font-bold tracking-wider text-subtle uppercase">
                  {section.title}
                </div>
                <nav className="space-y-0.5" aria-label={section.title}>
                  {visibleItems.map((item) => {
                    const label = labelForNavItem(item);
                    const Icon = item.icon;
                    const isActive = isNavItemActive(pathname, item);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors ${
                          isActive
                            ? 'bg-brand-red-tint text-brand-red-500'
                            : 'text-muted hover:bg-bg hover:text-text'
                        }`}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        {isActive && (
                          <span
                            className="absolute top-2 bottom-2 left-0 w-[3px] rounded-r-full bg-brand-red-500"
                            aria-hidden
                          />
                        )}
                        <Icon
                          size={18}
                          className={isActive ? 'text-brand-red-500' : 'text-muted'}
                          aria-hidden
                        />
                        <span>{label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border p-3">
          <Link
            href={routes.profile}
            className="flex min-w-0 items-center gap-2.5"
            onClick={onClose}
          >
            <Avatar name={user?.full_name || 'KR'} size="sm" />
            <div className="truncate">
              <span className="block truncate text-xs font-bold text-text">
                {user?.full_name}
              </span>
              <span className="block text-[10px] font-bold text-brand-red-500 uppercase">
                {effectiveRole.replace('_', ' ')}
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => {
              onClose();
              logout();
            }}
            className="cursor-pointer rounded-lg p-1.5 text-muted hover:bg-brand-red-tint hover:text-brand-red-500"
            title="Logout"
          >
            <LogOut className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
