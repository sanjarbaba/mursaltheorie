import { useAuth } from '@clerk/expo';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, useFocusEffect } from 'expo-router';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { createApiClient } from '@/src/api/client';
import { mediaUrl } from '@/src/content';
import { TabShell } from '@/src/Menu';
import { getDeviceId } from '@/src/device';
import { colors } from '@/src/theme';
import {
  cacheLessons,
  flushProgressQueue,
  isLessonsCacheFresh,
  readCachedLessons,
  readProgressQueue,
  readPreferredLocale,
  saveAccessLease,
  savePreferredLocale
} from '@/src/storage';
import type { Lesson, LessonsResponse, Locale } from '@/src/types';

type AccessResponse = {
  access: {
    hasAccess: boolean;
    products: string[];
    locales?: Locale[];
    entitlements?: Array<{ ends_at?: string | null }>;
  };
};

const labels: Record<Locale, {
  title: string;
  active: string;
  noAccess: string;
  offline: string;
  refresh: string;
  empty: string;
}> = {
  nl: {
    title: 'Mijn cursus',
    active: 'Toegang actief',
    noAccess: 'Je account heeft nog geen actieve toegang tot deze cursus.',
    offline: 'Offline — opgeslagen lessen',
    refresh: 'Vernieuwen',
    empty: 'Nog geen lessen beschikbaar.'
  },
  fa: {
    title: 'دوره من',
    active: 'دسترسی فعال است',
    noAccess: 'برای این حساب هنوز دسترسی فعال به دوره وجود ندارد.',
    offline: 'آفلاین — درس‌های ذخیره‌شده',
    refresh: 'تازه‌سازی',
    empty: 'هنوز درسی موجود نیست.'
  },
  ps: {
    title: 'زما کورس',
    active: 'لاسرسی فعال دی',
    noAccess: 'په دې حساب کې لا د کورس فعال لاسرسی نشته.',
    offline: 'آفلاین — خوندي شوي درسونه',
    refresh: 'تازه کول',
    empty: 'تر اوسه درسونه نشته.'
  }
};

const LessonCard = memo(function LessonCard({ lesson, locale, completed }: { lesson: Lesson; locale: Locale; completed: boolean }) {
  const uri = mediaUrl(lesson.media[0]?.src);
  const rtl = locale !== 'nl';
  return <Link href={{ pathname: '/lesson/[id]', params: { id: String(lesson.id), locale } }} asChild>
    <Pressable style={styles.lesson} accessibilityLabel={`${lesson.id}. ${lesson.title}`}>
      {uri ? <Image source={{ uri }} style={styles.thumbnail} resizeMode="cover" /> : <View style={styles.thumbnailFallback}><Ionicons name="book-outline" size={25} color={colors.primary} /></View>}
      <View style={styles.lessonBody}>
        <Text numberOfLines={1} style={[styles.module, rtl && styles.rtl]}>{lesson.module.title}</Text>
        <Text numberOfLines={2} style={[styles.lessonTitle, rtl && styles.rtl]}>{lesson.id}. {lesson.title}</Text>
        <Text numberOfLines={2} style={[styles.summary, rtl && styles.rtl]}>{lesson.summary}</Text>
      </View>
      <Ionicons name={completed ? 'checkmark-circle' : 'chevron-forward'} size={completed ? 20 : 17} color={completed ? colors.success : colors.muted} />
    </Pressable>
  </Link>;
});

