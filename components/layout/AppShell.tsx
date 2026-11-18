'use client';

import React, { useCallback, useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const openMobileMenu = useCallback(() => setMobileMenuOpen(true), []);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <div className="flex h-[100dvh] w-full max-w-[100vw] overflow-hidden bg-bg text-text">
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      <Sidebar />

      <MobileNav isOpen={mobileMenuOpen} onClose={closeMobileMenu} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar onOpenMobileMenu={openMobileMenu} />

        <main
          id="main-content"
          className="relative min-h-0 w-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-4 lg:p-5 xl:p-6"
        >
          <div className="w-full min-w-0">{children}</div>
        </main>
      </div>
    </div>
  );
}
