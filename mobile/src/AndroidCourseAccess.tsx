import { useAuth } from '@clerk/expo';
import { usePathname, useRouter } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
import { ApiError, createApiClient } from './api/client';
import { canOpenCourse, serverGrantExpiry } from './access-policy';
import type { AccessSnapshot } from './access-policy';
import { readOfflineAccessLease, saveAccessLease } from './storage';
import type { Locale } from './types';

type Access = { hasAccess: boolean; locales?: Locale[]; entitlements?: Array<{ ends_at?: string | null }> };
type CourseAccess = { allowed: boolean; status: AccessSnapshot['status']; refresh: () => Promise<void> };
const Context = createContext<CourseAccess | null>(null);
export const useAndroidCourseAccess = () => useContext(Context);

export function AndroidCourseAccessProvider({ children }: { children: ReactNode }) {
  const { getToken, userId, isLoaded, isSignedIn } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const tokenRef = useRef(getToken);
  tokenRef.current = getToken;
  const pathRef = useRef(pathname);
  pathRef.current = pathname;
  const sequence = useRef(0);
  const [snapshot, setSnapshot] = useState<AccessSnapshot>({ userId: null, status: 'checking', validUntil: 0 });
  const enabled = Platform.OS === 'android';

  const refresh = useCallback(async () => {
    const requestId = ++sequence.current;
    if (!enabled || !isLoaded || !isSignedIn || !userId) {
      setSnapshot({ userId: null, status: 'checking', validUntil: 0 });
      return;
    }
    const accountId = userId;
    let serverDenied = false;
    try {
      const data = await createApiClient(() => tokenRef.current())<{ access: Access }>('/api/v1/access');
      if (requestId !== sequence.current) return;
      const validUntil = serverGrantExpiry(data.access);
      serverDenied = validUntil <= Date.now();
      if (serverDenied) setSnapshot({ userId: accountId, status: 'denied', validUntil: 0 });
      await saveAccessLease(accountId, data.access);
      if (requestId !== sequence.current) return;
      setSnapshot({ userId: accountId, status: validUntil > Date.now() ? 'active' : 'denied', validUntil });
    } catch (error) {
      if (requestId !== sequence.current) return;
      // A server rejection must never fall back to an old grant.
      if (serverDenied || (error instanceof ApiError && (error.status === 401 || error.status === 403))) {
        await saveAccessLease(accountId, { hasAccess: false }).catch(() => undefined);
        if (requestId === sequence.current) setSnapshot({ userId: accountId, status: 'denied', validUntil: 0 });
        return;
      }
      const lease = await readOfflineAccessLease(accountId).catch(() => null);
      if (requestId !== sequence.current) return;
      setSnapshot({ userId: accountId, status: lease ? 'active' : 'error', validUntil: lease?.validUntil || 0 });
    }
  }, [enabled, isLoaded, isSignedIn, userId]);

  useEffect(() => {
    void refresh();
    return () => { sequence.current += 1; };
  }, [refresh]);

  useEffect(() => {
    if (!enabled) return;
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => listener.remove();
  }, [enabled, refresh]);

  useEffect(() => {
    if (!enabled || snapshot.status !== 'active') return;
    const timeout = setTimeout(() => {
      if (snapshot.validUntil <= Date.now()) setSnapshot((current) => ({ ...current, status: 'checking' }));
      void refresh();
    }, Math.max(0, Math.min(snapshot.validUntil - Date.now(), 60_000)));
    return () => clearTimeout(timeout);
  }, [enabled, snapshot, refresh]);

  const allowed = canOpenCourse(snapshot, userId, Boolean(isSignedIn));
  const wasAllowed = useRef(false);
  useEffect(() => {
    if (enabled && allowed && !wasAllowed.current && pathRef.current === '/account') router.replace('/');
    wasAllowed.current = allowed;
  }, [enabled, allowed, router]);

  return <Context.Provider value={enabled ? { allowed, status: snapshot.userId === userId ? snapshot.status : 'checking', refresh } : null}>{children}</Context.Provider>;
}