export default function HomeScreen() {
  const { getToken, userId } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState<boolean | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState('');
  const [locale, setLocale] = useState<Locale>('nl');
  const [allowedLocales, setAllowedLocales] = useState<Locale[]>(['nl']);
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    void readPreferredLocale().then(setLocale);
  }, []);

  const load = useCallback(async (forceContentRefresh = false) => {
    const accountId = userId;
    setLoading(true);
    setAccess(null);
    setError('');
    if (!accountId) { setLoading(false); return; }
    let accessDenied = false;
    try {
      const request = createApiClient(() => getTokenRef.current());
      const deviceId = await getDeviceId();

      await request('/api/v1/devices', {
        method: 'PUT',
        body: JSON.stringify({ deviceId, platform: Platform.OS === 'ios' ? 'ios' : 'android' })
      });

      await flushProgressQueue(accountId, request);

      const accessData = await request<AccessResponse>('/api/v1/access');
      const hasAccess = accessData.access.hasAccess;
      accessDenied = !hasAccess;
      await saveAccessLease(accountId, accessData.access);
      const locales: Locale[] = accessData.access.locales?.length ? accessData.access.locales : ['nl'];
      setAccess(hasAccess);
      setAllowedLocales(locales);

      const effectiveLocale: Locale = locales.includes(locale) ? locale : (locales[0] || 'nl');
      if (effectiveLocale !== locale) {
        setLocale(effectiveLocale);
        await savePreferredLocale(effectiveLocale);
      }

      if (!hasAccess) {
        setLessons([]);
        setOffline(false);
        return;
      }

      const cached = await readCachedLessons(accountId, effectiveLocale);
      const fresh = await isLessonsCacheFresh(accountId, effectiveLocale);

      if (cached?.lessons.length && fresh && !forceContentRefresh) {
        setLessons(cached.lessons);
        setOffline(false);
        return;
      }

      const lessonsData = await request<LessonsResponse>(`/api/v1/lessons?locale=${effectiveLocale}`);
      await cacheLessons(accountId, lessonsData);
      setLessons(lessonsData.lessons);
      setOffline(false);
    } catch (cause) {
      if (accessDenied) {
        setAccess(false);
        setLessons([]);
        setOffline(false);
        return;
      }
      const cached = await readCachedLessons(accountId, locale);
      if (cached?.lessons.length) {
        setAccess(true);
        setAllowedLocales([locale]);
        setLessons(cached.lessons);
        setOffline(true);
      } else {
        setError(cause instanceof Error ? cause.message : 'Laden mislukt.');
      }
    } finally {
      setLoading(false);
    }
  }, [userId, locale]);

  useEffect(() => { void load(false); }, [load]);

  useFocusEffect(useCallback(() => {
    if (!userId || access !== true) return;
    let active = true;
    void (async () => {
      try {
        const request = createApiClient(() => getTokenRef.current());
        const data = await request<{ progress: Array<{ lesson_id: number; completed: boolean }> }>('/api/v1/progress');
        const completed = new Set(data.progress.filter((item) => item.completed).map((item) => Number(item.lesson_id)));
        const queued = await readProgressQueue(userId);
        for (const item of queued) {
          if (item.completed) completed.add(item.lessonId);
          else completed.delete(item.lessonId);
        }
        if (active) setCompletedIds(completed);
      } catch {
        const queued = await readProgressQueue(userId);
        if (active && queued.length) setCompletedIds((previous) => new Set([...previous, ...queued.filter((item) => item.completed).map((item) => item.lessonId)]));
      }
    })();
    return () => { active = false; };
  }, [userId, access]));

  async function chooseLocale(next: Locale) {
    if (!allowedLocales.includes(next)) return;
    await savePreferredLocale(next);
    setLocale(next);
  }

  const copy = labels[locale];
  const rtl = locale === 'fa' || locale === 'ps';

  return (
    <TabShell locale={locale} active="lessons">
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Image source={require('../assets/logo.jpg')} style={styles.brandMark} resizeMode="cover" accessibilityLabel="Mursal Theorie logo" />
          <Text style={styles.brand}>MURSAL THEORIE</Text>
          {access === true ? <View style={styles.activeBadge}><View style={styles.activeDot} /><Text style={styles.activeText}>{copy.active}</Text></View> : null}
        </View>
        <Text style={[styles.title, rtl && styles.rtl]}>{copy.title}</Text>
        <Text style={[styles.subtitle, rtl && styles.rtl]}>{locale === 'nl' ? 'Leer in jouw tempo, stap voor stap.' : locale === 'fa' ? 'با سرعت خودتان، گام به گام یاد بگیرید.' : 'په خپل وخت، ګام په ګام زده کړه وکړئ.'}</Text>

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
        {access === true && lessons.length ? <View style={styles.progressCard}>
          <View style={styles.progressRow}><Text style={styles.progressLabel}>{locale === 'nl' ? 'Mijn voortgang' : locale === 'fa' ? 'پیشرفت من' : 'زما پرمختګ'}</Text><Text style={styles.progressCount}>{completedIds.size} / {lessons.length}</Text></View>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.min(100, completedIds.size / lessons.length * 100)}%` }]} /></View>
        </View> : null}
        {offline ? <Text style={[styles.offline, rtl && styles.rtl]}>{copy.offline}</Text> : null}
        {error ? <Text style={[styles.error, rtl && styles.rtl]}>{error}</Text> : null}
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : access ? (
        <FlatList
          style={styles.listView}
          data={lessons}
          keyExtractor={(lesson) => String(lesson.id)}
          contentContainerStyle={styles.list}
          initialNumToRender={7}
          maxToRenderPerBatch={7}
          windowSize={5}
          ListHeaderComponent={<View style={styles.listHeading}><Text style={styles.sectionTitle}>{locale === 'nl' ? 'Alle lessen' : locale === 'fa' ? 'همه درس‌ها' : 'ټول درسونه'}</Text><Text style={styles.count}>{lessons.length}</Text></View>}
          ListEmptyComponent={<Text style={[styles.empty, rtl && styles.rtl]}>{copy.empty}</Text>}
          renderItem={({ item }) => <LessonCard lesson={item} locale={locale} completed={completedIds.has(item.id)} />}
          ListFooterComponent={
            <View style={styles.actions}>
              <Pressable style={styles.primaryButton} onPress={() => void load(true)}>
                <Text style={styles.primaryButtonText}>{copy.refresh}</Text>
              </Pressable>
            </View>
          }
        />
      ) : (
        <View style={styles.noAccessCard}>
          <Text style={[styles.noAccessTitle, rtl && styles.rtl]}>{access === false ? copy.noAccess : error}</Text>
          <Pressable style={styles.primaryButton} onPress={() => void load(true)}>
            <Text style={styles.primaryButtonText}>{copy.refresh}</Text>
          </Pressable>
        </View>
      )}
    </TabShell>
  );
}

const styles = StyleSheet.create({
  header: { gap: 9, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  brandMark: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  brandMarkText: { color: '#fff', fontWeight: '900', fontSize: 19 },
  brand: { color: colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 1.2, flex: 1 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 99, backgroundColor: colors.successSoft },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  activeText: { color: colors.success, fontSize: 10, fontWeight: '800' },
  title: { color: colors.ink, fontSize: 32, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { color: colors.muted, fontSize: 15 },
  loader: { flex: 1 },
  listView: { flex: 1 },
  list: { gap: 10, paddingHorizontal: 16, paddingBottom: 28 },
  listHeading: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingTop: 4, paddingBottom: 3 },
  sectionTitle: { color: colors.ink, fontWeight: '800', fontSize: 19 },
  count: { color: colors.primary, fontWeight: '800', fontSize: 12, paddingHorizontal: 9, paddingVertical: 3, backgroundColor: colors.primarySoft, borderRadius: 99 },
  lesson: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 10, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  thumbnail: { width: 76, height: 82, borderRadius: 12, backgroundColor: colors.primarySoft },
  thumbnailFallback: { width: 76, height: 82, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  lessonBody: { flex: 1, gap: 3 },
  module: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  lessonTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  summary: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  offline: { color: colors.primary, fontWeight: '700' },
  error: { color: colors.error },
  empty: { color: colors.muted, padding: 20, textAlign: 'center' },
  rtl: { textAlign: 'right', writingDirection: 'rtl' },
  languageRow: { flexDirection: 'row', gap: 7, marginTop: 5 },
  progressCard: { gap: 8, marginTop: 5, padding: 12, borderRadius: 14, backgroundColor: colors.primarySoft },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { color: colors.primaryDeep, fontWeight: '800', fontSize: 13 },
  progressCount: { color: colors.primary, fontWeight: '900', fontSize: 13 },
  progressTrack: { height: 6, backgroundColor: colors.line, borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: colors.primary, borderRadius: 99 },
  languageButton: { paddingVertical: 8, paddingHorizontal: 11, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  languageButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  languageButtonDisabled: { opacity: 0.35 },
  languageText: { color: colors.muted, fontWeight: '700' },
  languageTextActive: { color: '#ffffff', fontWeight: '800' },
  actions: { gap: 10, marginTop: 12 },
  primaryButton: { alignItems: 'center', paddingVertical: 14, borderRadius: 14, backgroundColor: colors.primary },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  noAccessCard: { margin: 18, gap: 18, padding: 22, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  noAccessTitle: { color: colors.ink, fontSize: 18, lineHeight: 27, fontWeight: '700' }
});
