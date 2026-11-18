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

  return (
    <aside
      className={`hidden lg:flex flex-col bg-surface text-text select-none border-r border-border h-[100dvh] sticky top-0 z-30 overflow-hidden transition-[width] duration-300 ease-in-out ${
        isCollapsed ? "w-[72px]" : "w-[264px]"
      }`}
      aria-label="Sidebar Navigation"
    >
      <div
        className={`shrink-0 border-b border-border bg-surface flex items-center transition-all duration-300 ease-in-out ${
          isCollapsed
            ? "h-[72px] flex-col justify-center gap-1.5 px-1.5"
            : "h-[72px] flex-row gap-1.5 px-3 pr-2"
        }`}
      >
        <Link
          href={routes.dashboard}
          className={`flex items-center justify-center min-w-0 ${
            isCollapsed ? "" : "flex-1"
          }`}
          title="KR Workspace"
        >
          {isCollapsed ? (
            <img
              src="/nav-logo/krws-mark-nav.png"
              alt="KR"
              className="h-8 w-auto object-contain pt-[6px]"
            />
          ) : (
            <img
              src="/nav-logo/krws-wordmark-nav.png"
              alt="KR Workspace"
              className="h-[42px] w-auto max-w-full object-contain object-left"
            />
          )}
        </Link>

        <button
          type="button"
          onClick={toggleCollapse}
          className="text-muted hover:text-text h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-bg transition-colors duration-200 cursor-pointer shrink-0"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4" aria-hidden />
          ) : (
            <PanelLeftClose className="w-4 h-4" aria-hidden />
          )}
        </button>
      </div>

      <div
        className={`flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-4 transition-[padding] duration-300 ease-in-out ${isCollapsed ? "px-2" : "px-3"}`}
      >
        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter((item) =>
            item.roles.includes(effectiveRole),
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.id} className="space-y-1">
              <div
                className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${
                  isCollapsed ? "max-h-0 opacity-0" : "max-h-6 opacity-100"
                }`}
              >
                <div className="px-2.5 pb-1 text-xs font-bold tracking-wider text-subtle uppercase">
                  {section.title}
                </div>
              </div>

              <nav className="space-y-0.5" aria-label={section.title}>
                {visibleItems.map((item) => (
                  <SidebarNavItem
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    isCollapsed={isCollapsed}
                    role={effectiveRole}
                  />
                ))}
              </nav>
            </div>
          );
        })}
      </div>

      <div className="shrink-0 border-t border-border bg-surface p-3">
        <div className="rounded-xl bg-bg border border-border flex items-center gap-2 overflow-hidden h-12 px-2">
          <Link href={routes.profile} title="Profile" className="shrink-0">
            <Avatar
              name={user?.full_name || "KR"}
              size="sm"
              className="w-8 h-8 text-[11px]"
            />
          </Link>
          <Link
            href={routes.profile}
            className={`leading-tight min-w-0 overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-in-out ${
              isCollapsed
                ? "max-w-0 opacity-0"
                : "max-w-[140px] opacity-100 flex-1"
            }`}
          >
            <span className="text-xs font-bold text-text block truncate">
              {user?.full_name || "KR User"}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-red-500 block">
              {effectiveRole.replace("_", " ")}
            </span>
          </Link>
          <button
            type="button"
            onClick={() => logout()}
            className={`text-muted hover:text-brand-red-500 hover:bg-brand-red-tint rounded-lg transition-all duration-300 ease-in-out cursor-pointer shrink-0 overflow-hidden ${
              isCollapsed
                ? "w-0 p-0 opacity-0 pointer-events-none"
                : "w-8 p-1.5 opacity-100"
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

function SidebarNavItem({
  item,
  pathname,
  isCollapsed,
  role,
}: {
  item: NavItem;
  pathname: string;
  isCollapsed: boolean;
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

  const showChildren = hasChildren && !isCollapsed && open;

  return (
    <div className="space-y-0.5">
      <div
        className={`relative h-10 group flex items-center rounded-lg text-sm font-semibold transition-all duration-300 ease-in-out select-none overflow-hidden ${
          isCollapsed ? "justify-center px-0 gap-0" : "pl-2.5 pr-1 gap-1"
        } ${
          isActive
            ? "bg-brand-red-tint text-brand-red-500"
            : childActive
              ? "bg-bg text-text"
              : "text-muted hover:text-text hover:bg-bg"
        }`}
      >
        {(isActive || (childActive && isCollapsed)) && (
          <span
            className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-brand-red-500"
            aria-hidden
          />
        )}
        <Link
          href={item.href}
          title={isCollapsed ? label : undefined}
          className={`flex min-w-0 flex-1 items-center h-full gap-2.5 ${
            isCollapsed ? "justify-center" : ""
          }`}
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
          <span
            className={`truncate whitespace-nowrap overflow-hidden transition-[max-width,opacity] duration-300 ease-in-out ${
              isCollapsed
                ? "max-w-0 opacity-0"
                : "max-w-[140px] opacity-100 flex-1"
            }`}
          >
            {label}
          </span>
        </Link>

        {hasChildren && !isCollapsed && (
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
