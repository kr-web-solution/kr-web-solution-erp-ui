"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
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
  const { user } = useAuth();
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
        onExpand={toggleCollapse}
      />
    );
  }

  return (
    <aside
      className="hidden lg:flex w-52 flex-col bg-surface text-text select-none border-r border-border h-[100dvh] sticky top-0 z-30 overflow-hidden"
      aria-label="Sidebar Navigation"
      data-collapsed="false"
    >
      {/* Logo centered in space before the collapse button */}
      <div className="relative shrink-0 border-b border-border bg-surface flex h-14 sm:h-16 items-center pl-2.5 pr-10">
        <Link
          href={routes.dashboard}
          className="flex min-w-0 flex-1 items-center justify-center"
          title="KR Workspace"
        >
          <img
            src="/nav-logo/krws-wordmark-nav.png"
            alt="KR Workspace"
            className="h-10 w-auto max-w-full object-contain"
          />
        </Link>
        <button
          type="button"
          onClick={toggleCollapse}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted hover:text-text h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-bg transition-colors duration-200 cursor-pointer"
          title="Collapse sidebar"
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose className="w-4 h-4" aria-hidden />
        </button>
      </div>

      {/* Red + blue: full-width items flush to the right edge */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-1.5 space-y-4">
        {visibleSections.map((section) => (
          <div key={section.id} className="space-y-1">
            <div className="px-2 pb-1 text-[11px] font-bold tracking-wider text-subtle uppercase">
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
    </aside>
  );
}

/** Collapsed white-theme icon rail — no user card (profile lives in TopBar). */
function CollapsedRail({
  sections,
  pathname,
  onExpand,
}: {
  sections: NavSection[];
  pathname: string;
  onExpand: () => void;
}) {
  return (
    <aside
      className="hidden lg:flex w-[72px] flex-col bg-surface text-text select-none border-r border-border h-[100dvh] sticky top-0 z-30 overflow-hidden"
      aria-label="Collapsed navigation"
      data-collapsed="true"
    >
      <div className="shrink-0 border-b border-border flex h-14 sm:h-16 items-center justify-center px-2">
        <Link
          href={routes.dashboard}
          title="KR Workspace"
          className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-bg transition-colors"
        >
          <img
            src="/nav-logo/krws-mark-nav.png"
            alt="KR"
            className="h-7 w-7 object-contain"
          />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-3">
        {sections.map((section, sectionIndex) => (
          <div key={section.id} className="space-y-1">
            {sectionIndex > 0 && (
              <div className="mx-auto my-1 h-px w-6 bg-border" aria-hidden />
            )}
            <nav
              className="flex flex-col items-center gap-1"
              aria-label={section.title}
            >
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
                    className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                      active
                        ? "bg-brand-red-tint text-brand-red-500"
                        : "text-muted hover:text-text hover:bg-bg"
                    }`}
                  >
                    {active && (
                      <span
                        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-brand-red-500"
                        aria-hidden
                      />
                    )}
                    <Icon
                      size={18}
                      strokeWidth={active ? 2.2 : 1.8}
                      aria-hidden
                    />
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-border p-2">
        <button
          type="button"
          onClick={onExpand}
          title="Expand sidebar"
          aria-label="Expand sidebar"
          className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl text-muted hover:text-text hover:bg-bg transition-colors cursor-pointer"
        >
          <PanelLeftOpen className="h-4 w-4" aria-hidden />
        </button>
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
        className={`relative h-9 group flex items-center rounded-lg text-[13px] font-semibold transition-colors select-none overflow-hidden pl-2.5 pr-1 gap-0.5 ${
          isActive
            ? "bg-brand-red-tint text-brand-red-500"
            : childActive
              ? "bg-bg text-text"
              : "text-muted hover:text-text hover:bg-bg"
        }`}
      >
        {isActive && (
          <span
            className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-brand-red-500"
            aria-hidden
          />
        )}
        <Link
          href={item.href}
          className="flex min-w-0 flex-1 items-center h-full gap-2.5"
          aria-current={isActive ? "page" : undefined}
        >
          <Icon
            size={16}
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
            className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted hover:text-text hover:bg-surface transition-colors cursor-pointer"
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
                className={`relative h-8 group flex items-center gap-2 rounded-lg px-2.5 text-xs font-semibold transition-colors ${
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
