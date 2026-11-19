'use client';

import React from 'react';
import { AppShell } from './AppShell';
import { RouteRoleGuard } from '@/components/shared/RouteRoleGuard';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <AppShell>
      <RouteRoleGuard>{children}</RouteRoleGuard>
    </AppShell>
  );
}

