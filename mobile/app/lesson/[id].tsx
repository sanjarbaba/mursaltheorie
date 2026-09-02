import { useAuth } from '@clerk/expo';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { createApiClient } from '@/src/api/client';
import { getDeviceId } from '@/src/device';
import { enqueueProgress, flushProgressQueue, readCachedLesson } from '@/src/storage';
import type { ContentBlock, Lesson } from '@/src/types';

function textValue(value: ContentBlock['text']) {
  if (typeof value === 'string') return value;
  return value?.nl || value?.fa || '';
}

export default function LessonScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { getToken, userId } = useAuth();
  const lessonId = Number(params.id);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (Number.isInteger(lessonId)) void readCachedLesson(lessonId).then(setLesson);
  }, [lessonId]);

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
      setMessage('Les voltooid en gesynchroniseerd.');
    } catch {
      setMessage('Les voltooid. Synchronisatie volgt zodra je online bent.');
    } finally {
      setSaving(false);
    }
  }

  if (!lesson) return <ActivityIndicator style={styles.loader} />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.module}>{lesson.module.title}</Text>
      <Text style={styles.title}>{lesson.title}</Text>
      <Text style={styles.summary}>{lesson.summary}</Text>
      {lesson.contentBlocks.map((block, index) => (
        <View key={`${block.type}-${index}`} style={styles.block}>
          <Text style={styles.blockType}>{block.type.replaceAll('_', ' ')}</Text>
          <Text style={styles.blockText}>{textValue(block.text)}</Text>
        </View>
      ))}
      <Button title={saving ? 'Opslaan…' : 'Markeer als voltooid'} disabled={saving} onPress={() => void completeLesson()} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1 },
  container: { gap: 16, padding: 20, paddingBottom: 48, backgroundColor: '#f7f3ea' },
  module: { color: '#66776f', fontWeight: '600' },
  title: { color: '#15392f', fontSize: 30, fontWeight: '700' },
  summary: { color: '#263630', fontSize: 18, lineHeight: 27 },
  block: { gap: 8, padding: 18, borderRadius: 16, backgroundColor: '#ffffff' },
  blockType: { color: '#976b19', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  blockText: { color: '#263630', fontSize: 17, lineHeight: 26 },
  message: { color: '#245c49', textAlign: 'center', fontWeight: '600' }
});

