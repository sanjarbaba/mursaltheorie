import { useAuth } from '@clerk/expo';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Crypto from 'expo-crypto';
import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { createApiClient } from '@/src/api/client';
import { mediaUrl } from '@/src/content';
import { colors } from '@/src/theme';
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
  const [reviewFilter, setReviewFilter] = useState<'all' | 'wrong'>('all');
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
  const answered = attempt?.questions.filter((item) => {
    const value = answers[item.id];
    return value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0);
  }).length || 0;
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

  async function persistCurrentAnswer(): Promise<boolean> {
    if (!attempt || !question || result || saved[question.id] || selected === undefined || selected === '' || (Array.isArray(selected) && selected.length === 0)) return true;
    if (timeExpired) return false;
    try {
      await createApiClient(() => getTokenRef.current())('/api/v1/exam-attempts', {
        method: 'POST', body: JSON.stringify({ action: 'answer', attemptId: attempt.id, questionId: question.id, answer: selected, locale })
      });
      setSaved((current) => ({ ...current, [question.id]: true }));
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Antwoord kon niet worden opgeslagen.');
      return false;
    }
  }

  async function goToQuestion(nextIndex: number) {
    if (!attempt || busy || nextIndex < 0 || nextIndex >= attempt.questions.length) return;
    setBusy(true);
    setError('');
    try {
      if (await persistCurrentAnswer()) setIndex(nextIndex);
    } finally { setBusy(false); }
  }

  async function submit() {
    if (!attempt || timeExpired) return;
    setBusy(true);
    setError('');
    try {
      if (!await persistCurrentAnswer()) return;
      const response = await createApiClient(() => getTokenRef.current())<{ result: Result }>('/api/v1/exam-attempts', {
        method: 'POST', body: JSON.stringify({ action: 'submit', attemptId: attempt.id, locale })
      });
      setResult(response.result);
      setReviewFilter('all');
      setIndex(0);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Examen kon niet worden ingeleverd.');
    } finally { setBusy(false); }
  }

  function confirmSubmit() {
    const unanswered = (attempt?.questions.length || 0) - answered;
    Alert.alert(locale === 'nl' ? 'Examen inleveren?' : locale === 'fa' ? 'امتحان را ثبت می‌کنید؟' : 'ازموینه سپارئ؟', unanswered ? `${unanswered} ${locale === 'nl' ? 'vragen zijn nog niet beantwoord.' : locale === 'fa' ? 'سوال هنوز پاسخ داده نشده است.' : 'پوښتنې لا بې ځوابه دي.'}` : (locale === 'nl' ? 'Je kunt je antwoorden daarna bekijken.' : locale === 'fa' ? 'بعد از ثبت می‌توانید پاسخ‌ها را ببینید.' : 'له سپارلو وروسته ځوابونه کتلای شئ.'), [
      { text: locale === 'nl' ? 'Verder oefenen' : locale === 'fa' ? 'ادامهٔ تمرین' : 'تمرین ته دوام', style: 'cancel' },
      { text: locale === 'nl' ? 'Inleveren' : locale === 'fa' ? 'ثبت' : 'وسپارئ', onPress: () => void submit() }
    ]);
  }

  const review = result && question ? result.answers.find((item) => item.questionId === question.id) : null;
  const correctCount = result?.answers.filter((item) => item.isCorrect).length || 0;
  const wrongIndices = result && attempt ? attempt.questions.flatMap((item, questionIndex) => result.answers.find((answer) => answer.questionId === item.id)?.isCorrect ? [] : [questionIndex]) : [];

  function showWrongAnswers() {
    if (wrongIndices.length === 0) return;
    setReviewFilter('wrong');
    setIndex(wrongIndices[0]);
  }

  return <ScrollView contentContainerStyle={styles.container}>
    {loading ? <ActivityIndicator /> : error && !attempt ? <View style={styles.card}><Text style={styles.error}>{error}</Text><Pressable onPress={() => setRetry((value) => value + 1)} style={styles.primary}><Text style={styles.primaryText}>{locale === 'nl' ? 'Opnieuw proberen' : locale === 'fa' ? 'دوباره تلاش کنید' : 'بیا هڅه وکړئ'}</Text></Pressable></View> : attempt ? <>
      <Text style={[styles.title, rtl && styles.rtl]}>{attempt.exam.title}</Text>
      {result ? <>
        <View style={[styles.result, !result.passed && styles.resultFailed]} accessibilityRole="summary">
          <View style={styles.resultHeading}><Ionicons name={result.passed ? 'checkmark-circle' : 'close-circle'} size={40} color={result.passed ? colors.success : colors.error} /><Text style={[styles.resultTitle, !result.passed && styles.resultTitleFailed]}>{result.passed ? (locale === 'nl' ? 'Geslaagd' : locale === 'fa' ? 'قبول شدید' : 'بریالي شوئ') : (locale === 'nl' ? 'Niet geslaagd' : locale === 'fa' ? 'قبول نشدید' : 'بریالي نه شوئ')}</Text></View>
          <Text style={styles.resultScore}>{result.score}% · {correctCount}/{attempt.questions.length} {locale === 'nl' ? 'goed' : locale === 'fa' ? 'درست' : 'سم'}</Text>
          <Text style={styles.body}>{locale === 'nl' ? 'Bekijk hieronder al je antwoorden en de uitleg per vraag.' : locale === 'fa' ? 'همهٔ پاسخ‌ها و توضیح هر سؤال را در پایین ببینید.' : 'لاندې ټول ځوابونه او د هرې پوښتنې تشریح وګورئ.'}</Text>
        </View>
        <View style={styles.overview}>
          <Text style={[styles.overviewTitle, rtl && styles.rtl]}>{locale === 'nl' ? 'Vragenoverzicht' : locale === 'fa' ? 'نمای کلی سؤال‌ها' : 'د پوښتنو لنډیز'}</Text>
          <View style={styles.filterRow}>
            <Pressable onPress={() => setReviewFilter('all')} accessibilityRole="button" accessibilityState={{ selected: reviewFilter === 'all' }} style={[styles.filterButton, reviewFilter === 'all' && styles.filterSelected]}><Text style={[styles.filterText, reviewFilter === 'all' && styles.filterTextSelected]}>{locale === 'nl' ? 'Alle vragen' : locale === 'fa' ? 'همهٔ سؤال‌ها' : 'ټولې پوښتنې'} ({attempt.questions.length})</Text></Pressable>
            <Pressable onPress={showWrongAnswers} disabled={wrongIndices.length === 0} accessibilityRole="button" accessibilityState={{ selected: reviewFilter === 'wrong', disabled: wrongIndices.length === 0 }} style={[styles.filterButton, reviewFilter === 'wrong' && styles.filterSelected, wrongIndices.length === 0 && styles.disabled]}><Text style={[styles.filterText, reviewFilter === 'wrong' && styles.filterTextSelected]}>{locale === 'nl' ? 'Mijn fouten' : locale === 'fa' ? 'اشتباه‌های من' : 'زما تېروتنې'} ({wrongIndices.length})</Text></Pressable>
          </View>
          <View style={styles.questionGrid}>{attempt.questions.map((item, questionIndex) => {
            const correct = result.answers.find((answer) => answer.questionId === item.id)?.isCorrect === true;
            if (reviewFilter === 'wrong' && correct) return null;
            return <Pressable key={item.id} onPress={() => setIndex(questionIndex)} accessibilityRole="button" accessibilityLabel={`${locale === 'nl' ? 'Vraag' : locale === 'fa' ? 'سؤال' : 'پوښتنه'} ${questionIndex + 1}: ${correct ? (locale === 'nl' ? 'goed' : locale === 'fa' ? 'درست' : 'سم') : (locale === 'nl' ? 'fout' : locale === 'fa' ? 'نادرست' : 'ناسم')}`} style={[styles.questionChip, correct ? styles.questionChipCorrect : styles.questionChipWrong, index === questionIndex && styles.questionChipActive]}><Ionicons name={correct ? 'checkmark' : 'close'} size={17} color={correct ? colors.success : colors.error} /><Text style={styles.questionChipText}>{questionIndex + 1}</Text></Pressable>;
          })}</View>
        </View>
      </> : <Text style={styles.meta}>{answered} / {attempt.questions.length} {locale === 'nl' ? 'vragen beantwoord' : locale === 'fa' ? 'سوال پاسخ داده شد' : 'پوښتنو ته ځواب ویل شوی'}{remaining !== null ? ` · ${Math.floor(remaining / 60).toString().padStart(2, '0')}:${(remaining % 60).toString().padStart(2, '0')}` : ''}</Text>}
      {timeExpired && !result ? <View style={styles.card}><Text style={styles.error}>{locale === 'nl' ? 'De tijd is voorbij. Start een nieuw examen.' : locale === 'fa' ? 'وقت تمام شد. امتحان جدیدی شروع کنید.' : 'وخت پای ته ورسېد. نوې ازموینه پیل کړئ.'}</Text><Link href={{ pathname: '/exams', params: { locale } }} asChild><Pressable style={styles.primary}><Text style={styles.primaryText}>{locale === 'nl' ? 'Examens' : locale === 'fa' ? 'امتحان‌ها' : 'ازموینې'}</Text></Pressable></Link></View> : question ? <View style={styles.card}>
        <Text style={styles.meta}>{locale === 'nl' ? 'Vraag' : locale === 'fa' ? 'سوال' : 'پوښتنه'} {index + 1} / {attempt.questions.length} · {question.category}</Text>
        {question.media?.map((item, mediaIndex) => { const uri = mediaUrl(item.src); return uri ? <Image key={`${uri}-${mediaIndex}`} source={{ uri }} style={styles.image} resizeMode="contain" accessibilityLabel={item.alt || question.prompt} /> : null; })}
        <Text style={[styles.question, rtl && styles.rtl]}>{question.prompt}</Text>
        {result ? <View style={styles.review}>
          <Text style={[styles.reviewTitle, !review?.isCorrect && styles.reviewTitleWrong]}>{review?.isCorrect ? '✓ ' : '✕ '}{review?.isCorrect ? (locale === 'nl' ? 'Goed beantwoord' : locale === 'fa' ? 'پاسخ درست' : 'سم ځواب') : (locale === 'nl' ? 'Niet goed beantwoord' : locale === 'fa' ? 'پاسخ نادرست' : 'ناسم ځواب')}</Text>
          <Text style={styles.body}>{locale === 'nl' ? 'Jouw antwoord: ' : locale === 'fa' ? 'پاسخ شما: ' : 'ستاسو ځواب: '}{answerText(question, review?.selectedAnswer)}</Text>
          <Text style={styles.body}>{locale === 'nl' ? 'Juiste antwoord: ' : locale === 'fa' ? 'پاسخ درست: ' : 'سم ځواب: '}{answerText(question, review?.correctAnswer)}</Text>
          <Text style={styles.body}>{review?.explanation}</Text>
        </View> : <>
          {question.questionType === 'multiple_response' ? <Text style={styles.meta}>{locale === 'nl' ? 'Kies alle juiste antwoorden.' : locale === 'fa' ? 'همهٔ پاسخ‌های درست را انتخاب کنید.' : 'ټول سم ځوابونه وټاکئ.'}</Text> : null}
          {question.questionType === 'numeric' ? <TextInput value={typeof selected === 'string' ? selected : ''} onChangeText={choose} keyboardType="decimal-pad" placeholder={locale === 'nl' ? 'Vul je antwoord in' : locale === 'fa' ? 'پاسخ را وارد کنید' : 'ځواب ولیکئ'} placeholderTextColor="#a9c2ea" style={styles.input} /> : question.options.map((option, optionIndex) => {
            const isSelected = Array.isArray(selected) ? selected.includes(optionIndex) : selected === optionIndex;
            return <Pressable key={optionIndex} onPress={() => {
              if (question.questionType === 'multiple_response') {
                const values = Array.isArray(selected) ? selected : [];
                choose(isSelected ? values.filter((value) => value !== optionIndex) : [...values, optionIndex].sort((a, b) => a - b));
              } else choose(optionIndex);
            }} style={[styles.option, isSelected && styles.optionSelected]}><Text style={styles.body}>{question.questionType === 'multiple_response' ? (isSelected ? '☑ ' : '□ ') : `${String.fromCharCode(65 + optionIndex)}. `}{option}</Text></Pressable>;
          })}
        </>}
      </View> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!timeExpired || result ? <View style={styles.nav}>
        <Pressable disabled={busy || index === 0} onPress={() => void goToQuestion(index - 1)} style={[styles.navButton, (busy || index === 0) && styles.disabled]}><Text style={styles.navText}>← {locale === 'nl' ? 'Vorige' : locale === 'fa' ? 'قبلی' : 'مخکینۍ'}</Text></Pressable>
        <Pressable disabled={busy || index === attempt.questions.length - 1} onPress={() => void goToQuestion(index + 1)} style={[styles.navButton, (busy || index === attempt.questions.length - 1) && styles.disabled]}><Text style={styles.navText}>{busy ? (locale === 'nl' ? 'Opslaan…' : locale === 'fa' ? 'ذخیره…' : 'ساتل…') : locale === 'nl' ? 'Volgende' : locale === 'fa' ? 'بعدی' : 'بله'} →</Text></Pressable>
      </View> : null}
      {!result && !timeExpired ? <Pressable disabled={busy} onPress={confirmSubmit} style={[styles.submit, busy && styles.disabled]}><Text style={styles.primaryText}>{locale === 'nl' ? 'Examen inleveren' : locale === 'fa' ? 'ثبت امتحان' : 'ازموینه وسپارئ'}</Text></Pressable> : null}
      {result ? <Link href={{ pathname: '/exams', params: { locale } }} asChild><Pressable style={styles.submit}><Text style={styles.primaryText}>{locale === 'nl' ? 'Terug naar examens' : locale === 'fa' ? 'بازگشت به امتحان‌ها' : 'ازموینو ته بېرته'}</Text></Pressable></Link> : null}
    </> : null}
  </ScrollView>;
}

