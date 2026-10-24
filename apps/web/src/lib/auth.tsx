'use client';

import { Role } from '@wizzapp/shared';
import type { AuthenticatedUser, LoginResponse } from '@wizzapp/shared';
import { useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ApiError, api, setUnauthorizedHandler, tokenStore } from './api';

interface AuthState {
  user: AuthenticatedUser | null;
  /** True until the stored token has been checked against the API. */
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthenticatedUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function homeFor(role: Role): string {
  return role === Role.Trainer ? '/trainer' : '/client';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    router.replace('/login');
  }, [router]);

  // A 401 from anywhere in the app means the token died — bounce to login
  // rather than letting a screen render half-empty.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      router.replace('/login');
    });
    return () => setUnauthorizedHandler(null);
  }, [router]);

  // Restore the session on load: the token is only trustworthy if the API
  // still recognises it, so ask rather than decode it here.
  useEffect(() => {
    let cancelled = false;

    if (!tokenStore.get()) {
      setLoading(false);
      return;
    }

    api
      .get<AuthenticatedUser>('/auth/me')
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => {
        if (!cancelled) tokenStore.clear();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.post<LoginResponse>('/auth/login', { email, password });
    tokenStore.set(result.accessToken);

    const me: AuthenticatedUser = {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: result.role,
    };
    setUser(me);
    return me;
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}

/**
 * Guards a role's section of the app. Renders nothing while the session is
 * being restored, so a protected screen never flashes before the redirect.
 */
export function useRequireRole(role: Role): AuthenticatedUser | null {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    } else if (user.role !== role) {
      // Signed in, wrong section — send them to their own.
      router.replace(homeFor(user.role));
    }
  }, [user, loading, role, router]);

  return user?.role === role ? user : null;
}

/** True when an error is just "this hasn't been set up yet" (spec: /active routes 404). */
export function isEmptyState(error: unknown): boolean {
  return error instanceof ApiError && error.isNotFound;
}
