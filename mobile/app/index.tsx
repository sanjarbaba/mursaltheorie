import { useAuth, useClerk } from '@clerk/expo';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Button, Platform, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { createApiClient } from '@/src/api/client';
import { getDeviceId } from '@/src/device';

type AccessResponse = { access: { hasAccess: boolean; products: string[] } };
type LessonsResponse = { lessons: unknown[] };

export default function HomeScreen() {
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState(false);
  const [lessonCount, setLessonCount] = useState(0);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const request = createApiClient(getToken);
      const deviceId = await getDeviceId();
      await request('/api/v1/devices', {
        method: 'PUT',
        body: JSON.stringify({ deviceId, platform: Platform.OS })
      });
      const [accessData, lessonsData] = await Promise.all([
        request<AccessResponse>('/api/v1/access'),
        request<LessonsResponse>('/api/v1/lessons?locale=nl')
      ]);
      setAccess(accessData.access.hasAccess);
      setLessonCount(lessonsData.lessons.length);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Laden mislukt.');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { void load(); }, [load]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Mursal Theorie</Text>
        {loading ? <ActivityIndicator /> : (
          <>
            <Text style={styles.text}>{access ? 'Je cursustoegang is actief.' : 'Je hebt nog geen actieve cursustoegang.'}</Text>
            <Text style={styles.text}>{lessonCount} lessen beschikbaar</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button title="Opnieuw laden" onPress={() => void load()} />
          </>
        )}
        <Button title="Uitloggen" onPress={() => void signOut()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f7f3ea' },
  card: { gap: 16, padding: 24, borderRadius: 18, backgroundColor: '#ffffff' },
  title: { fontSize: 28, fontWeight: '700', color: '#15392f' },
  text: { fontSize: 17, color: '#263630' },
  error: { color: '#a3261f' }
});

