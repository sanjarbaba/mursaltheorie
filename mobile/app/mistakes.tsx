import { useAuth } from '@clerk/expo';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { createApiClient } from '@/src/api/client';
import { mediaUrl } from '@/src/content';
import { colors } from '@/src/theme';
import type { Locale } from '@/src/types';

type Question = { id: number; prompt: string; options: string[]; media: Array<{ src?: string; alt?: string }>; category: string };
type CheckResult = { isCorrect: boolean; correctOption: number; explanation: string };

export default function MistakesScreen() {
  const { locale: rawLocale } = useLocalSearchParams<{ locale?: string }>();
  const locale: Locale = rawLocale === 'fa' || rawLocale === 'ps' ? rawLocale : 'nl';
  const rtl = locale !== 'nl';
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void createApiClient(() => getTokenRef.current())<{ questions: Question[] }>(`/api/v1/access?resource=errors&locale=${locale}`)
      .then((data) => { if (active) setQuestions(data.questions); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Foutentraining kon niet worden geladen.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [locale]);

  async function choose(answer: number) {
    const question = questions[index];
    if (!question || busy || result) return;
    setSelected(answer);
    setBusy(true);
    setError('');
    try {
      const data = await createApiClient(() => getTokenRef.current())<{ result: CheckResult }>(`/api/v1/access?resource=error-answer&locale=${locale}`, {
        method: 'POST', body: JSON.stringify({ questionId: question.id, answer })
      });
      setResult(data.result);
    } catch (cause) {
      setSelected(null);
      setError(cause instanceof Error ? cause.message : 'Antwoord kon niet worden gecontroleerd.');
    } finally { setBusy(false); }
  }

  function next() { setIndex((current) => current + 1); setSelected(null); setResult(null); setError(''); }

  const question = questions[index];
  return <ScrollView contentContainerStyle={styles.container}>
    <Text style={[styles.title, rtl && styles.rtl]}>{locale === 'nl' ? 'Oefen mijn fouten' : locale === 'fa' ? 'تمرین اشتباه‌ها' : 'تېروتنې تمرین کړئ'}</Text>
    {loading ? <ActivityIndicator color={colors.primary} /> : error && !question ? <Text style={styles.error}>{error}</Text> : !question ? <Text style={styles.muted}>{locale === 'nl' ? 'Je hebt nog geen fout beantwoorde examenvragen om te oefenen.' : 'Geen vragen beschikbaar.'}</Text> : <>
      <View style={styles.progressRow}><Text style={styles.muted}>{index + 1} / {questions.length}</Text><Text style={styles.muted}>{question.category}</Text></View>
      <View style={styles.card}>
        {question.media?.map((item, imageIndex) => { const uri = mediaUrl(item.src); return uri ? <Image key={`${uri}-${imageIndex}`} source={{ uri }} style={styles.image} resizeMode="contain" accessibilityLabel={item.alt || question.prompt} /> : null; })}
        <Text style={[styles.question, rtl && styles.rtl]}>{question.prompt}</Text>
        {question.options.map((option, optionIndex) => <Pressable key={optionIndex} disabled={busy || result !== null} onPress={() => void choose(optionIndex)} style={[styles.option, result && optionIndex === result.correctOption && styles.correct, result && selected === optionIndex && !result.isCorrect && styles.incorrect]}>
          <Text style={styles.optionLetter}>{String.fromCharCode(65 + optionIndex)}</Text><Text style={[styles.optionText, rtl && styles.rtl]}>{option}</Text>
        </Pressable>)}
        {busy ? <ActivityIndicator color={colors.primary} /> : null}
        {result ? <View style={styles.feedback}><Text style={styles.feedbackTitle}>{result.isCorrect ? (locale === 'nl' ? 'Goed antwoord' : '✓') : (locale === 'nl' ? 'Niet juist' : '✕')}</Text><Text style={styles.optionText}>{result.explanation}</Text></View> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {result && index + 1 < questions.length ? <Pressable onPress={next} style={styles.next}><Text style={styles.nextText}>{locale === 'nl' ? 'Volgende vraag' : 'Volgende'} →</Text></Pressable> : result ? <Text style={styles.done}>{locale === 'nl' ? 'Klaar! Je hebt al je fouten opnieuw geoefend.' : 'Klaar!'}</Text> : null}
    </>}
  </ScrollView>;
}

const styles = StyleSheet.create({
  container: { minHeight: '100%', gap: 15, padding: 18, paddingBottom: 42, backgroundColor: colors.background },
  title: { color: colors.ink, fontSize: 29, fontWeight: '900' },
  muted: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  card: { gap: 13, padding: 18, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  image: { width: '100%', height: 205, borderRadius: 13, backgroundColor: colors.background },
  question: { color: colors.ink, fontSize: 21, lineHeight: 29, fontWeight: '800' },
  option: { flexDirection: 'row', gap: 11, alignItems: 'center', minHeight: 54, padding: 13, borderRadius: 13, borderWidth: 1, borderColor: colors.line },
  optionLetter: { color: colors.primary, fontWeight: '900' }, optionText: { color: colors.ink, fontSize: 16, lineHeight: 23, flex: 1 },
  correct: { backgroundColor: colors.successSoft, borderColor: colors.success }, incorrect: { backgroundColor: colors.errorSoft, borderColor: colors.error },
  feedback: { gap: 6, padding: 13, borderRadius: 13, backgroundColor: colors.primarySoft }, feedbackTitle: { color: colors.primaryDeep, fontSize: 17, fontWeight: '800' },
  error: { color: colors.error, lineHeight: 22 }, next: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: colors.primary }, nextText: { color: '#fff', fontSize: 16, fontWeight: '800' }, done: { color: colors.success, fontWeight: '800' },
  rtl: { textAlign: 'right', writingDirection: 'rtl' }
});

