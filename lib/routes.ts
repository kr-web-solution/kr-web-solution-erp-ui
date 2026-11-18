/**
 * Canonical ERP UI routes — single source of truth.
 * Prefer these helpers over hard-coded path strings.
 */
export const routes = {
  root: '/',
  login: '/login',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',

  dashboard: '/dashboard',
  needsAction: '/dashboard#needs-action',

  projects: '/projects',
  project: (id: string) => `/projects/${id}`,

  leads: '/leads',
  leadNew: '/leads/new',
  lead: (id: string) => `/leads/${id}`,

  clients: '/clients',
  client: (id: string) => `/clients/${id}`,

  invoices: '/invoices',
  invoiceNew: '/invoices/new',
  invoice: (id: string) => `/invoices/${id}`,
  invoiceEdit: (id: string) => `/invoices/${id}/edit`,

  expenses: '/expenses',
  expenseSection: (slug: 'recurring' | 'daily' | 'upgrades' | 'other') =>
    `/expenses/${slug}` as const,

  settings: '/settings',
  profile: '/profile',

  staff: '/staff',
  staffMe: '/staff/me',
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];

export type Crumb = { label: string; href: string };

/** Breadcrumb segments for the current pathname. */
export function breadcrumbsFor(pathname: string): Crumb[] {
  const home: Crumb = { label: 'Home', href: routes.dashboard };
  const parts = pathname.split('/').filter(Boolean);

  if (parts.length === 0 || parts[0] === 'dashboard') {
    return [home, { label: 'Dashboard', href: routes.dashboard }];
  }

  const crumbs: Crumb[] = [home];

  switch (parts[0]) {
    case 'projects':
      crumbs.push({ label: 'Projects', href: routes.projects });
      if (parts[1]) crumbs.push({ label: 'Project', href: pathname });
      break;
    case 'leads':
      crumbs.push({ label: 'Leads', href: routes.leads });
      if (parts[1] === 'new') crumbs.push({ label: 'New lead', href: routes.leadNew });
      else if (parts[1]) crumbs.push({ label: 'Lead', href: pathname });
      break;
    case 'clients':
      crumbs.push({ label: 'Clients', href: routes.clients });
      if (parts[1]) crumbs.push({ label: 'Client', href: pathname });
      break;
    case 'invoices':
      crumbs.push({ label: 'Invoices', href: routes.invoices });
      if (parts[1] === 'new') crumbs.push({ label: 'New invoice', href: routes.invoiceNew });
      else if (parts[1] && parts[2] === 'edit') {
        crumbs.push({ label: 'Invoice', href: routes.invoice(parts[1]) });
        crumbs.push({ label: 'Edit', href: pathname });
      } else if (parts[1]) crumbs.push({ label: 'Invoice', href: pathname });
      break;
    case 'expenses':
      crumbs.push({ label: 'Expenses', href: routes.expenses });
      if (parts[1] === 'recurring') {
        crumbs.push({ label: 'Recurring', href: routes.expenseSection('recurring') });
      } else if (parts[1] === 'daily') {
        crumbs.push({ label: 'Daily', href: routes.expenseSection('daily') });
      } else if (parts[1] === 'upgrades') {
        crumbs.push({ label: 'Upgrades', href: routes.expenseSection('upgrades') });
      } else if (parts[1] === 'other') {
        crumbs.push({ label: 'Other', href: routes.expenseSection('other') });
      }
      break;
    case 'settings':
      crumbs.push({ label: 'Settings', href: routes.settings });
      break;
    case 'staff':
      crumbs.push({ label: 'Staff', href: routes.staff });
      if (parts[1] === 'me') crumbs.push({ label: 'My work', href: routes.staffMe });
      break;
    case 'profile':
      crumbs.push({ label: 'Profile', href: routes.profile });
      break;
    default:
      crumbs.push({ label: parts[0], href: pathname });
  }

  return crumbs;
}
