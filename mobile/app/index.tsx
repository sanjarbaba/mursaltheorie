import { useAuth, useClerk } from '@clerk/expo';
import { Link } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { createApiClient } from '@/src/api/client';
import { getDeviceId } from '@/src/device';
import {
  cacheLessons,
  flushProgressQueue,
  isLessonsCacheFresh,
  readCachedLessons,
  readPreferredLocale,
  savePreferredLocale
} from '@/src/storage';
import type { Lesson, LessonsResponse, Locale } from '@/src/types';

type AccessResponse = {
  access: {
    hasAccess: boolean;
    products: string[];
    locales?: Locale[];
  };
};

const labels: Record<Locale, {
  title: string;
  active: string;
  noAccess: string;
  offline: string;
  refresh: string;
  signOut: string;
  empty: string;
}> = {
  nl: {
    title: 'Mijn cursus',
    active: 'Toegang actief',
    noAccess: 'Je account heeft nog geen actieve toegang tot deze cursus.',
    offline: 'Offline — opgeslagen lessen',
    refresh: 'Vernieuwen',
    signOut: 'Uitloggen',
    empty: 'Nog geen lessen beschikbaar.'
  },
  fa: {
    title: 'دوره من',
    active: 'دسترسی فعال است',
    noAccess: 'برای این حساب هنوز دسترسی فعال به دوره وجود ندارد.',
    offline: 'آفلاین — درس‌های ذخیره‌شده',
    refresh: 'تازه‌سازی',
    signOut: 'خروج',
    empty: 'هنوز درسی موجود نیست.'
  },
  ps: {
    title: 'زما کورس',
    active: 'لاسرسی فعال دی',
    noAccess: 'په دې حساب کې لا د کورس فعال لاسرسی نشته.',
    offline: 'آفلاین — خوندي شوي درسونه',
    refresh: 'تازه کول',
    signOut: 'وتل',
    empty: 'تر اوسه درسونه نشته.'
  }
};

