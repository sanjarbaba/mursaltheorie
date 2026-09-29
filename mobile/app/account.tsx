import { useAuth, useClerk, useUser } from '@clerk/expo';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { createApiClient } from '@/src/api/client';
import { TabShell } from '@/src/Menu';
import { colors } from '@/src/theme';
import type { Locale } from '@/src/types';

type AccessResponse = { access: { hasAccess: boolean } };
const labels: Record<Locale, { title: string; subtitle: string; course: string; active: string; inactive: string; unavailable: string; signOut: string }> = {
  nl: { title: 'Account', subtitle: 'Jouw gegevens en cursuslidmaatschap.', course: 'Cursus', active: 'Toegang actief', inactive: 'Nog geen actieve toegang', unavailable: 'Toegang tijdelijk niet beschikbaar', signOut: 'Uitloggen' },
  fa: { title: '????', subtitle: '??????? ???? ? ?????? ?? ????.', course: '????', active: '?????? ????', inactive: '???? ?????? ???? ??????', unavailable: '?????? ????? ?? ????? ????', signOut: '????' },
  ps: { title: '????', subtitle: '????? ? ???? ?? ???? ???????.', course: '????', active: '?????? ???? ??', inactive: '?????? ?? ????? ?? ??', unavailable: '?????? ??? ?? ?????', signOut: '???' }
};

export default function AccountScreen() {
  const { locale: rawLocale } = useLocalSearchParams<{ locale?: string }>();
  const locale: Locale = rawLocale === 'fa' || rawLocale === 'ps' ? rawLocale : 'nl';
  const copy = labels[locale];
  const rtl = locale !== 'nl';
  const { user } = useUser();
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void createApiClient(() => getTokenRef.current())<AccessResponse>('/api/v1/access')
      .then((data) => { if (active) setHasAccess(data.access.hasAccess); })
      .catch(() => { if (active) setHasAccess(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const email = user?.primaryEmailAddress?.emailAddress || '';
  const name = user?.fullName || user?.firstName || email || 'Mursal Theorie';

  return <TabShell locale={locale} active="account">
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={[styles.title, rtl && styles.rtl]}>{copy.title}</Text>
      <Text style={[styles.subtitle, rtl && styles.rtl]}>{copy.subtitle}</Text>

      <View style={styles.profileCard}>
        <View style={styles.avatar}><Ionicons name="person" size={27} color={colors.primary} /></View>
        <View style={styles.profileDetails}>
          <Text style={[styles.name, rtl && styles.rtl]}>{name}</Text>
          {email ? <Text style={styles.email}>{email}</Text> : null}
        </View>
      </View>

      <Text style={[styles.sectionTitle, rtl && styles.rtl]}>{copy.course}</Text>
      <View style={styles.statusCard}>
        <View style={[styles.statusIcon, hasAccess ? styles.statusIconActive : null]}><Ionicons name={hasAccess ? 'checkmark-circle' : 'book-outline'} size={24} color={hasAccess ? colors.success : colors.primary} /></View>
        <View style={styles.profileDetails}>
          <Text style={styles.statusTitle}>Mursal Theorie</Text>
          {loading ? <ActivityIndicator style={styles.spinner} color={colors.primary} /> : <Text style={[styles.statusText, rtl && styles.rtl]}>{hasAccess === true ? copy.active : hasAccess === false ? copy.inactive : copy.unavailable}</Text>}
        </View>
      </View>

      <Pressable onPress={() => void signOut()} style={styles.signOut} accessibilityRole="button">
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={styles.signOutText}>{copy.signOut}</Text>
      </Pressable>
    </ScrollView>
  </TabShell>;
}

const styles = StyleSheet.create({
  container: { gap: 15, padding: 18, paddingBottom: 32 },
  title: { color: colors.ink, fontSize: 31, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 15, marginTop: -7, marginBottom: 5 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  avatar: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: colors.primarySoft },
  profileDetails: { flex: 1, gap: 4 },
  name: { color: colors.ink, fontSize: 19, fontWeight: '800' },
  email: { color: colors.muted, fontSize: 14 },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', marginTop: 8 },
  statusCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 17, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  statusIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.primarySoft },
  statusIconActive: { backgroundColor: colors.successSoft },
  statusTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  statusText: { color: colors.muted, fontSize: 14 },
  spinner: { alignSelf: 'flex-start' },
  signOut: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 54, paddingHorizontal: 17, borderRadius: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, marginTop: 8 },
  signOutText: { color: colors.error, fontSize: 16, fontWeight: '800' },
  rtl: { textAlign: 'right', writingDirection: 'rtl' }
});

