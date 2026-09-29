import { useAuth } from '@clerk/expo';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { createApiClient } from '@/src/api/client';
import { CourseGate } from '@/src/CourseGate';
import { isQuiz, localizedText, mediaUrl } from '@/src/content';
import { TabShell } from '@/src/Menu';
import { cacheLessons, isLessonsCacheFresh, readCachedLessons } from '@/src/storage';
import { colors } from '@/src/theme';
import type { ContentBlock, Lesson, LessonsResponse, Locale } from '@/src/types';

type Question = { key: string; lesson: Lesson; block: ContentBlock & { question: NonNullable<ContentBlock['question']>; options: NonNullable<ContentBlock['options']>; correctOption: number } };

export default function PracticeScreen() {
  const { locale: rawLocale } = useLocalSearchParams<{ locale?: string }>();
  const locale: Locale = rawLocale === 'fa' || rawLocale === 'ps' ? rawLocale : 'nl';
  const rtl = locale !== 'nl';
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [module, setModule] = useState(0);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    void (async () => {
      try {
        const cached = await readCachedLessons(locale);
        const fresh = await isLessonsCacheFresh(locale);
        let response: LessonsResponse;
        if (cached?.lessons.length && fresh) response = cached;
        else {
          try {
            response = await createApiClient(() => getTokenRef.current())<LessonsResponse>(`/api/v1/lessons?locale=${locale}`);
            await cacheLessons(response);
          } catch (cause) {
            if (!cached?.lessons.length) throw cause;
            response = cached;
          }
        }
        if (active) setQuestions(response.lessons.flatMap((lesson) => lesson.contentBlocks.flatMap((block, blockIndex) => isQuiz(block) ? [{ key: `${lesson.id}:${blockIndex}`, lesson, block }] : [])));
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Oefeningen konden niet worden geladen.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [locale]);

  const modules = useMemo(() => [...new Map(questions.map((question) => [question.lesson.module.number, question.lesson.module.title])).entries()], [questions]);
  const visible = useMemo(() => module ? questions.filter((question) => question.lesson.module.number === module) : questions, [module, questions]);
  const current = visible[index];
  const answer = current ? answers[current.key] : undefined;
  const answered = visible.filter(({ key }) => answers[key] !== undefined).length;
  const correct = visible.filter(({ key, block }) => answers[key] === block.correctOption).length;

  function chooseModule(next: number) { setModule(next); setIndex(0); }

  const imageUri = mediaUrl(current?.lesson.media[0]?.src);

  return <TabShell locale={locale} active="practice"><CourseGate locale={locale}><ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
    <Text style={[styles.title, rtl && styles.rtl]}>{locale === 'nl' ? 'Oefenen' : locale === 'fa' ? 'تمرین' : 'تمرین'}</Text>
    <Text style={[styles.subtitle, rtl && styles.rtl]}>{locale === 'nl' ? 'Een vraag tegelijk. Leer meteen van de uitleg.' : ''}</Text>
    <Link href={{ pathname: '/hazard', params: { locale } }} asChild><Pressable style={styles.wordsLink}><Ionicons name="car-sport-outline" size={19} color={colors.primary} /><Text style={styles.wordsText}>{locale === 'nl' ? 'Verkeerssituaties oefenen' : locale === 'fa' ? 'تمرین موقعیت‌های ترافیکی' : 'د ترافیک حالتونه'}</Text><Ionicons name="chevron-forward" size={17} color={colors.primary} /></Pressable></Link>
    <Link href={{ pathname: '/words', params: { locale } }} asChild><Pressable style={styles.wordsLink}><Ionicons name="book-outline" size={19} color={colors.primary} /><Text style={styles.wordsText}>{locale === 'nl' ? 'Verkeerswoorden bekijken' : locale === 'fa' ? 'واژه‌های ترافیکی' : 'د ترافیک کلمې'}</Text><Ionicons name="chevron-forward" size={17} color={colors.primary} /></Pressable></Link>
    <View style={styles.progressCard}>
      <View style={styles.progressRow}><Text style={styles.progressLabel}>{locale === 'nl' ? 'Jouw oefenronde' : 'تمرین'}</Text><Text style={styles.progressCount}>{answered} / {visible.length}</Text></View>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${visible.length ? answered / visible.length * 100 : 0}%` }]} /></View>
      <Text style={styles.muted}>{correct} {locale === 'nl' ? 'goed beantwoord' : '✓'}</Text>
    </View>
    {loading ? <ActivityIndicator color={colors.primary} /> : error ? <Text style={styles.error}>{error}</Text> : <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        <Pressable onPress={() => chooseModule(0)} style={[styles.chip, module === 0 && styles.chipActive]}><Text style={[styles.chipText, module === 0 && styles.chipTextActive]}>{locale === 'nl' ? 'Alles' : 'همه'}</Text></Pressable>
        {modules.map(([number, title]) => <Pressable key={number} onPress={() => chooseModule(number)} style={[styles.chip, module === number && styles.chipActive]}><Text style={[styles.chipText, module === number && styles.chipTextActive]}>{title}</Text></Pressable>)}
      </ScrollView>
      {current ? <View style={styles.card}>
        <View style={styles.questionMeta}><Text style={styles.questionNumber}>{locale === 'nl' ? 'VRAAG' : 'سوال'} {index + 1} / {visible.length}</Text><Text numberOfLines={1} style={styles.module}>{current.lesson.module.title}</Text></View>
        {imageUri ? <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" accessibilityLabel={current.lesson.title} /> : null}
        <Text style={[styles.question, rtl && styles.rtl]}>{localizedText(current.block.question, locale)}</Text>
        {current.block.options.map((option, optionIndex) => <Pressable key={optionIndex} onPress={() => setAnswers((value) => ({ ...value, [current.key]: optionIndex }))} style={[styles.option, answer === optionIndex && (answer === current.block.correctOption ? styles.correct : styles.incorrect)]}>
          <View style={[styles.optionLetter, answer === optionIndex && styles.optionLetterSelected]}><Text style={[styles.optionLetterText, answer === optionIndex && styles.optionLetterTextSelected]}>{String.fromCharCode(65 + optionIndex)}</Text></View>
          <Text style={[styles.optionText, rtl && styles.rtl]}>{localizedText(option, locale)}</Text>
        </Pressable>)}
        {answer !== undefined ? <View style={styles.feedback}>
          <Text style={styles.feedbackTitle}>{answer === current.block.correctOption ? '✓' : '✕'} {answer === current.block.correctOption ? (locale === 'nl' ? 'Goed gedaan' : '') : (locale === 'nl' ? 'Bekijk het juiste antwoord' : '')}</Text>
          {answer !== current.block.correctOption ? <Text style={[styles.optionText, rtl && styles.rtl]}>{localizedText(current.block.options[current.block.correctOption], locale)}</Text> : null}
          <Text style={[styles.optionText, rtl && styles.rtl]}>{localizedText(current.block.explanation, locale)}</Text>
        </View> : null}
        <Link href={{ pathname: '/lesson/[id]', params: { id: String(current.lesson.id), locale } }} asChild><Pressable style={styles.lessonLink}><Text style={styles.linkText}>{locale === 'nl' ? 'Bekijk de bijbehorende les' : 'درس'}</Text><Ionicons name="arrow-forward" size={16} color={colors.primary} /></Pressable></Link>
      </View> : <Text style={styles.muted}>{locale === 'nl' ? 'Geen oefenvragen beschikbaar.' : 'Geen vragen'}</Text>}
      {current ? <View style={styles.nav}>
        <Pressable disabled={index === 0} onPress={() => setIndex(index - 1)} style={[styles.navButton, index === 0 && styles.disabled]}><Text style={styles.navText}>← {locale === 'nl' ? 'Vorige' : ''}</Text></Pressable>
        <Pressable disabled={index === visible.length - 1} onPress={() => setIndex(index + 1)} style={[styles.navButton, index === visible.length - 1 && styles.disabled]}><Text style={styles.navText}>{locale === 'nl' ? 'Volgende' : ''} →</Text></Pressable>
      </View> : null}
    </>}
  </ScrollView></CourseGate></TabShell>;
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: 18, paddingBottom: 28, gap: 14 },
  title: { fontSize: 31, fontWeight: '900', color: colors.ink, letterSpacing: -0.7 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 21 },
  wordsLink: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 50, paddingHorizontal: 14, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  wordsText: { flex: 1, color: colors.primary, fontSize: 15, fontWeight: '800' },
  muted: { color: colors.muted, fontSize: 14 },
  progressCard: { gap: 9, padding: 16, borderRadius: 18, backgroundColor: colors.primarySoft },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { color: colors.primaryDeep, fontWeight: '800', fontSize: 14 },
  progressCount: { color: colors.primary, fontWeight: '900' },
  progressTrack: { height: 7, borderRadius: 99, overflow: 'hidden', backgroundColor: '#DCD1EF' },
  progressFill: { height: 7, borderRadius: 99, backgroundColor: colors.primary },
  filters: { gap: 8, paddingVertical: 2 },
  chip: { paddingVertical: 10, paddingHorizontal: 13, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.ink, fontWeight: '700' }, chipTextActive: { color: '#fff' },
  card: { gap: 13, padding: 18, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  questionMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  questionNumber: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  module: { color: colors.muted, fontSize: 12, flex: 1, textAlign: 'right' },
  image: { width: '100%', height: 190, borderRadius: 14, backgroundColor: colors.primarySoft },
  question: { color: colors.ink, fontSize: 21, fontWeight: '800', lineHeight: 29 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 54, padding: 12, borderRadius: 13, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  optionLetter: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  optionLetterSelected: { backgroundColor: colors.primary },
  optionLetterText: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  optionLetterTextSelected: { color: '#fff' },
  optionText: { color: colors.ink, fontSize: 16, lineHeight: 23, flex: 1 },
  correct: { borderColor: colors.success, backgroundColor: colors.successSoft },
  incorrect: { borderColor: colors.error, backgroundColor: colors.errorSoft },
  feedback: { gap: 6, padding: 12, backgroundColor: colors.primarySoft, borderRadius: 12 },
  feedbackTitle: { color: colors.primaryDeep, fontWeight: '800', fontSize: 16 },
  lessonLink: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 10 },
  linkText: { color: colors.primary, fontWeight: '700' },
  nav: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  navButton: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 12, backgroundColor: colors.primary },
  navText: { color: '#fff', fontWeight: '800' },
  disabled: { opacity: 0.4 },
  error: { color: colors.error },
  rtl: { textAlign: 'right', writingDirection: 'rtl' }
});