export default function HomeScreen() {
  const { getToken, userId } = useAuth();
  const { signOut } = useClerk();
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState('');
  const [locale, setLocale] = useState<Locale>('nl');
  const [allowedLocales, setAllowedLocales] = useState<Locale[]>(['nl']);

  useEffect(() => {
    void readPreferredLocale().then(setLocale);
  }, []);

  const load = useCallback(async (forceContentRefresh = false) => {
    setLoading(true);
    setError('');
    try {
      const request = createApiClient(getToken);
      const deviceId = await getDeviceId();

      await request('/api/v1/devices', {
        method: 'PUT',
        body: JSON.stringify({ deviceId, platform: Platform.OS === 'ios' ? 'ios' : 'android' })
      });

      if (userId) await flushProgressQueue(userId, request);

      const accessData = await request<AccessResponse>('/api/v1/access');
      const hasAccess = accessData.access.hasAccess;
      const locales = accessData.access.locales?.length ? accessData.access.locales : ['nl'];
      setAccess(hasAccess);
      setAllowedLocales(locales);

      const effectiveLocale = locales.includes(locale) ? locale : locales[0] || 'nl';
      if (effectiveLocale !== locale) {
        setLocale(effectiveLocale);
        await savePreferredLocale(effectiveLocale);
      }

      if (!hasAccess) {
        setLessons([]);
        setOffline(false);
        return;
      }

      const cached = await readCachedLessons(effectiveLocale);
      const fresh = await isLessonsCacheFresh(effectiveLocale);

      if (cached?.lessons.length && fresh && !forceContentRefresh) {
        setLessons(cached.lessons);
        setOffline(false);
        return;
      }

      const lessonsData = await request<LessonsResponse>(`/api/v1/lessons?locale=${effectiveLocale}`);
      await cacheLessons(lessonsData);
      setLessons(lessonsData.lessons);
      setOffline(false);
    } catch (cause) {
      const cached = await readCachedLessons(locale);
      if (cached?.lessons.length) {
        setLessons(cached.lessons);
        setOffline(true);
      } else {
        setError(cause instanceof Error ? cause.message : 'Laden mislukt.');
      }
    } finally {
      setLoading(false);
    }
  }, [getToken, userId, locale]);

  useEffect(() => { void load(false); }, [load]);

  async function chooseLocale(next: Locale) {
    if (!allowedLocales.includes(next)) return;
    await savePreferredLocale(next);
    setLocale(next);
  }

  const copy = labels[locale];
  const rtl = locale === 'fa' || locale === 'ps';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.brand, rtl && styles.rtl]}>Mursal Theorie</Text>
        <Text style={[styles.title, rtl && styles.rtl]}>{copy.title}</Text>

        <View style={styles.languageRow}>
          {(['nl', 'fa', 'ps'] as Locale[]).map((item) => (
            <Pressable
              key={item}
              disabled={!allowedLocales.includes(item)}
              onPress={() => void chooseLocale(item)}
              style={[
                styles.languageButton,
                item === locale && styles.languageButtonActive,
                !allowedLocales.includes(item) && styles.languageButtonDisabled
              ]}
            >
              <Text style={item === locale ? styles.languageTextActive : styles.languageText}>
                {item === 'nl' ? 'NL' : item === 'fa' ? 'دری/فارسی' : 'پښتو'}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.status, rtl && styles.rtl]}>
          {access ? copy.active : copy.noAccess}
        </Text>
        {offline ? <Text style={[styles.offline, rtl && styles.rtl]}>{copy.offline}</Text> : null}
        {error ? <Text style={[styles.error, rtl && styles.rtl]}>{error}</Text> : null}
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} />
      ) : access ? (
        <FlatList
          data={lessons}
          keyExtractor={(lesson) => String(lesson.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={[styles.empty, rtl && styles.rtl]}>{copy.empty}</Text>}
          renderItem={({ item }) => (
            <Link
              href={{ pathname: '/lesson/[id]', params: { id: String(item.id), locale } }}
              asChild
            >
              <Pressable style={styles.lesson}>
                <Text style={[styles.module, rtl && styles.rtl]}>
                  {item.module.title}
                </Text>
                <Text style={[styles.lessonTitle, rtl && styles.rtl]}>
                  {item.id}. {item.title}
                </Text>
                <Text numberOfLines={2} style={[styles.summary, rtl && styles.rtl]}>
                  {item.summary}
                </Text>
              </Pressable>
            </Link>
          )}
          ListFooterComponent={
            <View style={styles.actions}>
              <Pressable style={styles.primaryButton} onPress={() => void load(true)}>
                <Text style={styles.primaryButtonText}>{copy.refresh}</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={() => void signOut()}>
                <Text style={styles.secondaryButtonText}>{copy.signOut}</Text>
              </Pressable>
            </View>
          }
        />
      ) : (
        <View style={styles.noAccessCard}>
          <Text style={[styles.noAccessTitle, rtl && styles.rtl]}>{copy.noAccess}</Text>
          <Pressable style={styles.secondaryButton} onPress={() => void signOut()}>
            <Text style={styles.secondaryButtonText}>{copy.signOut}</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1633' },
  header: { gap: 8, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12 },
  brand: { color: '#9cc9ff', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  title: { color: '#ffffff', fontSize: 30, fontWeight: '800' },
  status: { color: '#d9e7ff', fontSize: 15, lineHeight: 22 },
  loader: { flex: 1 },
  list: { gap: 12, padding: 16, paddingBottom: 44 },
  lesson: { padding: 18, borderRadius: 18, backgroundColor: '#142653', borderWidth: 1, borderColor: '#24437f' },
  module: { marginBottom: 6, color: '#9cc9ff', fontSize: 13, fontWeight: '700' },
  lessonTitle: { marginBottom: 7, color: '#ffffff', fontSize: 18, fontWeight: '800' },
  summary: { color: '#d2def3', fontSize: 15, lineHeight: 22 },
  offline: { color: '#ffd66b', fontWeight: '700' },
  error: { color: '#ff9c9c' },
  empty: { color: '#c7d4ec', padding: 20, textAlign: 'center' },
  rtl: { textAlign: 'right', writingDirection: 'rtl' },
  languageRow: { flexDirection: 'row', gap: 8, marginVertical: 6 },
  languageButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#152957', borderWidth: 1, borderColor: '#355795' },
  languageButtonActive: { backgroundColor: '#e84a5f', borderColor: '#ff7b8e' },
  languageButtonDisabled: { opacity: 0.35 },
  languageText: { color: '#d9e7ff', fontWeight: '700' },
  languageTextActive: { color: '#ffffff', fontWeight: '800' },
  actions: { gap: 10, marginTop: 14 },
  primaryButton: { alignItems: 'center', paddingVertical: 14, borderRadius: 14, backgroundColor: '#e84a5f' },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  secondaryButton: { alignItems: 'center', paddingVertical: 13, borderRadius: 14, backgroundColor: '#172b59', borderWidth: 1, borderColor: '#365487' },
  secondaryButtonText: { color: '#e9f1ff', fontSize: 15, fontWeight: '700' },
  noAccessCard: { margin: 18, gap: 18, padding: 22, borderRadius: 20, backgroundColor: '#142653', borderWidth: 1, borderColor: '#24437f' },
  noAccessTitle: { color: '#ffffff', fontSize: 18, lineHeight: 27, fontWeight: '700' }
});
