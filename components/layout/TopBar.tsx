'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Bell,
  LogOut,
  User as UserIcon,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { dashboardApi } from '@/lib/api/client';
import { breadcrumbsFor, routes } from '@/lib/routes';
import { isPrivileged, roleLabel } from '@/lib/roles';

interface TopBarProps {
  onOpenMobileMenu: () => void;
}

export function TopBar({ onOpenMobileMenu }: TopBarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [needsActionCount, setNeedsActionCount] = useState<number>(0);

  // Fetch overdue count for founder bell badge
  useEffect(() => {
    if (isPrivileged(user?.role)) {
      dashboardApi
        .getSummary()
        .then((sum) => {
          const count = (sum.needs_action_invoices?.length || 0) + (sum.failed_email_invoices_count || 0);
          setNeedsActionCount(count);
        })
        .catch(() => {});
    }
  }, [user]);

  // Format today's date in Asia/Kolkata
  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const breadcrumbs = breadcrumbsFor(pathname);

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full min-w-0 shrink-0 items-center justify-between gap-3 border-b border-[#E6E8EE] bg-white px-3 sm:h-16 sm:gap-4 sm:px-4 lg:px-5 xl:px-6">
      {/* Left: Hamburger & Breadcrumbs */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onOpenMobileMenu();
          }}
          className="relative z-50 -ml-1 inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-[10px] text-[#0F172A] hover:bg-[#F6F7F9] active:bg-[#EEF1F5] lg:hidden"
          aria-label="Open mobile navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#64748B] truncate">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.href + idx}>
                {idx > 0 && <span className="text-[#94A3B8]">/</span>}
                {isLast ? (
                  <span className="font-bold text-[#E32B2B] truncate">{crumb.label}</span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="hover:text-[#0F172A] font-medium truncate hidden sm:inline"
                  >
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {/* Founder Needs Action Bell Icon with Red Badge */}
        {isPrivileged(user?.role) && (
          <Link
            href={routes.needsAction}
            title={needsActionCount > 0 ? `${needsActionCount} overdue invoices need decision` : 'Notifications'}
            className="relative p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F6F7F9] rounded-[10px] transition-colors"
          >
            <Bell className="w-4 h-4" />
            {needsActionCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#E32B2B] text-white text-[10px] font-bold font-mono flex items-center justify-center ring-2 ring-white">
                {needsActionCount > 9 ? '9+' : needsActionCount}
              </span>
            )}
          </Link>
        )}

        {/* Today's Date */}
        <div className="hidden md:flex items-center text-xs font-mono font-medium text-[#64748B] tabular-nums select-none bg-[#F6F7F9] px-2.5 py-1 rounded-[10px] border border-[#E6E8EE]">
          {todayFormatted}
        </div>

        {/* Role Pill */}
        {user && (
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#F6F7F9] text-[#64748B] border border-[#E6E8EE]">
            {roleLabel(user.role)}
          </span>
        )}

        {/* Avatar Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-[#F6F7F9] transition-colors cursor-pointer select-none"
          >
            <Avatar
              name={user?.full_name || 'KR'}
              size="sm"
              className="w-8 h-8 text-[11px]"
            />
            <span className="hidden lg:inline text-xs font-bold text-[#0F172A] max-w-[120px] truncate">
              {user?.full_name}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
          </button>

          {/* Profile Dropdown */}
          {profileDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setProfileDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E6E8EE] rounded-2xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2.5 border-b border-[#E6E8EE]">
                  <div className="text-xs font-bold text-[#0F172A] truncate">
                    {user?.full_name}
                  </div>
                  <div className="text-[11px] text-[#64748B] truncate">{user?.email}</div>
                </div>

                <Link
                  href="/profile"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#0F172A] hover:bg-[#F6F7F9] transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-[#64748B]" />
                  <span>My Profile</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#B91C1C] hover:bg-[#FDECEC] transition-colors cursor-pointer text-left border-t border-[#E6E8EE]"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
