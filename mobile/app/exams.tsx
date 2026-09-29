import { useAuth } from '@clerk/expo';
import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { createApiClient } from '@/src/api/client';
import { Menu } from '@/src/Menu';
import type { Locale } from '@/src/types';

type Exam = { number: number; title: string; questionCount: number; passScore: number; durationSeconds: number | null };

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

  useEffect(() => {
    let active = true;
    setLoading(true);
    void createApiClient(() => getTokenRef.current())<{ exams: Exam[] }>(`/api/v1/exams?locale=${locale}`)
      .then((data) => { if (active) setExams(data.exams); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Examens konden niet worden geladen.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [locale]);

  return <ScrollView contentContainerStyle={styles.container}>
    <Menu locale={locale} active="exams" />
    <Text style={[styles.title, rtl && styles.rtl]}>{locale === 'nl' ? 'Oefenexamens' : locale === 'fa' ? 'امتحان‌های تمرینی' : 'تمریني ازموینې'}</Text>
    <Text style={[styles.intro, rtl && styles.rtl]}>{locale === 'nl' ? 'Kies een examen, beantwoord de vragen en bekijk daarna alle antwoorden met uitleg.' : locale === 'fa' ? 'یک امتحان را انتخاب کنید و پس از پایان پاسخ‌ها را ببینید.' : 'ازموینه وټاکئ او په پای کې ځوابونه وګورئ.'}</Text>
    {loading ? <ActivityIndicator /> : error ? <Text style={styles.error}>{error}</Text> : exams.length ? exams.map((exam) => <View key={exam.number} style={styles.card}>
      <Text style={[styles.examTitle, rtl && styles.rtl]}>{exam.title}</Text>
      <Text style={[styles.meta, rtl && styles.rtl]}>{exam.questionCount} {locale === 'nl' ? 'vragen' : 'سوال'} · {exam.durationSeconds ? `${Math.ceil(exam.durationSeconds / 60)} min` : (locale === 'nl' ? 'zonder tijdslimiet' : 'بدون محدودیت زمان')} · {locale === 'nl' ? 'slagen vanaf' : '✓'} {exam.passScore}%</Text>
      <Link href={{ pathname: '/exam/[number]', params: { number: String(exam.number), locale } }} asChild><Pressable style={styles.start}><Text style={styles.startText}>{locale === 'nl' ? 'Start examen' : locale === 'fa' ? 'شروع امتحان' : 'ازموینه پیل کړئ'}</Text></Pressable></Link>
    </View>) : <Text style={styles.intro}>{locale === 'nl' ? 'Er zijn nog geen gepubliceerde examens beschikbaar.' : 'Geen examens'}</Text>}
  </ScrollView>;
}

const styles = StyleSheet.create({
  container: { minHeight: '100%', padding: 18, paddingBottom: 50, gap: 14, backgroundColor: '#0b1633' },
  title: { color: '#fff', fontSize: 30, fontWeight: '800' },
  intro: { color: '#d2def3', fontSize: 16, lineHeight: 23 },
  error: { color: '#ff9c9c' },
  card: { gap: 10, padding: 18, borderRadius: 18, backgroundColor: '#142653', borderWidth: 1, borderColor: '#24437f' },
  examTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  meta: { color: '#bbcfec', fontSize: 14 },
  start: { alignItems: 'center', padding: 14, borderRadius: 12, backgroundColor: '#e84a5f' },
  startText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  rtl: { textAlign: 'right', writingDirection: 'rtl' }
});
