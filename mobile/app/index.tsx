import { useAuth, useClerk } from '@clerk/expo';
import { Link } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Button, FlatList, Platform, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { createApiClient } from '@/src/api/client';
import { getDeviceId } from '@/src/device';
import { cacheLessons, flushProgressQueue, readCachedLessons } from '@/src/storage';
import type { Lesson, LessonsResponse } from '@/src/types';

type AccessResponse = { access: { hasAccess: boolean; products: string[] } };

export default function HomeScreen() {
  const { getToken, userId } = useAuth();
  const { signOut } = useClerk();
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const request = createApiClient(getToken);
      const deviceId = await getDeviceId();
      await request('/api/v1/devices', {
        method: 'PUT',
        body: JSON.stringify({ deviceId, platform: Platform.OS === 'ios' ? 'ios' : 'android' })
      });
      if (userId) await flushProgressQueue(userId, request);
      const [accessData, lessonsData] = await Promise.all([
        request<AccessResponse>('/api/v1/access'),
        request<LessonsResponse>('/api/v1/lessons?locale=nl')
      ]);
      await cacheLessons(lessonsData);
      setAccess(accessData.access.hasAccess);
      setLessons(lessonsData.lessons);
      setOffline(false);
    } catch (cause) {
      const cached = await readCachedLessons('nl');
      if (cached?.lessons.length) {
        setLessons(cached.lessons);
        setOffline(true);
      } else {
        setError(cause instanceof Error ? cause.message : 'Laden mislukt.');
      }
    } finally {
      setLoading(false);
    }
  }, [getToken, userId]);

  useEffect(() => { void load(); }, [load]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mursal Theorie</Text>
        <Text>{access ? 'Toegang actief' : 'Cursusoverzicht'}</Text>
        {offline ? <Text style={styles.offline}>Offline — opgeslagen lessen</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
      {loading ? <ActivityIndicator style={styles.loader} /> : (
        <FlatList
          data={lessons}
          keyExtractor={(lesson) => String(lesson.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Link href={{ pathname: '/lesson/[id]', params: { id: String(item.id) } }} style={styles.lesson}>
              <Text style={styles.module}>Module {item.module.number} · {item.module.title}</Text>
              <Text style={styles.lessonTitle}>{item.id}. {item.title}</Text>
              <Text numberOfLines={2}>{item.summary}</Text>
            </Link>
          )}
          ListFooterComponent={<View style={styles.actions}><Button title="Vernieuwen" onPress={() => void load()} /><Button title="Uitloggen" onPress={() => void signOut()} /></View>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f3ea' },
  header: { gap: 6, padding: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#15392f' },
  loader: { flex: 1 },
  list: { gap: 12, padding: 16, paddingBottom: 40 },
  lesson: { padding: 18, borderRadius: 16, overflow: 'hidden', backgroundColor: '#ffffff', color: '#263630' },
  module: { marginBottom: 5, color: '#66776f', fontSize: 13 },
  lessonTitle: { marginBottom: 7, color: '#15392f', fontSize: 18, fontWeight: '700' },
  offline: { color: '#8a5a00', fontWeight: '600' },
  error: { color: '#a3261f' },
  actions: { gap: 10, marginTop: 12 }
});

