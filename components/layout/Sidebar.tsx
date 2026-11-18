"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  NAV_SECTIONS,
  UserRole,
  isNavItemActive,
  isNavItemOrChildActive,
  labelForNavItem,
  type NavItem,
  type NavSection,
} from "@/lib/nav";
import { routes } from "@/lib/routes";
import { Avatar } from "@/components/ui/Avatar";

interface SidebarProps {
  userRole?: UserRole;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  userRole = "founder_ceo",
  collapsed: controlledCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const effectiveRole = (user?.role as UserRole) || userRole;
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )kr_sidebar_collapsed=([^;]*)/);
    if (match) setInternalCollapsed(match[1] === "true");
  }, []);

  const isCollapsed =
    controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setInternalCollapsed(next);
    document.cookie = `kr_sidebar_collapsed=${next}; path=/; max-age=31536000`;
    onToggleCollapse?.();
  };

  const visibleSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.roles.includes(effectiveRole)),
  })).filter((section) => section.items.length > 0);

  if (isCollapsed) {
    return (
      <CollapsedRail
        sections={visibleSections}
        pathname={pathname}
        role={effectiveRole}
        userName={user?.full_name || "KR User"}
        onExpand={toggleCollapse}
        onLogout={() => logout()}
      />
    );
  }

  return (
    <aside
      className="hidden lg:flex w-[264px] flex-col bg-surface text-text select-none border-r border-border h-[100dvh] sticky top-0 z-30 overflow-hidden transition-[width] duration-300 ease-in-out"
      aria-label="Sidebar Navigation"
      data-collapsed="false"
    >
      <div className="shrink-0 border-b border-border bg-surface flex h-[64px] items-center gap-1.5 px-3 pr-2">
        <Link href={routes.dashboard} className="flex flex-1 items-center min-w-0" title="KR Workspace">
          <img
            src="/nav-logo/krws-wordmark-nav.png"
            alt="KR Workspace"
            className="h-[42px] w-auto max-w-full object-contain object-left"
          />
        </Link>
        <button
          type="button"
          onClick={toggleCollapse}
          className="text-muted hover:text-text h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-bg transition-colors duration-200 cursor-pointer shrink-0"
          title="Collapse sidebar"
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose className="w-4 h-4" aria-hidden />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-3 space-y-4">
        {visibleSections.map((section) => (
          <div key={section.id} className="space-y-1">
            <div className="px-2.5 pb-1 text-xs font-bold tracking-wider text-subtle uppercase">
              {section.title}
            </div>
            <nav className="space-y-0.5" aria-label={section.title}>
              {section.items.map((item) => (
                <SidebarNavItem
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  role={effectiveRole}
                />
              ))}
            </nav>
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-border bg-surface p-3">
        <div className="rounded-xl bg-bg border border-border flex items-center gap-2 h-12 px-2">
          <Link href={routes.profile} title="Profile" className="shrink-0">
            <Avatar name={user?.full_name || "KR"} size="sm" className="w-8 h-8 text-[11px]" />
          </Link>
          <Link href={routes.profile} className="leading-tight min-w-0 flex-1 overflow-hidden">
            <span className="text-xs font-bold text-text block truncate">
              {user?.full_name || "KR User"}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-red-500 block truncate">
              {effectiveRole.replace(/_/g, " ")}
            </span>
          </Link>
          <button
            type="button"
            onClick={() => logout()}
            className="text-muted hover:text-brand-red-500 hover:bg-brand-red-tint rounded-lg transition-colors cursor-pointer shrink-0 w-8 p-1.5"
            title="Logout"
          >
            <LogOut className="w-4 h-4" aria-hidden />
          </button>
        </div>
      </div>
    </aside>
  );
}

/** Distinct collapsed experience — dark brand dock, not a squeezed light sidebar. */
function CollapsedRail({
  sections,
  pathname,
  role,
  userName,
  onExpand,
  onLogout,
}: {
  sections: NavSection[];
  pathname: string;
  role: UserRole;
  userName: string;
  onExpand: () => void;
  onLogout: () => void;
}) {
  return (
    <aside
      className="hidden lg:flex w-[76px] flex-col h-[100dvh] sticky top-0 z-30 overflow-hidden select-none text-white border-r border-white/5"
      style={{
        background:
          "linear-gradient(180deg, #12141C 0%, #171A24 55%, #1A1020 100%)",
      }}
      aria-label="Collapsed navigation"
      data-collapsed="true"
    >
      {/* Brand mark pad */}
      <div className="relative shrink-0 flex h-[72px] items-center justify-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-20 opacity-80"
          style={{
            background:
              "radial-gradient(ellipse 90% 80% at 50% 0%, rgba(227,43,43,0.35), transparent 70%)",
          }}
        />
        <Link
          href={routes.dashboard}
          title="KR Workspace"
          className="relative z-10 flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-[0_8px_24px_rgba(227,43,43,0.28)] ring-1 ring-white/20 transition-transform duration-200 hover:scale-105"
        >
          <img
            src="/nav-logo/krws-mark-nav.png"
            alt="KR"
            className="h-6 w-6 object-contain"
          />
        </Link>
      </div>

      <div className="mx-auto h-px w-8 bg-gradient-to-r from-transparent via-[#FADC59]/50 to-transparent" />

      {/* Icon dock */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-3 space-y-4">
        {sections.map((section, sectionIndex) => (
          <div key={section.id} className="space-y-1.5">
            {sectionIndex > 0 && (
              <div className="mx-auto mb-1 flex items-center justify-center gap-1 py-0.5" aria-hidden>
                <span className="h-1 w-1 rounded-full bg-white/25" />
                <span className="h-1 w-1 rounded-full bg-[#E32B2B]/70" />
                <span className="h-1 w-1 rounded-full bg-white/25" />
              </div>
            )}
            <nav className="flex flex-col items-center gap-1.5" aria-label={section.title}>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active =
                  isNavItemActive(pathname, item) ||
                  isNavItemOrChildActive(pathname, item);
                const label = labelForNavItem(item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={label}
                    aria-label={label}
                    aria-current={active ? "page" : undefined}
                    className={`group relative flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-200 ${
                      active
                        ? "bg-[#E32B2B] text-white shadow-[0_10px_24px_rgba(227,43,43,0.45)] scale-[1.02]"
                        : "bg-white/[0.04] text-white/65 ring-1 ring-white/8 hover:bg-white/[0.09] hover:text-white hover:ring-[#FADC59]/35"
                    }`}
                  >
                    {active && (
                      <span
                        className="absolute -left-[7px] top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-[#FADC59]"
                        aria-hidden
                      />
                    )}
                    <Icon size={18} strokeWidth={active ? 2.3 : 1.9} aria-hidden />
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Expand + profile */}
      <div className="shrink-0 px-2.5 pb-3 pt-2 space-y-2 border-t border-white/8">
        <button
          type="button"
          onClick={onExpand}
          title="Expand sidebar"
          aria-label="Expand sidebar"
          className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.06] text-[#FADC59] ring-1 ring-[#FADC59]/25 hover:bg-[#FADC59]/15 transition-colors cursor-pointer"
        >
          <PanelLeftOpen className="h-4 w-4" aria-hidden />
        </button>

        <div className="mx-auto flex flex-col items-center gap-1.5">
          <Link
            href={routes.profile}
            title={userName}
            className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.06] ring-1 ring-white/10 hover:ring-[#E32B2B]/50 transition-all"
          >
            <Avatar name={userName} size="sm" className="!w-8 !h-8 !text-[10px]" />
            <span
              className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#16A34A] ring-2 ring-[#12141C]"
              aria-hidden
            />
          </Link>
          <button
            type="button"
            onClick={onLogout}
            title="Logout"
            aria-label="Logout"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-white/40 hover:text-[#E32B2B] hover:bg-[#E32B2B]/15 transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </aside>
  );
}

function SidebarNavItem({
  item,
  pathname,
  role,
}: {
  item: NavItem;
  pathname: string;
  role: UserRole;
}) {
  const Icon = item.icon;
  const isActive = isNavItemActive(pathname, item);
  const childActive = isNavItemOrChildActive(pathname, item);
  const label = labelForNavItem(item);
  const children = (item.children || []).filter((c) => c.roles.includes(role));
  const hasChildren = children.length > 0;
  const [open, setOpen] = useState(childActive || isActive);

  useEffect(() => {
    if (childActive || isActive) setOpen(true);
  }, [childActive, isActive, pathname]);

  const showChildren = hasChildren && open;

  return (
    <div className="space-y-0.5">
      <div
        className={`relative h-10 group flex items-center rounded-lg text-sm font-semibold transition-colors select-none overflow-hidden pl-2.5 pr-1 gap-1 ${
          isActive
            ? "bg-brand-red-tint text-brand-red-500"
            : childActive
              ? "bg-bg text-text"
              : "text-muted hover:text-text hover:bg-bg"
        }`}
      >
        {isActive && (
          <span
            className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-brand-red-500"
            aria-hidden
          />
        )}
        <Link
          href={item.href}
          className="flex min-w-0 flex-1 items-center h-full gap-2.5"
          aria-current={isActive ? "page" : undefined}
        >
          <Icon
            size={18}
            strokeWidth={isActive || childActive ? 2.2 : 1.8}
            className={`shrink-0 ${
              isActive || childActive
                ? "text-brand-red-500"
                : "text-muted group-hover:text-text"
            }`}
            aria-hidden
          />
          <span className="truncate flex-1">{label}</span>
        </Link>

        {hasChildren && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen((v) => !v);
            }}
            className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted hover:text-text hover:bg-surface border border-transparent hover:border-border transition-colors cursor-pointer"
            aria-expanded={open}
            aria-label={open ? `Collapse ${label}` : `Expand ${label}`}
            title={open ? "Close sections" : "Open sections"}
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                open ? "rotate-0" : "-rotate-90"
              }`}
              aria-hidden
            />
          </button>
        )}
      </div>

      {showChildren && (
        <div className="ml-3 pl-2.5 border-l border-border space-y-0.5">
          {children.map((child) => {
            const ChildIcon = child.icon;
            const childIsActive = isNavItemActive(pathname, child);
            const childLabel = labelForNavItem(child);
            return (
              <Link
                key={child.href}
                href={child.href}
                className={`relative h-9 group flex items-center gap-2 rounded-lg px-2.5 text-xs font-semibold transition-colors ${
                  childIsActive
                    ? "bg-brand-red-tint text-brand-red-500"
                    : "text-muted hover:text-text hover:bg-bg"
                }`}
                aria-current={childIsActive ? "page" : undefined}
              >
                {childIsActive && (
                  <span
                    className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-brand-red-500"
                    aria-hidden
                  />
                )}
                <ChildIcon
                  size={14}
                  strokeWidth={childIsActive ? 2.2 : 1.8}
                  className={`shrink-0 ${
                    childIsActive
                      ? "text-brand-red-500"
                      : "text-subtle group-hover:text-text"
                  }`}
                  aria-hidden
                />
                <span className="truncate">{childLabel}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
