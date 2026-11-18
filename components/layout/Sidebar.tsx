'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  NAV_SECTIONS,
  UserRole,
  isNavItemActive,
  labelForNavItem,
} from '@/lib/nav';
import { routes } from '@/lib/routes';
import { Avatar } from '@/components/ui/Avatar';

interface SidebarProps {
  userRole?: UserRole;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  userRole = 'founder_ceo',
  collapsed: controlledCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const effectiveRole = (user?.role as UserRole) || userRole;
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )kr_sidebar_collapsed=([^;]*)/);
    if (match) setInternalCollapsed(match[1] === 'true');
  }, []);

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setInternalCollapsed(next);
    document.cookie = `kr_sidebar_collapsed=${next}; path=/; max-age=31536000`;
    onToggleCollapse?.();
  };

  return (
    <aside
      className={`hidden lg:flex flex-col bg-surface text-text select-none border-r border-border h-[100dvh] sticky top-0 z-30 overflow-hidden transition-[width] duration-300 ease-in-out ${
        isCollapsed ? 'w-[72px]' : 'w-[264px]'
      }`}
      aria-label="Sidebar Navigation"
    >
      <div
        className={`shrink-0 border-b border-border flex transition-all duration-300 ease-in-out ${
          isCollapsed
            ? 'flex-col items-center justify-center gap-1.5 px-2 py-3'
            : 'h-16 flex-row items-center gap-2 px-3'
        }`}
      >
        <Link
          href={routes.dashboard}
          className={`flex items-center min-w-0 overflow-hidden transition-[gap] duration-300 ease-in-out ${
            isCollapsed ? 'justify-center gap-0' : 'flex-1 gap-2.5'
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-bg border border-border p-1 flex items-center justify-center shrink-0">
            <img
              src="/brand/krws-mark.png"
              alt="KR Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/brand/kr-logo.png';
              }}
            />
          </div>
          <div
            className={`leading-tight overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-in-out ${
              isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[168px] opacity-100'
            }`}
          >
            <span className="font-bold text-[15px] tracking-tight text-text block truncate">
              KR Workspace
            </span>
            <span className="text-[10px] text-muted font-medium tracking-wider block uppercase">
              {effectiveRole === 'client' ? 'Client portal' : 'Internal ERP · CRM'}
            </span>
          </div>
        </Link>

        <button
          type="button"
          onClick={toggleCollapse}
          className="text-muted hover:text-text p-1.5 rounded-lg hover:bg-bg border border-border bg-surface transition-colors duration-200 cursor-pointer shrink-0"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4" aria-hidden />
          ) : (
            <PanelLeftClose className="w-4 h-4" aria-hidden />
          )}
        </button>
      </div>

      <div className={`flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-4 transition-[padding] duration-300 ease-in-out ${isCollapsed ? 'px-2' : 'px-3'}`}>
        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter((item) =>
            item.roles.includes(effectiveRole)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.id} className="space-y-1">
              <div
                className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${
                  isCollapsed ? 'max-h-0 opacity-0' : 'max-h-6 opacity-100'
                }`}
              >
                <div className="px-2.5 pb-1 text-[10px] font-bold tracking-wider text-subtle uppercase">
                  {section.title}
                </div>
              </div>

              <nav className="space-y-0.5" aria-label={section.title}>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isNavItemActive(pathname, item);
                  const label = labelForNavItem(item);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={isCollapsed ? label : undefined}
                      className={`relative h-10 group flex items-center rounded-lg text-xs font-semibold transition-all duration-300 ease-in-out select-none overflow-hidden ${
                        isCollapsed ? 'justify-center px-0 gap-0' : 'px-2.5 gap-2.5'
                      } ${
                        isActive
                          ? 'bg-brand-red-tint text-brand-red-500'
                          : 'text-muted hover:text-text hover:bg-bg'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {isActive && (
                        <span
                          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-brand-red-500"
                          aria-hidden
                        />
                      )}
                      <Icon
                        size={18}
                        strokeWidth={isActive ? 2.2 : 1.8}
                        className={`shrink-0 ${
                          isActive ? 'text-brand-red-500' : 'text-muted group-hover:text-text'
                        }`}
                        aria-hidden
                      />
                      <span
                        className={`truncate whitespace-nowrap overflow-hidden transition-[max-width,opacity] duration-300 ease-in-out ${
                          isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[168px] opacity-100 flex-1'
                        }`}
                      >
                        {label}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          );
        })}
      </div>

      <div className="shrink-0 border-t border-border bg-surface p-3">
        <div className="rounded-xl bg-bg border border-border flex items-center gap-2 overflow-hidden h-12 px-2">
          <Link href={routes.profile} title="Profile" className="shrink-0">
            <Avatar name={user?.full_name || 'KR'} size="sm" className="w-8 h-8 text-[11px]" />
          </Link>
          <Link
            href={routes.profile}
            className={`leading-tight min-w-0 overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-in-out ${
              isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[140px] opacity-100 flex-1'
            }`}
          >
            <span className="text-xs font-bold text-text block truncate">
              {user?.full_name || 'KR User'}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-red-500 block">
              {effectiveRole.replace('_', ' ')}
            </span>
          </Link>
          <button
            type="button"
            onClick={() => logout()}
            className={`text-muted hover:text-brand-red-500 hover:bg-brand-red-tint rounded-lg transition-all duration-300 ease-in-out cursor-pointer shrink-0 overflow-hidden ${
              isCollapsed ? 'w-0 p-0 opacity-0 pointer-events-none' : 'w-8 p-1.5 opacity-100'
            }`}
            title="Logout"
            tabIndex={isCollapsed ? -1 : 0}
          >
            <LogOut className="w-4 h-4" aria-hidden />
          </button>
        </div>
      </div>
    </aside>
  );
}
