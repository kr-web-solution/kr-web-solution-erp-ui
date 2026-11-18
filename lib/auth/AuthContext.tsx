'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '../types';
import { authApi } from '../api/client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  loginWithGoogle: (idToken: string) => Promise<User>;
  loginWithMicrosoft: (idToken: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_ROUTES = ['/login', '/forgot-password', '/reset-password', '/set-password'];
const ONBOARDING_ROUTE = '/onboarding/profile';

function homeFor(role: string) {
  return role === 'worker' ? '/staff/me' : '/dashboard';
}

function postAuthDestination(user: User) {
  if (!user.profile_completed) {
    return ONBOARDING_ROUTE;
  }
  return homeFor(user.role);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();
  const navigatingRef = useRef(false);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const currentUser = await authApi.me();
      setUser(currentUser);
      return currentUser;
    } catch {
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Warm likely post-login routes so Sign in does not sit on a cold compile
  useEffect(() => {
    router.prefetch('/dashboard');
    router.prefetch('/onboarding/profile');
    router.prefetch('/staff/me');
  }, [router]);

  // Route protection + progressive profile gate
  useEffect(() => {
    if (isLoading) return;

    const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
    const isOnboarding = pathname.startsWith(ONBOARDING_ROUTE);

    if (!user && !isPublic) {
      navigatingRef.current = false;
      router.replace('/login');
      return;
    }

    if (user && isPublic) {
      if (navigatingRef.current) return;
      navigatingRef.current = true;
      router.replace(postAuthDestination(user));
      return;
    }

    if (user && !user.profile_completed && !isOnboarding && !isPublic) {
      router.replace(ONBOARDING_ROUTE);
      return;
    }

    if (user && user.profile_completed && isOnboarding) {
      router.replace(homeFor(user.role));
    }

    if (user && !isPublic) {
      navigatingRef.current = false;
    }
  }, [user, isLoading, pathname, router]);

  const finishLogin = (loggedIn: User) => {
    setUser(loggedIn);
    navigatingRef.current = true;
    const dest = postAuthDestination(loggedIn);
    router.prefetch(dest);
    // Fire-and-forget — never block the login promise on route compilation
    router.replace(dest);
    return loggedIn;
  };

  const login = async (credentials: { email: string; password: string }): Promise<User> => {
    const res = await authApi.login(credentials);
    return finishLogin(res.user);
  };

  const loginWithGoogle = async (idToken: string): Promise<User> => {
    const res = await authApi.loginWithGoogle(idToken);
    return finishLogin(res.user);
  };

  const loginWithMicrosoft = async (idToken: string): Promise<User> => {
    const res = await authApi.loginWithMicrosoft(idToken);
    return finishLogin(res.user);
  };

  const logout = async () => {
    setIsLoading(true);
    navigatingRef.current = false;
    try {
      await authApi.logout();
    } catch {
      // Continue client cleanup even if network failed
    } finally {
      setUser(null);
      setIsLoading(false);
      router.replace('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        loginWithGoogle,
        loginWithMicrosoft,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
