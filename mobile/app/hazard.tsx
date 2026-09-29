import { useAuth } from '@clerk/expo';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { createApiClient } from '@/src/api/client';
import { CourseGate } from '@/src/CourseGate';
import { mediaUrl } from '@/src/content';
import hazards from '@/src/hazards.json';
import { readTrainingProgress, saveTrainingProgress, type TrainingProgress } from '@/src/storage';
import { colors } from '@/src/theme';
import type { Locale } from '@/src/types';

type Action = 'rem' | 'gas' | 'nothing';
type ServerProgress = { progress: { answered: number; correct: number; scenario_index: number; client_updated_at?: string } };
const emptyProgress: TrainingProgress = { answered: 0, correct: 0, scenarioIndex: 0, clientUpdatedAt: new Date(0).toISOString() };

export default function HazardScreen() {
  const { locale: rawLocale } = useLocalSearchParams<{ locale?: string }>();
  const locale: Locale = rawLocale === 'fa' || rawLocale === 'ps' ? rawLocale : 'nl';
  const { getToken, userId } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const [progress, setProgress] = useState<TrainingProgress>(emptyProgress);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<Action | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    let active = true;
    void (async () => {
      const local = await readTrainingProgress(userId);
      if (active && local) { setProgress(local); setIndex(local.scenarioIndex % hazards.length); }
      try {
        const request = createApiClient(() => getTokenRef.current());
        const data = await request<ServerProgress>('/api/v1/progress?resource=training');
        const remote: TrainingProgress = {
          answered: Number(data.progress.answered || 0), correct: Number(data.progress.correct || 0),
          scenarioIndex: Number(data.progress.scenario_index || 0),
          clientUpdatedAt: data.progress.client_updated_at || new Date(0).toISOString()
        };
        const latest = local && Date.parse(local.clientUpdatedAt) > Date.parse(remote.clientUpdatedAt) ? local : remote;
        if (latest === local) await request('/api/v1/progress?resource=training', { method: 'PUT', body: JSON.stringify(local) });
        else await saveTrainingProgress(userId, remote);
        if (active) { setProgress(latest); setIndex(latest.scenarioIndex % hazards.length); }
      } catch {
        if (active && !local) setMessage(locale === 'nl' ? 'Voortgang kon niet worden geladen. Je kunt wel oefenen.' : locale === 'fa' ? 'پیشرفت بارگذاری نشد. می‌توانید تمرین کنید.' : 'پرمختګ پورته نه شو. تمرین کولای شئ.');
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [userId]);

  async function choose(action: Action) {
    if (!userId || selected || busy) return;
    const item = hazards[index];
    setSelected(action);
    setBusy(true);
    setMessage('');
    const updated: TrainingProgress = {
      answered: progress.answered + 1,
      correct: progress.correct + Number(action === item.answer),
      scenarioIndex: (index + 1) % hazards.length,
      clientUpdatedAt: new Date().toISOString()
    };
    setProgress(updated);
    try {
      await saveTrainingProgress(userId, updated);
      await createApiClient(() => getTokenRef.current())('/api/v1/progress?resource=training', { method: 'PUT', body: JSON.stringify(updated) });
    } catch {
      setMessage(locale === 'nl' ? 'Voortgang is op dit toestel bewaard en wordt later gesynchroniseerd.' : locale === 'fa' ? 'پیشرفت در این دستگاه ذخیره شد و بعداً همگام می‌شود.' : 'پرمختګ په دې وسیله خوندي شو او وروسته به همغږی شي.');
    } finally { setBusy(false); }
  }

  function next() { setIndex(progress.scenarioIndex % hazards.length); setSelected(null); setMessage(''); }

  const item = hazards[index];
  const image = mediaUrl(item.image);
  const question = item.question[locale];
  const explanation = item.explanation[locale];
  const labels: Record<Action, string> = locale === 'fa' ? { rem: 'ترمز', gas: 'رها کردن گاز', nothing: 'هیچ‌کدام' } : locale === 'ps' ? { rem: 'بریک ووهئ', gas: 'ګاز پرېږدئ', nothing: 'هېڅ مه کوئ' } : { rem: 'Remmen', gas: 'Gas los', nothing: 'Niets doen' };
  const correct = selected === item.answer;

  return <CourseGate locale={locale}><ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.title}>{locale === 'nl' ? 'Verkeerssituaties' : locale === 'fa' ? 'موقعیت‌های ترافیکی' : 'د ترافیک حالتونه'}</Text>
    <Text style={styles.subtitle}>{locale === 'nl' ? 'Kies: remmen, gas los of niets doen.' : locale === 'fa' ? 'انتخاب کنید: ترمز، رها کردن گاز یا هیچ‌کدام.' : 'وټاکئ: بریک، ګاز پرېښودل یا هېڅ نه کول.'}</Text>
    {loading ? <ActivityIndicator color={colors.primary} /> : <>
      <View style={styles.stats}><Text style={styles.statsText}>{progress.correct} / {progress.answered} {locale === 'nl' ? 'goed' : '✓'}</Text><Text style={styles.statsText}>{index + 1} / {hazards.length}</Text></View>
      <View style={styles.card}>
        {image ? <Image source={{ uri: image }} style={styles.image} resizeMode="cover" accessibilityLabel={question} /> : null}
        <Text style={[styles.question, locale !== 'nl' && styles.rtl]}>{question}</Text>
        {(['rem', 'gas', 'nothing'] as Action[]).map((action) => <Pressable key={action} disabled={selected !== null} onPress={() => void choose(action)} style={[styles.option, selected && action === item.answer && styles.correct, selected === action && !correct && styles.incorrect]}><Text style={styles.optionText}>{labels[action]}</Text></Pressable>)}
        {selected ? <View style={styles.feedback}><Text style={styles.feedbackTitle}>{correct ? (locale === 'nl' ? 'Goed antwoord' : locale === 'fa' ? 'پاسخ درست' : 'سم ځواب') : (locale === 'nl' ? 'Niet juist' : locale === 'fa' ? 'نادرست' : 'ناسم')}</Text><Text style={[styles.explanation, locale !== 'nl' && styles.rtl]}>{explanation}</Text></View> : null}
      </View>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {selected ? <Pressable disabled={busy} onPress={next} style={[styles.next, busy && styles.disabled]}><Text style={styles.nextText}>{locale === 'nl' ? 'Volgende situatie' : locale === 'fa' ? 'موقعیت بعدی' : 'بل حالت'} →</Text></Pressable> : null}
    </>}
  </ScrollView></CourseGate>;
}

const styles = StyleSheet.create({
  container: { minHeight: '100%', gap: 14, padding: 18, paddingBottom: 42, backgroundColor: colors.background },
  title: { color: colors.ink, fontSize: 29, fontWeight: '900' }, subtitle: { color: colors.muted, fontSize: 15 },
  stats: { flexDirection: 'row', justifyContent: 'space-between', padding: 13, borderRadius: 13, backgroundColor: colors.primarySoft }, statsText: { color: colors.primaryDeep, fontWeight: '800' },
  card: { gap: 13, padding: 17, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  image: { width: '100%', height: 210, borderRadius: 13, backgroundColor: colors.background },
  question: { color: colors.ink, fontSize: 20, lineHeight: 28, fontWeight: '800' },
  option: { minHeight: 52, alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 13, borderWidth: 1, borderColor: colors.line }, optionText: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  correct: { backgroundColor: colors.successSoft, borderColor: colors.success }, incorrect: { backgroundColor: colors.errorSoft, borderColor: colors.error },
  feedback: { gap: 6, padding: 13, borderRadius: 13, backgroundColor: colors.primarySoft }, feedbackTitle: { color: colors.primaryDeep, fontSize: 17, fontWeight: '800' }, explanation: { color: colors.ink, fontSize: 16, lineHeight: 23 },
  message: { color: colors.muted, fontSize: 14 }, next: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: colors.primary }, nextText: { color: '#fff', fontSize: 16, fontWeight: '800' }, disabled: { opacity: 0.5 }, rtl: { textAlign: 'right', writingDirection: 'rtl' }
});
