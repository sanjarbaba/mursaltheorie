import { useAuth } from '@clerk/expo';
import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { createApiClient } from '@/src/api/client';
import { TabShell } from '@/src/Menu';
import { colors } from '@/src/theme';
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

  const header = <View style={styles.header}>
    <Text style={[styles.title, rtl && styles.rtl]}>{locale === 'nl' ? 'Oefenexamens' : locale === 'fa' ? '?????????? ??????' : '?????? ???????'}</Text>
    <Text style={[styles.intro, rtl && styles.rtl]}>{locale === 'nl' ? 'Kies een examen, beantwoord de vragen en bekijk daarna alle antwoorden met uitleg.' : locale === 'fa' ? '?? ?????? ?? ?????? ???? ? ?? ?? ????? ??????? ?? ??????.' : '??????? ????? ?? ?? ??? ?? ??????? ?????.'}</Text>
  </View>;
  return <TabShell locale={locale} active="exams"><FlatList data={loading || error ? [] : exams} keyExtractor={(exam) => String(exam.number)} ListHeaderComponent={header} contentContainerStyle={styles.container} ItemSeparatorComponent={() => <View style={{ height: 12 }} />} renderItem={({ item: exam }) => <View style={styles.card}>
      <Text style={[styles.examTitle, rtl && styles.rtl]}>{exam.title}</Text>
      <Text style={[styles.meta, rtl && styles.rtl]}>{exam.questionCount} {locale === 'nl' ? 'vragen' : '????'} � {exam.durationSeconds ? `${Math.ceil(exam.durationSeconds / 60)} min` : (locale === 'nl' ? 'zonder tijdslimiet' : '???? ??????? ????')} � {locale === 'nl' ? 'slagen vanaf' : 'V'} {exam.passScore}%</Text>
      <Link href={{ pathname: '/exam/[number]', params: { number: String(exam.number), locale } }} asChild><Pressable style={styles.start}><Text style={styles.startText}>{locale === 'nl' ? 'Start examen' : locale === 'fa' ? '???? ??????' : '??????? ??? ???'}</Text></Pressable></Link>
    </View>} ListEmptyComponent={loading ? <ActivityIndicator color={colors.primary} /> : error ? <Text style={styles.error}>{error}</Text> : <Text style={styles.intro}>{locale === 'nl' ? 'Er zijn nog geen gepubliceerde examens beschikbaar.' : 'Geen examens'}</Text>} /></TabShell>;
}

const styles = StyleSheet.create({
  container: { padding: 18, paddingBottom: 30 }, header: { gap: 11, paddingBottom: 18 },
  title: { color: colors.ink, fontSize: 30, fontWeight: '900' },
  intro: { color: colors.muted, fontSize: 16, lineHeight: 23 },
  error: { color: colors.error },
  card: { gap: 12, padding: 18, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  examTitle: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  meta: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  start: { alignItems: 'center', padding: 14, borderRadius: 12, backgroundColor: colors.primary },
  startText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  rtl: { textAlign: 'right', writingDirection: 'rtl' }
});

