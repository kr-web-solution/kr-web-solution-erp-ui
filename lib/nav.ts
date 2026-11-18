import {
  LayoutDashboard,
  FolderKanban,
  Receipt,
  Wallet,
  Users2,
  Building2,
  Settings,
  Briefcase,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import { routes } from './routes';

export type UserRole = 'admin' | 'founder_ceo' | 'worker' | 'client';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
  matchPrefix?: boolean;
}

export interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
}

export function labelForNavItem(item: NavItem): string {
  return item.label;
}

/** Role-aware ERP nav — MAIN / SALES / FINANCE / ADMIN */
export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'main',
    title: 'MAIN',
    items: [
      {
        label: 'Dashboard',
        href: routes.dashboard,
        icon: LayoutDashboard,
        roles: ['admin', 'founder_ceo', 'client'],
      },
      {
        label: 'My work',
        href: routes.staffMe,
        icon: Briefcase,
        roles: ['worker'],
      },
      {
        label: 'Projects',
        href: routes.projects,
        icon: FolderKanban,
        roles: ['admin', 'founder_ceo', 'worker', 'client'],
        matchPrefix: true,
      },
      {
        label: 'Clients',
        href: routes.clients,
        icon: Building2,
        roles: ['admin', 'founder_ceo'],
        matchPrefix: true,
      },
      {
        label: 'Staff',
        href: routes.staff,
        icon: UsersRound,
        roles: ['admin', 'founder_ceo'],
        matchPrefix: true,
      },
    ],
  },
  {
    id: 'sales',
    title: 'SALES',
    items: [
      {
        label: 'Leads',
        href: routes.leads,
        icon: Users2,
        roles: ['admin', 'founder_ceo'],
        matchPrefix: true,
      },
    ],
  },
  {
    id: 'finance',
    title: 'FINANCE',
    items: [
      {
        label: 'Invoices',
        href: routes.invoices,
        icon: Receipt,
        roles: ['admin', 'founder_ceo', 'client'],
        matchPrefix: true,
      },
      {
        label: 'Expenses',
        href: routes.expenses,
        icon: Wallet,
        roles: ['admin', 'founder_ceo'],
        matchPrefix: true,
      },
    ],
  },
  {
    id: 'admin',
    title: 'ADMIN',
    items: [
      {
        label: 'Settings',
        href: routes.settings,
        icon: Settings,
        roles: ['admin', 'founder_ceo'],
        matchPrefix: true,
      },
    ],
  },
];

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (pathname === item.href) return true;
  if (!item.matchPrefix) return false;
  // Avoid /dashboard matching everything via prefix
  if (item.href === routes.dashboard) return false;
  return pathname.startsWith(item.href + '/') || pathname.startsWith(item.href + '?');
}

/** Flat list (legacy helpers) */
export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);
export const MAIN_NAV_ITEMS = NAV_ITEMS;
export const NAV_GROUPS = [
  {
    id: 'core',
    title: 'KR Workspace',
    links: NAV_ITEMS,
  },
];
