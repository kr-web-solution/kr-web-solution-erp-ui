/**
 * Central route → allowed roles map.
 * Built from NAV_SECTIONS so sidebar visibility and deep-link access cannot drift.
 */
import { NAV_SECTIONS, type UserRole } from './nav';
import { PRIVILEGED_ROLES } from './roles';
import { routes } from './routes';

export type RouteRoleRule = {
  /** Path prefix to match (e.g. /settings) */
  prefix: string;
  roles: UserRole[];
  /** When true, only exact path matches (default: prefix match). */
  exact?: boolean;
};

function rulesFromNav(): RouteRoleRule[] {
  const rules: RouteRoleRule[] = [];
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      rules.push({
        prefix: item.href,
        roles: item.roles,
        exact: !item.matchPrefix,
      });
      for (const child of item.children || []) {
        rules.push({
          prefix: child.href,
          roles: child.roles,
          exact: !child.matchPrefix,
        });
      }
    }
  }
  return rules;
}

/**
 * Extra privileged paths not represented as top-level nav items
 * (create/edit flows that share a parent nav visible to more roles).
 */
const EXTRA_PRIVILEGED_ROUTES: RouteRoleRule[] = [
  { prefix: routes.invoiceNew, roles: PRIVILEGED_ROLES as UserRole[], exact: true },
  // /invoices/:id/edit
  { prefix: '/invoices/', roles: PRIVILEGED_ROLES as UserRole[] }, // refined in matcher
];

/** Flattened rules: longest prefix wins. */
export const ROUTE_ROLE_RULES: RouteRoleRule[] = [
  ...rulesFromNav(),
  ...EXTRA_PRIVILEGED_ROUTES.filter((r) => r.prefix !== '/invoices/'),
];

function matchesRule(pathname: string, rule: RouteRoleRule): boolean {
  if (rule.exact) {
    return pathname === rule.prefix;
  }
  return pathname === rule.prefix || pathname.startsWith(rule.prefix + '/');
}

/** Invoice edit paths: /invoices/:id/edit */
function isInvoiceEditPath(pathname: string): boolean {
  return /^\/invoices\/[^/]+\/edit\/?$/.test(pathname);
}

/**
 * Roles allowed for a pathname, or null if the path is not role-gated
 * (any authenticated user may open it — API still enforces).
 */
export function rolesForPath(pathname: string): UserRole[] | null {
  if (isInvoiceEditPath(pathname)) {
    return PRIVILEGED_ROLES as UserRole[];
  }

  let best: RouteRoleRule | null = null;
  for (const rule of ROUTE_ROLE_RULES) {
    if (!matchesRule(pathname, rule)) continue;
    if (!best || rule.prefix.length > best.prefix.length) {
      best = rule;
    }
  }
  return best ? best.roles : null;
}

export function canAccessPath(
  pathname: string,
  role: string | null | undefined
): boolean {
  const allowed = rolesForPath(pathname);
  if (!allowed) return true;
  if (!role) return false;
  return allowed.includes(role as UserRole);
}
