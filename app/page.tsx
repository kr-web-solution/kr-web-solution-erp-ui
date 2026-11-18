'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';

export default function RootPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace(user.role === 'worker' ? '/staff/me' : '/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#620C13] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
