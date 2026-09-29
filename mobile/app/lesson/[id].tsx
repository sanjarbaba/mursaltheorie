import { useAuth } from '@clerk/expo';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { createApiClient } from '@/src/api/client';
import { isQuiz, localizedText, mediaUrl } from '@/src/content';
import { getDeviceId } from '@/src/device';
import { enqueueProgress, flushProgressQueue, readCachedLesson } from '@/src/storage';
import type { Lesson, Locale } from '@/src/types';

export default function LessonScreen() {
  const params = useLocalSearchParams<{ id: string; locale?: string }>();
  const { getToken, userId } = useAuth();
  const lessonId = Number(params.id);
  const locale: Locale = params.locale === 'fa' || params.locale === 'ps' ? params.locale : 'nl';
  const rtl = locale === 'fa' || locale === 'ps';

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [answers, setAnswers] = useState<Record<number, number>>({});

  useEffect(() => {
    if (Number.isInteger(lessonId)) void readCachedLesson(lessonId, locale).then(setLesson);
  }, [lessonId, locale]);

  async function completeLesson() {
    if (!userId || !lesson) return;
    setSaving(true);
    const request = createApiClient(getToken);
    await enqueueProgress(userId, {
      lessonId: lesson.id,
      completed: true,
      progressPercent: 100,
      clientUpdatedAt: new Date().toISOString(),
      deviceId: await getDeviceId()
    });
    try {
      await flushProgressQueue(userId, request);
      setMessage(locale === 'nl' ? 'Les voltooid en gesynchroniseerd.' : locale === 'fa' ? 'درس کامل شد و همگام‌سازی شد.' : 'درس بشپړ شو او همغږی شو.');
    } catch {
      setMessage(locale === 'nl' ? 'Les voltooid. Synchronisatie volgt zodra je online bent.' : locale === 'fa' ? 'درس کامل شد. همگام‌سازی هنگام اتصال انجام می‌شود.' : 'درس بشپړ شو. کله چې آنلاین شئ همغږي به وشي.');
    } finally {
      setSaving(false);
    }
  }

  if (!lesson) return <ActivityIndicator style={styles.loader} />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={[styles.module, rtl && styles.rtl]}>{lesson.module.title}</Text>
      <Text style={[styles.title, rtl && styles.rtl]}>{lesson.title}</Text>
      <Text style={[styles.summary, rtl && styles.rtl]}>{lesson.summary}</Text>

      {lesson.media.map((item, index) => {
        const uri = mediaUrl(item.src);
        return uri ? <Image key={`${uri}-${index}`} source={{ uri }} style={styles.image} resizeMode="contain" accessibilityLabel={localizedText(item.alt, locale) || lesson.title} /> : null;
      })}

      {lesson.contentBlocks.map((block, index) => {
        const answer = answers[index];
        return <View key={`${block.type}-${index}`} style={styles.block}>
          <Text style={[styles.blockType, rtl && styles.rtl]}>{block.type === 'quiz' ? (locale === 'nl' ? 'Oefenvraag' : locale === 'fa' ? 'سؤال تمرینی' : 'تمریني پوښتنه') : block.type.replaceAll('_', ' ')}</Text>
          {isQuiz(block) ? <>
            <Text style={[styles.question, rtl && styles.rtl]}>{localizedText(block.question, locale)}</Text>
            {block.options.map((option, optionIndex) => <Pressable
              key={optionIndex}
              onPress={() => setAnswers((current) => ({ ...current, [index]: optionIndex }))}
              style={[styles.option, answer === optionIndex && (optionIndex === block.correctOption ? styles.correct : styles.incorrect)]}
            >
              <Text style={[styles.blockText, rtl && styles.rtl]}>{localizedText(option, locale)}</Text>
            </Pressable>)}
            {answer !== undefined ? <View style={styles.feedback}>
              <Text style={styles.feedbackTitle}>{answer === block.correctOption ? (locale === 'nl' ? 'Goed gedaan' : '✓') : (locale === 'nl' ? 'Niet juist' : '✕')}</Text>
              {answer !== block.correctOption ? <Text style={[styles.blockText, rtl && styles.rtl]}>{locale === 'nl' ? 'Juiste antwoord: ' : ''}{localizedText(block.options[block.correctOption], locale)}</Text> : null}
              <Text style={[styles.blockText, rtl && styles.rtl]}>{localizedText(block.explanation, locale)}</Text>
            </View> : null}
          </> : <>
            {block.title ? <Text style={[styles.question, rtl && styles.rtl]}>{localizedText(block.title, locale)}</Text> : null}
            <Text style={[styles.blockText, rtl && styles.rtl]}>{localizedText(block.text, locale)}</Text>
          </>}
        </View>;
      })}

      <Pressable disabled={saving} onPress={() => void completeLesson()} style={[styles.completeButton, saving && styles.disabled]}>
        <Text style={styles.completeButtonText}>
          {saving
            ? (locale === 'nl' ? 'Opslaan…' : locale === 'fa' ? 'ذخیره…' : 'خوندي کول…')
            : (locale === 'nl' ? 'Markeer als voltooid' : locale === 'fa' ? 'علامت‌گذاری به‌عنوان تکمیل‌شده' : 'د بشپړ شوي په توګه نښه کول')}
        </Text>
      </Pressable>

      {message ? <Text style={[styles.message, rtl && styles.rtl]}>{message}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1 },
  container: { gap: 16, padding: 20, paddingBottom: 48, backgroundColor: '#0b1633' },
  module: { color: '#9cc9ff', fontWeight: '700' },
  title: { color: '#ffffff', fontSize: 30, fontWeight: '800' },
  summary: { color: '#d8e4f7', fontSize: 18, lineHeight: 28 },
  image: { width: '100%', height: 220, borderRadius: 16, backgroundColor: '#fff' },
  block: { gap: 8, padding: 18, borderRadius: 18, backgroundColor: '#142653', borderWidth: 1, borderColor: '#24437f' },
  blockType: { color: '#ffd66b', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  question: { color: '#fff', fontSize: 19, fontWeight: '800', lineHeight: 27 },
  blockText: { color: '#eef5ff', fontSize: 17, lineHeight: 27 },
  option: { padding: 13, borderRadius: 12, borderWidth: 1, borderColor: '#44639b', backgroundColor: '#1b315e' },
  correct: { borderColor: '#55c795', backgroundColor: '#174b43' },
  incorrect: { borderColor: '#e9717a', backgroundColor: '#5b293c' },
  feedback: { gap: 6, paddingTop: 8 },
  feedbackTitle: { color: '#ffd66b', fontWeight: '800', fontSize: 16 },
  completeButton: { alignItems: 'center', paddingVertical: 15, borderRadius: 14, backgroundColor: '#e84a5f' },
  completeButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  disabled: { opacity: 0.55 },
  message: { color: '#8ff3c3', textAlign: 'center', fontWeight: '700', lineHeight: 22 },
  rtl: { textAlign: 'right', writingDirection: 'rtl' }
});
