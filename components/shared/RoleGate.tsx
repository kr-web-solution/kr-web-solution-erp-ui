'use client';

import React from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { UserRole } from '@/lib/types';
import { PRIVILEGED_ROLES } from '@/lib/roles';

interface RoleGateProps {
  allowedRoles?: UserRole[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/** Inline privilege gate for sections within a page. Prefer RouteRoleGuard for routes. */
export function RoleGate({
  allowedRoles = PRIVILEGED_ROLES as UserRole[],
  fallback = null,
  children,
}: RoleGateProps) {
  const { user, isLoading } = useAuth();
  const role = user?.role as UserRole;

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (!role || !allowedRoles.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
