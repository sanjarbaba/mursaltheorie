import { useAuth } from '@clerk/expo';
import { Link } from 'expo-router';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { createApiClient } from './api/client';
import { saveAccessLease } from './storage';
import { colors } from './theme';
import type { Locale } from './types';

type Status = 'loading' | 'active' | 'denied' | 'error';
const labels: Record<Locale, { denied: string; error: string; deniedDetail: string; errorDetail: string; retry: string; account: string }> = {
  nl: { denied: 'Geen actieve toegang', error: 'Toegang controleren is niet gelukt', deniedDetail: 'Je hebt actieve cursustoegang nodig voor dit onderdeel.', errorDetail: 'Controleer je verbinding en probeer opnieuw.', retry: 'Opnieuw proberen', account: 'Mijn account' },
  fa: { denied: 'دسترسی فعال ندارید', error: 'بررسی دسترسی انجام نشد', deniedDetail: 'برای دیدن این بخش به دسترسی فعال دوره نیاز دارید.', errorDetail: 'اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.', retry: 'دوباره تلاش کنید', account: 'حساب من' },
  ps: { denied: 'فعال لاسرسی نشته', error: 'لاسرسی ونه کتل شوه', deniedDetail: 'د دې برخې لپاره د کورس فعال لاسرسی اړین دی.', errorDetail: 'انټرنېټ وګورئ او بیا هڅه وکړئ.', retry: 'بیا هڅه وکړئ', account: 'زما حساب' }
};

export function CourseGate({ locale, children }: { locale: Locale; children: ReactNode }) {
  const { getToken, userId } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const [retry, setRetry] = useState(0);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    if (!userId) { setStatus('loading'); return; }
    let mounted = true;
    setStatus('loading');
    void createApiClient(() => getTokenRef.current())<{ access: { hasAccess: boolean; locales?: Locale[]; entitlements?: Array<{ ends_at?: string | null }> } }>('/api/v1/access')
      .then(async (data) => {
        await saveAccessLease(userId, data.access);
        if (mounted) setStatus(data.access.hasAccess ? 'active' : 'denied');
      })
      .catch(() => { if (mounted) setStatus('error'); });
    return () => { mounted = false; };
  }, [userId, retry]);

  if (status === 'active') return <View style={styles.content}>{children}</View>;
  if (status === 'loading') return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  const copy = labels[locale];
  return <View style={styles.center}>
    <Text style={styles.title}>{status === 'denied' ? copy.denied : copy.error}</Text>
    <Text style={styles.message}>{status === 'denied' ? copy.deniedDetail : copy.errorDetail}</Text>
    {status === 'error' ? <Pressable onPress={() => setRetry((value) => value + 1)} style={styles.button}><Text style={styles.buttonText}>{copy.retry}</Text></Pressable> : <Link href={{ pathname: '/account', params: { locale } }} asChild><Pressable style={styles.button}><Text style={styles.buttonText}>{copy.account}</Text></Pressable></Link>}
  </View>;
}

const styles = StyleSheet.create({
  content: { flex: 1 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 13, padding: 25, backgroundColor: colors.background },
  title: { color: colors.ink, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  message: { color: colors.muted, fontSize: 16, lineHeight: 23, textAlign: 'center' },
  button: { minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, borderRadius: 13, backgroundColor: colors.primary },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800' }
});
