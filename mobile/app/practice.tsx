import { useAuth } from '@clerk/expo';
import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { createApiClient } from '@/src/api/client';
import { isQuiz, localizedText } from '@/src/content';
import { Menu } from '@/src/Menu';
import { cacheLessons, readCachedLessons } from '@/src/storage';
import type { ContentBlock, Lesson, LessonsResponse, Locale } from '@/src/types';

type Question = { lesson: Lesson; block: ContentBlock & { question: NonNullable<ContentBlock['question']>; options: NonNullable<ContentBlock['options']>; correctOption: number } };

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
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    void (async () => {
      try {
        const cached = await readCachedLessons(locale);
        const response = cached?.lessons.length
          ? cached
          : await createApiClient(() => getTokenRef.current())<LessonsResponse>(`/api/v1/lessons?locale=${locale}`);
        if (!cached) await cacheLessons(response);
        if (active) setQuestions(response.lessons.flatMap((lesson) => lesson.contentBlocks.filter(isQuiz).map((block) => ({ lesson, block }))));
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Oefeningen konden niet worden geladen.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [locale]);

  const modules = [...new Map(questions.map((question) => [question.lesson.module.number, question.lesson.module.title])).entries()];
  const visible = module ? questions.filter((question) => question.lesson.module.number === module) : questions;
  const current = visible[index];
  const answer = current ? answers[current.lesson.id] : undefined;
  const answered = visible.filter(({ lesson }) => answers[lesson.id] !== undefined).length;
  const correct = visible.filter(({ lesson, block }) => answers[lesson.id] === block.correctOption).length;

  function chooseModule(next: number) { setModule(next); setIndex(0); }

  return <ScrollView contentContainerStyle={styles.container}>
    <Menu locale={locale} active="practice" />
    <Text style={[styles.title, rtl && styles.rtl]}>{locale === 'nl' ? 'Oefenen' : locale === 'fa' ? 'تمرین' : 'تمرین'}</Text>
    <Text style={[styles.muted, rtl && styles.rtl]}>{locale === 'nl' ? `${answered} van ${visible.length} vragen beantwoord · ${correct} goed` : `${answered} / ${visible.length} · ✓ ${correct}`}</Text>
    {loading ? <ActivityIndicator /> : error ? <Text style={styles.error}>{error}</Text> : <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        <Pressable onPress={() => chooseModule(0)} style={[styles.chip, module === 0 && styles.chipActive]}><Text style={styles.chipText}>{locale === 'nl' ? 'Alles' : 'همه'}</Text></Pressable>
        {modules.map(([number, title]) => <Pressable key={number} onPress={() => chooseModule(number)} style={[styles.chip, module === number && styles.chipActive]}><Text style={styles.chipText}>{title}</Text></Pressable>)}
      </ScrollView>
      {current ? <View style={styles.card}>
        <Text style={styles.muted}>{index + 1} / {visible.length} · {current.lesson.module.title}</Text>
        <Text style={[styles.question, rtl && styles.rtl]}>{localizedText(current.block.question, locale)}</Text>
        {current.block.options.map((option, optionIndex) => <Pressable key={optionIndex} onPress={() => setAnswers((value) => ({ ...value, [current.lesson.id]: optionIndex }))} style={[styles.option, answer === optionIndex && (answer === current.block.correctOption ? styles.correct : styles.incorrect)]}>
          <Text style={[styles.optionText, rtl && styles.rtl]}>{localizedText(option, locale)}</Text>
        </Pressable>)}
        {answer !== undefined ? <View style={styles.feedback}>
          <Text style={styles.feedbackTitle}>{answer === current.block.correctOption ? '✓' : '✕'} {answer === current.block.correctOption ? (locale === 'nl' ? 'Goed' : '') : (locale === 'nl' ? 'Juiste antwoord:' : '')}</Text>
          {answer !== current.block.correctOption ? <Text style={[styles.optionText, rtl && styles.rtl]}>{localizedText(current.block.options[current.block.correctOption], locale)}</Text> : null}
          <Text style={[styles.optionText, rtl && styles.rtl]}>{localizedText(current.block.explanation, locale)}</Text>
        </View> : null}
        <Link href={{ pathname: '/lesson/[id]', params: { id: String(current.lesson.id), locale } }} asChild><Pressable style={styles.lessonLink}><Text style={styles.linkText}>{locale === 'nl' ? 'Bekijk de bijbehorende les' : 'درس'}</Text></Pressable></Link>
      </View> : <Text style={styles.muted}>{locale === 'nl' ? 'Geen oefenvragen beschikbaar.' : 'Geen vragen'}</Text>}
      {current ? <View style={styles.nav}>
        <Pressable disabled={index === 0} onPress={() => setIndex(index - 1)} style={[styles.navButton, index === 0 && styles.disabled]}><Text style={styles.navText}>← {locale === 'nl' ? 'Vorige' : ''}</Text></Pressable>
        <Pressable disabled={index === visible.length - 1} onPress={() => setIndex(index + 1)} style={[styles.navButton, index === visible.length - 1 && styles.disabled]}><Text style={styles.navText}>{locale === 'nl' ? 'Volgende' : ''} →</Text></Pressable>
      </View> : null}
    </>}
  </ScrollView>;
}

const styles = StyleSheet.create({
  container: { minHeight: '100%', padding: 18, paddingBottom: 50, gap: 14, backgroundColor: '#0b1633' },
  title: { fontSize: 30, fontWeight: '800', color: '#fff' },
  muted: { color: '#a9c2ea', fontSize: 15 },
  filters: { gap: 8 },
  chip: { padding: 10, borderRadius: 999, backgroundColor: '#152957', borderWidth: 1, borderColor: '#355795' },
  chipActive: { backgroundColor: '#e84a5f' },
  chipText: { color: '#fff', fontWeight: '700' },
  card: { gap: 12, padding: 18, borderRadius: 18, backgroundColor: '#142653', borderWidth: 1, borderColor: '#24437f' },
  question: { color: '#fff', fontSize: 21, fontWeight: '800', lineHeight: 29 },
  option: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#44639b', backgroundColor: '#1b315e' },
  optionText: { color: '#eef5ff', fontSize: 16, lineHeight: 23 },
  correct: { borderColor: '#55c795', backgroundColor: '#174b43' },
  incorrect: { borderColor: '#e9717a', backgroundColor: '#5b293c' },
  feedback: { gap: 6, padding: 12, backgroundColor: '#20345c', borderRadius: 12 },
  feedbackTitle: { color: '#ffd66b', fontWeight: '800', fontSize: 16 },
  lessonLink: { paddingVertical: 10 },
  linkText: { color: '#9cc9ff', fontWeight: '700' },
  nav: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  navButton: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 12, backgroundColor: '#e84a5f' },
  navText: { color: '#fff', fontWeight: '800' },
  disabled: { opacity: 0.4 },
  error: { color: '#ff9c9c' },
  rtl: { textAlign: 'right', writingDirection: 'rtl' }
});
