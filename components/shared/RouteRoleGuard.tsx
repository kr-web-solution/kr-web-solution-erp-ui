'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { canAccessPath } from '@/lib/routeRoles';
import { routes } from '@/lib/routes';
import { PageSkeleton } from '@/components/ui/Skeleton';

/**
 * Defense-in-depth: block deep links to pages the nav already hides for this role.
 * API remains the source of truth (403). Avoids flashing protected content while auth loads.
 */
export function RouteRoleGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const allowed = canAccessPath(pathname, user?.role);
  const blocked = !isLoading && !!user && !allowed;

  useEffect(() => {
    if (blocked) {
      // Workers are not allowed on /dashboard — send them to their home.
      const home = user?.role === 'worker' ? routes.staffMe : routes.dashboard;
      router.replace(home);
    }
  }, [blocked, router, user?.role]);

  if (isLoading) {
    return (
      <div className="p-6">
        <PageSkeleton />
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="p-6">
        <PageSkeleton />
      </div>
    );
  }

  return <>{children}</>;
}
