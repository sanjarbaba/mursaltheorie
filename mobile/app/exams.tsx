import { useAuth } from '@clerk/expo';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { createApiClient } from '@/src/api/client';
import { TabShell } from '@/src/Menu';
import { colors } from '@/src/theme';
import type { Locale } from '@/src/types';

type Exam = { number: number; title: string; questionCount: number; passScore: number; durationSeconds: number | null };
type ExamResult = { attemptId: number; examNumber: number; title: string; score: number; passed: boolean; submittedAt: string };
type ResultsResponse = { results: ExamResult[]; summary: { total: number; passed: number; bestScore: number | null } };

export default function ExamsScreen() {
  const { locale: rawLocale } = useLocalSearchParams<{ locale?: string }>();
  const locale: Locale = rawLocale === 'fa' || rawLocale === 'ps' ? rawLocale : 'nl';
  const rtl = locale !== 'nl';
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<ExamResult[]>([]);
  const [summary, setSummary] = useState<ResultsResponse['summary'] | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void createApiClient(() => getTokenRef.current())<{ exams: Exam[] }>(`/api/v1/exams?locale=${locale}`)
      .then((data) => { if (active) setExams(data.exams); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Examens konden niet worden geladen.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [locale]);

  useFocusEffect(useCallback(() => {
    let active = true;
    void createApiClient(() => getTokenRef.current())<ResultsResponse>(`/api/v1/access?resource=results&locale=${locale}&limit=50`)
      .then((data) => { if (active) { setHistory(data.results); setSummary(data.summary); } })
      .catch(() => { if (active) setSummary(null); });
    return () => { active = false; };
  }, [locale]));

  const header = <View style={styles.header}>
    <Text style={[styles.title, rtl && styles.rtl]}>{locale === 'nl' ? 'Oefenexamens' : locale === 'fa' ? 'امتحان‌های تمرینی' : 'تمریني ازموینې'}</Text>
    <Text style={[styles.intro, rtl && styles.rtl]}>{locale === 'nl' ? 'Kies een examen, beantwoord de vragen en bekijk daarna alle antwoorden met uitleg.' : locale === 'fa' ? 'یک امتحان را انتخاب کنید و پس از پایان پاسخ‌ها را ببینید.' : 'ازموینه وټاکئ او په پای کې ځوابونه وګورئ.'}</Text>
    {summary && summary.total > 0 ? <View style={styles.historyCard}>
      <Text style={styles.historyTitle}>{locale === 'nl' ? 'Mijn resultaten' : locale === 'fa' ? 'نتایج من' : 'زما پایلې'}</Text>
      <View style={styles.statsRow}>
        <View style={styles.stat}><Text style={styles.statValue}>{summary.total}</Text><Text style={styles.statLabel}>{locale === 'nl' ? 'pogingen' : locale === 'fa' ? 'تلاش‌ها' : 'هڅې'}</Text></View>
        <View style={styles.stat}><Text style={styles.statValue}>{summary.passed}</Text><Text style={styles.statLabel}>{locale === 'nl' ? 'behaald' : locale === 'fa' ? 'قبول‌شده' : 'بریالۍ'}</Text></View>
        <View style={styles.stat}><Text style={styles.statValue}>{summary.bestScore ?? 0}%</Text><Text style={styles.statLabel}>{locale === 'nl' ? 'beste score' : locale === 'fa' ? 'بهترین نمره' : 'غوره نمره'}</Text></View>
      </View>
      {history.slice(0, 5).map((item) => <View key={item.attemptId} style={styles.historyRow}><Ionicons name={item.passed ? 'checkmark-circle' : 'close-circle'} size={21} color={item.passed ? colors.success : colors.error} /><Text numberOfLines={1} style={styles.historyName}>{item.title}</Text><Text style={[styles.historyScore, item.passed && styles.passed]}>{item.passed ? (locale === 'nl' ? 'Geslaagd' : locale === 'fa' ? 'قبول' : 'بریالی') : (locale === 'nl' ? 'Niet geslaagd' : locale === 'fa' ? 'رد شده' : 'ناکام')} · {item.score}%</Text></View>)}
      <Link href={{ pathname: '/mistakes', params: { locale } }} asChild><Pressable style={styles.mistakesButton}><Text style={styles.mistakesText}>{locale === 'nl' ? 'Oefen mijn fouten' : locale === 'fa' ? 'تمرین اشتباه‌ها' : 'تېروتنې تمرین کړئ'}</Text></Pressable></Link>
    </View> : null}
    <Text style={styles.sectionTitle}>{locale === 'nl' ? 'Alle oefenexamens' : locale === 'fa' ? 'همه امتحان‌ها' : 'ټولې ازموینې'}</Text>
  </View>;
  return <TabShell locale={locale} active="exams"><FlatList data={loading || error ? [] : exams} keyExtractor={(exam) => String(exam.number)} ListHeaderComponent={header} contentContainerStyle={styles.container} ItemSeparatorComponent={() => <View style={{ height: 12 }} />} renderItem={({ item: exam }) => <View style={styles.card}>
      <Text style={[styles.examTitle, rtl && styles.rtl]}>{exam.title}</Text>
      {history.find((item) => item.examNumber === exam.number) ? (() => { const latest = history.find((item) => item.examNumber === exam.number)!; return <View style={[styles.lastResult, latest.passed ? styles.lastResultPassed : styles.lastResultFailed]}><Ionicons name={latest.passed ? 'checkmark-circle' : 'close-circle'} size={21} color={latest.passed ? colors.success : colors.error} /><Text style={[styles.lastResultText, { color: latest.passed ? colors.success : colors.error }]}>{locale === 'nl' ? 'Laatste poging: ' : locale === 'fa' ? 'آخرین تلاش: ' : 'وروستۍ هڅه: '}{latest.passed ? (locale === 'nl' ? 'geslaagd' : locale === 'fa' ? 'قبول' : 'بریالی') : (locale === 'nl' ? 'niet geslaagd' : locale === 'fa' ? 'رد شده' : 'ناکام')} · {latest.score}%</Text></View>; })() : null}
      <Text style={[styles.meta, rtl && styles.rtl]}>{exam.questionCount} {locale === 'nl' ? 'vragen' : locale === 'fa' ? 'سوال' : 'پوښتنې'} · {exam.durationSeconds ? `${Math.ceil(exam.durationSeconds / 60)} min` : (locale === 'nl' ? 'zonder tijdslimiet' : locale === 'fa' ? 'بدون محدودیت زمان' : 'بې له وخت محدودیت')} · {locale === 'nl' ? 'slagen vanaf' : locale === 'fa' ? 'نمرهٔ قبولی از' : 'د بریا نمره له'} {exam.passScore}%</Text>
      <Link href={{ pathname: '/exam/[number]', params: { number: String(exam.number), locale } }} asChild><Pressable style={styles.start}><Text style={styles.startText}>{locale === 'nl' ? 'Start examen' : locale === 'fa' ? 'شروع امتحان' : 'ازموینه پیل کړئ'}</Text></Pressable></Link>
    </View>} ListEmptyComponent={loading ? <ActivityIndicator color={colors.primary} /> : error ? <Text style={styles.error}>{error}</Text> : <Text style={styles.intro}>{locale === 'nl' ? 'Er zijn nog geen gepubliceerde examens beschikbaar.' : locale === 'fa' ? 'هنوز امتحانی منتشر نشده است.' : 'لا کومه ازموینه نه ده خپره شوې.'}</Text>} /></TabShell>;
}

const styles = StyleSheet.create({
  container: { padding: 18, paddingBottom: 30 }, header: { gap: 11, paddingBottom: 18 },
  title: { color: colors.ink, fontSize: 30, fontWeight: '900' },
  historyCard: { gap: 12, padding: 17, borderRadius: 18, backgroundColor: colors.primarySoft },
  historyTitle: { color: colors.primaryDeep, fontSize: 18, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: 8 }, stat: { flex: 1, alignItems: 'center', padding: 10, borderRadius: 12, backgroundColor: colors.surface },
  statValue: { color: colors.ink, fontSize: 19, fontWeight: '900' }, statLabel: { color: colors.muted, fontSize: 11 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 7 },
  historyName: { color: colors.ink, fontSize: 14, flex: 1 }, historyScore: { color: colors.error, fontWeight: '800', fontSize: 12 }, passed: { color: colors.success },
  mistakesButton: { minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.primary }, mistakesText: { color: '#fff', fontWeight: '800' },
  sectionTitle: { color: colors.ink, fontSize: 19, fontWeight: '800', marginTop: 5 },
  intro: { color: colors.muted, fontSize: 16, lineHeight: 23 },
  error: { color: colors.error },
  card: { gap: 12, padding: 18, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  examTitle: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  lastResult: { flexDirection: 'row', alignItems: 'center', gap: 7, padding: 10, borderRadius: 11 },
  lastResultPassed: { backgroundColor: colors.successSoft }, lastResultFailed: { backgroundColor: colors.errorSoft },
  lastResultText: { fontSize: 13, fontWeight: '800', flexShrink: 1 },
  meta: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  start: { alignItems: 'center', padding: 14, borderRadius: 12, backgroundColor: colors.primary },
  startText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  rtl: { textAlign: 'right', writingDirection: 'rtl' }
});
