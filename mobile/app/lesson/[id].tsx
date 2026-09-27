import { useAuth } from '@clerk/expo';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { createApiClient } from '@/src/api/client';
import { getDeviceId } from '@/src/device';
import { enqueueProgress, flushProgressQueue, readCachedLesson } from '@/src/storage';
import type { ContentBlock, Lesson, Locale } from '@/src/types';

function textValue(value: ContentBlock['text'], locale: Locale) {
  if (typeof value === 'string') return value;
  return value?.[locale] || value?.nl || value?.fa || value?.ps || '';
}

export default function LessonScreen() {
  const params = useLocalSearchParams<{ id: string; locale?: string }>();
  const { getToken, userId } = useAuth();
  const lessonId = Number(params.id);
  const locale: Locale = params.locale === 'fa' || params.locale === 'ps' ? params.locale : 'nl';
  const rtl = locale === 'fa' || locale === 'ps';

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

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

      {lesson.contentBlocks.map((block, index) => (
        <View key={`${block.type}-${index}`} style={styles.block}>
          <Text style={[styles.blockType, rtl && styles.rtl]}>{block.type.replaceAll('_', ' ')}</Text>
          <Text style={[styles.blockText, rtl && styles.rtl]}>{textValue(block.text, locale)}</Text>
        </View>
      ))}

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
  block: { gap: 8, padding: 18, borderRadius: 18, backgroundColor: '#142653', borderWidth: 1, borderColor: '#24437f' },
  blockType: { color: '#ffd66b', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  blockText: { color: '#eef5ff', fontSize: 17, lineHeight: 27 },
  completeButton: { alignItems: 'center', paddingVertical: 15, borderRadius: 14, backgroundColor: '#e84a5f' },
  completeButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  disabled: { opacity: 0.55 },
  message: { color: '#8ff3c3', textAlign: 'center', fontWeight: '700', lineHeight: 22 },
  rtl: { textAlign: 'right', writingDirection: 'rtl' }
});
