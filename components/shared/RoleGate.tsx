'use client';

import React from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { UserRole } from '@/lib/types';

interface RoleGateProps {
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function RoleGate({
  allowedRoles,
  fallback = null,
  children,
}: RoleGateProps) {
  const { user } = useAuth();
  const role = user?.role as UserRole;

  if (!role || !allowedRoles.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
