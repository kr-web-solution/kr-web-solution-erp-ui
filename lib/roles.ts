import type { UserRole } from '@/lib/types';

/** Admin and Founder CEO share full workspace access. */
export const PRIVILEGED_ROLES: UserRole[] = ['admin', 'founder_ceo'];

export function isPrivileged(role?: UserRole | string | null): boolean {
  return role === 'admin' || role === 'founder_ceo';
}

export function roleLabel(role?: UserRole | string | null): string {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'founder_ceo':
      return 'Founder CEO';
    case 'worker':
      return 'Worker';
    case 'client':
      return 'Client';
    case 'lead':
      return 'Lead';
    default:
      return role || 'User';
  }
}
