import { useAuth } from '@clerk/expo';
import * as Crypto from 'expo-crypto';
import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { createApiClient } from '@/src/api/client';
import { mediaUrl } from '@/src/content';
import type { Locale } from '@/src/types';

type Answer = number | number[] | string;
type Question = { id: number; prompt: string; options: string[]; questionType: 'single_choice' | 'multiple_response' | 'yes_no' | 'numeric' | 'hotspot'; media: Array<{ src?: string; alt?: string }>; category: string };
type Attempt = { id: number; status: string; startedAt: string; exam: { title: string; number: number; questionCount: number; durationSeconds: number | null; passScore: number }; questions: Question[] };
type Result = { score: number; passed: boolean; answers: Array<{ questionId: number; selectedAnswer: Answer | null; correctAnswer: Answer; isCorrect: boolean; explanation: string }> };

function answerText(question: Question, answer: Answer | null | undefined): string {
  if (answer === null || answer === undefined) return '—';
  if (Array.isArray(answer)) return answer.map((value) => question.options[value] || String(value)).join(', ');
  if (typeof answer === 'number' && question.questionType !== 'numeric') return question.options[answer] || String(answer);
  return String(answer);
}

export default function ExamScreen() {
  const { number, locale: rawLocale } = useLocalSearchParams<{ number: string; locale?: string }>();
  const locale: Locale = rawLocale === 'fa' || rawLocale === 'ps' ? rawLocale : 'nl';
  const rtl = locale !== 'nl';
  const examNumber = Number(number);
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const mutationId = useRef(Crypto.randomUUID());
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [saved, setSaved] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    if (!Number.isInteger(examNumber) || examNumber < 1) { setError('Ongeldig examen.'); setLoading(false); return; }
    setLoading(true);
    void createApiClient(() => getTokenRef.current())<{ attempt: Attempt }>('/api/v1/exam-attempts', {
      method: 'POST', body: JSON.stringify({ action: 'start', examNumber, mutationId: mutationId.current, locale })
    }).then((data) => { if (active) { setAttempt(data.attempt); setError(''); } })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Examen kon niet worden gestart.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [examNumber, locale, retry]);

  useEffect(() => {
    if (!attempt || result) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [attempt, result]);

  const question = attempt?.questions[index];
  const selected = question ? answers[question.id] : undefined;
  const answered = attempt?.questions.filter((item) => saved[item.id]).length || 0;
  const remaining = attempt?.exam.durationSeconds
    ? Math.max(0, Math.ceil((new Date(attempt.startedAt).getTime() + attempt.exam.durationSeconds * 1000 - now) / 1000))
    : null;
  const timeExpired = remaining === 0;

  function choose(value: Answer) {
    if (!question) return;
    setAnswers((current) => ({ ...current, [question.id]: value }));
    setSaved((current) => ({ ...current, [question.id]: false }));
    setError('');
  }

  async function saveAnswer() {
    if (!attempt || !question || selected === undefined || selected === '' || timeExpired) return;
    setBusy(true);
    setError('');
    try {
      await createApiClient(() => getTokenRef.current())('/api/v1/exam-attempts', {
        method: 'POST', body: JSON.stringify({ action: 'answer', attemptId: attempt.id, questionId: question.id, answer: selected, locale })
      });
      setSaved((current) => ({ ...current, [question.id]: true }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Antwoord kon niet worden opgeslagen.');
    } finally { setBusy(false); }
  }

  async function submit() {
    if (!attempt || timeExpired) return;
    setBusy(true);
    setError('');
    try {
      const response = await createApiClient(() => getTokenRef.current())<{ result: Result }>('/api/v1/exam-attempts', {
        method: 'POST', body: JSON.stringify({ action: 'submit', attemptId: attempt.id, locale })
      });
      setResult(response.result);
      setIndex(0);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Examen kon niet worden ingeleverd.');
    } finally { setBusy(false); }
  }

  function confirmSubmit() {
    const unanswered = (attempt?.questions.length || 0) - answered;
    Alert.alert(locale === 'nl' ? 'Examen inleveren?' : 'Exam', unanswered ? `${unanswered} ${locale === 'nl' ? 'vragen zijn nog niet beantwoord.' : 'vragen'}` : (locale === 'nl' ? 'Je kunt je antwoorden daarna bekijken.' : ''), [
      { text: locale === 'nl' ? 'Verder oefenen' : 'Terug', style: 'cancel' },
      { text: locale === 'nl' ? 'Inleveren' : '✓', onPress: () => void submit() }
    ]);
  }

  const review = result && question ? result.answers.find((item) => item.questionId === question.id) : null;

  return <ScrollView contentContainerStyle={styles.container}>
    {loading ? <ActivityIndicator /> : error && !attempt ? <View style={styles.card}><Text style={styles.error}>{error}</Text><Pressable onPress={() => setRetry((value) => value + 1)} style={styles.primary}><Text style={styles.primaryText}>Opnieuw proberen</Text></Pressable></View> : attempt ? <>
      <Text style={[styles.title, rtl && styles.rtl]}>{attempt.exam.title}</Text>
      {result ? <View style={styles.result}><Text style={styles.resultTitle}>{result.passed ? '✓' : '✕'} {result.score}%</Text><Text style={styles.body}>{locale === 'nl' ? (result.passed ? 'Geslaagd voor dit oefenexamen.' : 'Nog niet geslaagd. Bekijk hieronder je antwoorden.') : result.passed ? '✓' : '✕'}</Text></View> : <Text style={styles.meta}>{answered} / {attempt.questions.length} {locale === 'nl' ? 'antwoorden opgeslagen' : '✓'}{remaining !== null ? ` · ${Math.floor(remaining / 60).toString().padStart(2, '0')}:${(remaining % 60).toString().padStart(2, '0')}` : ''}</Text>}
      {timeExpired && !result ? <View style={styles.card}><Text style={styles.error}>{locale === 'nl' ? 'De tijd is voorbij. Start een nieuw examen.' : 'Tijd voorbij'}</Text><Link href={{ pathname: '/exams', params: { locale } }} asChild><Pressable style={styles.primary}><Text style={styles.primaryText}>Examens</Text></Pressable></Link></View> : question ? <View style={styles.card}>
        <Text style={styles.meta}>{locale === 'nl' ? 'Vraag' : 'سوال'} {index + 1} / {attempt.questions.length} · {question.category}</Text>
        {question.media?.map((item, mediaIndex) => { const uri = mediaUrl(item.src); return uri ? <Image key={`${uri}-${mediaIndex}`} source={{ uri }} style={styles.image} resizeMode="contain" accessibilityLabel={item.alt || question.prompt} /> : null; })}
        <Text style={[styles.question, rtl && styles.rtl]}>{question.prompt}</Text>
        {result ? <View style={styles.review}>
          <Text style={styles.reviewTitle}>{review?.isCorrect ? (locale === 'nl' ? 'Goed beantwoord' : '✓') : (locale === 'nl' ? 'Niet goed beantwoord' : '✕')}</Text>
          <Text style={styles.body}>{locale === 'nl' ? 'Jouw antwoord: ' : ''}{answerText(question, review?.selectedAnswer)}</Text>
          <Text style={styles.body}>{locale === 'nl' ? 'Juiste antwoord: ' : ''}{answerText(question, review?.correctAnswer)}</Text>
          <Text style={styles.body}>{review?.explanation}</Text>
        </View> : <>
          {question.questionType === 'multiple_response' ? <Text style={styles.meta}>{locale === 'nl' ? 'Kies alle juiste antwoorden.' : 'چند پاسخ'}</Text> : null}
          {question.questionType === 'numeric' ? <TextInput value={typeof selected === 'string' ? selected : ''} onChangeText={choose} keyboardType="decimal-pad" placeholder={locale === 'nl' ? 'Vul je antwoord in' : 'Antwoord'} placeholderTextColor="#a9c2ea" style={styles.input} /> : question.options.map((option, optionIndex) => {
            const isSelected = Array.isArray(selected) ? selected.includes(optionIndex) : selected === optionIndex;
            return <Pressable key={optionIndex} onPress={() => {
              if (question.questionType === 'multiple_response') {
                const values = Array.isArray(selected) ? selected : [];
                choose(isSelected ? values.filter((value) => value !== optionIndex) : [...values, optionIndex].sort((a, b) => a - b));
              } else choose(optionIndex);
            }} style={[styles.option, isSelected && styles.optionSelected]}><Text style={styles.body}>{question.questionType === 'multiple_response' ? (isSelected ? '☑ ' : '□ ') : `${String.fromCharCode(65 + optionIndex)}. `}{option}</Text></Pressable>;
          })}
          {selected !== undefined && selected !== '' ? <Pressable disabled={busy || saved[question.id]} onPress={() => void saveAnswer()} style={[styles.primary, (busy || saved[question.id]) && styles.disabled]}><Text style={styles.primaryText}>{saved[question.id] ? (locale === 'nl' ? 'Antwoord opgeslagen ✓' : '✓') : (locale === 'nl' ? 'Antwoord opslaan' : 'ذخیره')}</Text></Pressable> : null}
        </>}
      </View> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!timeExpired || result ? <View style={styles.nav}>
        <Pressable disabled={index === 0} onPress={() => setIndex(index - 1)} style={[styles.navButton, index === 0 && styles.disabled]}><Text style={styles.navText}>← {locale === 'nl' ? 'Vorige' : ''}</Text></Pressable>
        <Pressable disabled={index === attempt.questions.length - 1 || (!result && selected !== undefined && !saved[question?.id || 0])} onPress={() => setIndex(index + 1)} style={[styles.navButton, (index === attempt.questions.length - 1 || (!result && selected !== undefined && !saved[question?.id || 0])) && styles.disabled]}><Text style={styles.navText}>{locale === 'nl' ? 'Volgende' : ''} →</Text></Pressable>
      </View> : null}
      {!result && !timeExpired ? <Pressable disabled={busy || (selected !== undefined && !saved[question?.id || 0])} onPress={confirmSubmit} style={[styles.submit, (busy || (selected !== undefined && !saved[question?.id || 0])) && styles.disabled]}><Text style={styles.primaryText}>{locale === 'nl' ? 'Examen inleveren' : locale === 'fa' ? 'ثبت امتحان' : 'ازموینه وسپارئ'}</Text></Pressable> : null}
      {result ? <Link href={{ pathname: '/exams', params: { locale } }} asChild><Pressable style={styles.submit}><Text style={styles.primaryText}>{locale === 'nl' ? 'Terug naar examens' : 'Examens'}</Text></Pressable></Link> : null}
    </> : null}
  </ScrollView>;
}

const styles = StyleSheet.create({
  container: { minHeight: '100%', padding: 18, paddingBottom: 55, gap: 14, backgroundColor: '#0b1633' },
  title: { color: '#fff', fontSize: 26, fontWeight: '800' },
  meta: { color: '#a9c2ea', fontSize: 14 },
  card: { gap: 13, padding: 18, borderRadius: 18, backgroundColor: '#142653', borderWidth: 1, borderColor: '#24437f' },
  image: { width: '100%', height: 220, backgroundColor: '#fff', borderRadius: 12 },
  question: { color: '#fff', fontSize: 21, fontWeight: '800', lineHeight: 29 },
  body: { color: '#edf5ff', fontSize: 16, lineHeight: 23 },
  option: { padding: 14, borderRadius: 12, backgroundColor: '#1b315e', borderWidth: 1, borderColor: '#44639b' },
  optionSelected: { borderColor: '#e84a5f', backgroundColor: '#503151' },
  input: { color: '#fff', backgroundColor: '#1b315e', borderWidth: 1, borderColor: '#44639b', borderRadius: 12, padding: 14, fontSize: 17 },
  primary: { alignItems: 'center', padding: 14, backgroundColor: '#e84a5f', borderRadius: 12 },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  disabled: { opacity: 0.45 },
  error: { color: '#ff9c9c', lineHeight: 22 },
  nav: { flexDirection: 'row', gap: 12 },
  navButton: { flex: 1, alignItems: 'center', padding: 13, backgroundColor: '#172b59', borderRadius: 12, borderWidth: 1, borderColor: '#365487' },
  navText: { color: '#fff', fontWeight: '800' },
  submit: { alignItems: 'center', padding: 16, borderRadius: 12, backgroundColor: '#e84a5f' },
  result: { padding: 18, gap: 6, borderRadius: 16, backgroundColor: '#174b43' },
  resultTitle: { color: '#fff', fontSize: 32, fontWeight: '900' },
  review: { gap: 8, padding: 13, borderRadius: 12, backgroundColor: '#20345c' },
  reviewTitle: { color: '#ffd66b', fontSize: 17, fontWeight: '800' },
  rtl: { textAlign: 'right', writingDirection: 'rtl' }
});