const styles = StyleSheet.create({
  container: { minHeight: '100%', padding: 18, paddingBottom: 55, gap: 14, backgroundColor: colors.background },
  title: { color: colors.ink, fontSize: 26, fontWeight: '900' },
  meta: { color: colors.muted, fontSize: 14 },
  card: { gap: 13, padding: 18, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  image: { width: '100%', height: 220, backgroundColor: colors.background, borderRadius: 12 },
  question: { color: colors.ink, fontSize: 21, fontWeight: '800', lineHeight: 29 },
  body: { color: colors.ink, fontSize: 16, lineHeight: 23 },
  option: { padding: 14, minHeight: 52, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  input: { color: colors.ink, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 14, fontSize: 17 },
  primary: { alignItems: 'center', padding: 14, backgroundColor: colors.primary, borderRadius: 12 },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  disabled: { opacity: 0.45 },
  error: { color: colors.error, lineHeight: 22 },
  nav: { flexDirection: 'row', gap: 12 },
  navButton: { flex: 1, alignItems: 'center', padding: 13, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.line },
  navText: { color: colors.primary, fontWeight: '800' },
  submit: { alignItems: 'center', padding: 16, borderRadius: 12, backgroundColor: colors.primary },
  result: { padding: 18, gap: 8, borderRadius: 16, backgroundColor: colors.successSoft },
  resultFailed: { backgroundColor: colors.errorSoft },
  resultHeading: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  resultTitle: { color: colors.success, fontSize: 27, fontWeight: '900', flexShrink: 1 },
  resultTitleFailed: { color: colors.error },
  resultScore: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  overview: { gap: 12, padding: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  overviewTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterButton: { paddingVertical: 9, paddingHorizontal: 12, borderRadius: 11, backgroundColor: colors.background },
  filterSelected: { backgroundColor: colors.primary },
  filterText: { color: colors.primary, fontWeight: '800' },
  filterTextSelected: { color: '#fff' },
  questionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  questionChip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, minWidth: 50, minHeight: 45, paddingHorizontal: 7, borderRadius: 10, borderWidth: 1 },
  questionChipCorrect: { backgroundColor: colors.successSoft, borderColor: colors.success },
  questionChipWrong: { backgroundColor: colors.errorSoft, borderColor: colors.error },
  questionChipActive: { borderWidth: 3 },
  questionChipText: { color: colors.ink, fontWeight: '800' },
  review: { gap: 8, padding: 13, borderRadius: 12, backgroundColor: colors.primarySoft },
  reviewTitle: { color: colors.primaryDeep, fontSize: 17, fontWeight: '800' },
  reviewTitleWrong: { color: colors.error },
  rtl: { textAlign: 'right', writingDirection: 'rtl' }
});
