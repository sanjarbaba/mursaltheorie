import { useAuth, useClerk, useUser } from '@clerk/expo';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { createApiClient } from '@/src/api/client';
import { TabShell } from '@/src/Menu';
import { clearCachedCourse, clearLocalAccountData } from '@/src/storage';
import { colors } from '@/src/theme';
import type { Locale } from '@/src/types';

type AccessResponse = { access: { hasAccess: boolean } };
type AccountLabels = { title: string; subtitle: string; course: string; active: string; inactive: string; unavailable: string; signOut: string; privacy: string; deleteAccount: string; deleteWarning: string; deletePhrase: string; cancel: string; confirm: string; confirmTitle: string; confirmMessage: string; failed: string; deleted: string };
const DELETE_CONFIRMATION = 'VERWIJDER MIJN ACCOUNT';
const labels: Record<Locale, AccountLabels> = {
  nl: { title: 'Account', subtitle: 'Jouw gegevens en cursuslidmaatschap.', course: 'Cursus', active: 'Toegang actief', inactive: 'Nog geen actieve toegang', unavailable: 'Toegang tijdelijk niet beschikbaar', signOut: 'Uitloggen', privacy: 'Privacybeleid', deleteAccount: 'Account verwijderen', deleteWarning: 'Dit verwijdert je account, cursusvoortgang en toegang definitief. Dit kan niet ongedaan worden gemaakt.', deletePhrase: `Typ exact: ${DELETE_CONFIRMATION}`, cancel: 'Annuleren', confirm: 'Definitief verwijderen', confirmTitle: 'Account definitief verwijderen?', confirmMessage: 'Je gegevens en cursustoegang worden verwijderd.', failed: 'Verwijderen is niet gelukt. Probeer het later opnieuw.', deleted: 'Je account is verwijderd. Sluit en open de app opnieuw als je nog bent ingelogd.' },
  fa: { title: 'حساب', subtitle: 'اطلاعات حساب و دسترسی به دوره.', course: 'دوره', active: 'دسترسی فعال', inactive: 'هنوز دسترسی فعال ندارید', unavailable: 'دسترسی فعلاً در دسترس نیست', signOut: 'خروج', privacy: 'سیاست حریم خصوصی', deleteAccount: 'حذف حساب', deleteWarning: 'حساب، پیشرفت و دسترسی دورهٔ شما برای همیشه حذف می‌شود. این کار برگشت‌پذیر نیست.', deletePhrase: `دقیقاً بنویسید: ${DELETE_CONFIRMATION}`, cancel: 'انصراف', confirm: 'حذف دائمی', confirmTitle: 'حساب برای همیشه حذف شود؟', confirmMessage: 'اطلاعات و دسترسی دورهٔ شما حذف می‌شود.', failed: 'حذف حساب انجام نشد. بعداً دوباره تلاش کنید.', deleted: 'حساب شما حذف شد. اگر هنوز وارد هستید، برنامه را ببندید و دوباره باز کنید.' },
  ps: { title: 'حساب', subtitle: 'ستاسو د حساب او کورس معلومات.', course: 'کورس', active: 'لاسرسی فعال دی', inactive: 'لاسرسی لا فعاله نه ده', unavailable: 'لاسرسی اوس نه ښکاري', signOut: 'وتل', privacy: 'د محرمیت تګلاره', deleteAccount: 'حساب ړنګول', deleteWarning: 'ستاسو حساب، پرمختګ او د کورس لاسرسی د تل لپاره ړنګېږي. دا کار بېرته نه شي ګرځېدای.', deletePhrase: `همدا عبارت ولیکئ: ${DELETE_CONFIRMATION}`, cancel: 'لغوه کول', confirm: 'د تل لپاره ړنګول', confirmTitle: 'حساب د تل لپاره ړنګ کړئ؟', confirmMessage: 'ستاسو معلومات او د کورس لاسرسی ړنګېږي.', failed: 'حساب ونه ړنګول شو. وروسته بیا هڅه وکړئ.', deleted: 'ستاسو حساب ړنګ شو. که لا دننه یاست، اپ بند او بیا پرانیزئ.' }
};

export default function AccountScreen() {
  const { locale: rawLocale } = useLocalSearchParams<{ locale?: string }>();
  const locale: Locale = rawLocale === 'fa' || rawLocale === 'ps' ? rawLocale : 'nl';
  const copy = labels[locale];
  const rtl = locale !== 'nl';
  const { user } = useUser();
  const { getToken, userId } = useAuth();
  const { signOut } = useClerk();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [accountDeleted, setAccountDeleted] = useState(false);

  function confirmDeletion() {
    if (deletePhrase !== DELETE_CONFIRMATION || deleting) return;
    Alert.alert(copy.confirmTitle, copy.confirmMessage, [
      { text: copy.cancel, style: 'cancel' },
      { text: copy.confirm, style: 'destructive', onPress: () => void deleteAccount() }
    ]);
  }

  async function deleteAccount() {
    setDeleting(true);
    setDeleteError('');
    try {
      await createApiClient(() => getTokenRef.current())('/api/v1/me', {
        method: 'DELETE', body: JSON.stringify({ confirmation: DELETE_CONFIRMATION })
      });
    } catch {
      setDeleteError(copy.failed);
      setDeleting(false);
      return;
    }
    setAccountDeleted(true);
    try {
      if (userId) await clearLocalAccountData(userId);
    } catch {
      // A failed local cleanup must not make a completed server deletion look unsuccessful.
    }
    try { await signOut(); } catch { /* The server has already removed the account. */ }
    setDeleting(false);
  }

  async function leaveAccount() {
    try { if (userId) await clearCachedCourse(userId); }
    finally { await signOut(); }
  }

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

  if (accountDeleted) return <TabShell locale={locale} active="account"><View style={styles.deletedScreen}><Text style={styles.deletedText}>{copy.deleted}</Text></View></TabShell>;

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

      <Pressable onPress={() => void leaveAccount()} style={styles.signOut} accessibilityRole="button">
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={styles.signOutText}>{copy.signOut}</Text>
      </Pressable>

      <Pressable onPress={() => void Linking.openURL('https://www.mursaltheorie.nl/privacy')} style={styles.privacyLink} accessibilityRole="link"><Ionicons name="shield-checkmark-outline" size={19} color={colors.primary} /><Text style={styles.privacyText}>{copy.privacy}</Text></Pressable>
      <Pressable onPress={() => setShowDelete((value) => !value)} style={styles.deleteLink} accessibilityRole="button"><Text style={styles.deleteText}>{copy.deleteAccount}</Text></Pressable>
      {showDelete ? <View style={styles.deleteCard}>
        <Text style={[styles.deleteWarning, rtl && styles.rtl]}>{copy.deleteWarning}</Text>
        <Text style={styles.deletePhrase}>{copy.deletePhrase}</Text>
        <TextInput value={deletePhrase} onChangeText={setDeletePhrase} editable={!deleting} autoCapitalize="characters" autoCorrect={false} style={styles.deleteInput} accessibilityLabel={copy.deletePhrase} />
        {deleteError ? <Text style={styles.deleteError}>{deleteError}</Text> : null}
        <View style={styles.deleteActions}>
          <Pressable onPress={() => { setShowDelete(false); setDeletePhrase(''); setDeleteError(''); }} disabled={deleting} style={styles.cancelButton}><Text style={styles.cancelText}>{copy.cancel}</Text></Pressable>
          <Pressable onPress={confirmDeletion} disabled={deletePhrase !== DELETE_CONFIRMATION || deleting} style={[styles.deleteButton, (deletePhrase !== DELETE_CONFIRMATION || deleting) && styles.disabled]}><Text style={styles.deleteButtonText}>{deleting ? '…' : copy.confirm}</Text></Pressable>
        </View>
      </View> : null}
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
  privacyLink: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 50, paddingHorizontal: 17, borderRadius: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  privacyText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  deleteLink: { alignSelf: 'flex-start', paddingVertical: 12 }, deleteText: { color: colors.error, fontWeight: '700' },
  deleteCard: { gap: 12, padding: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.error },
  deleteWarning: { color: colors.ink, lineHeight: 22 }, deletePhrase: { color: colors.error, fontWeight: '800' },
  deleteInput: { minHeight: 48, borderRadius: 11, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, color: colors.ink },
  deleteError: { color: colors.error }, deleteActions: { flexDirection: 'row', gap: 9 },
  cancelButton: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: colors.background }, cancelText: { color: colors.ink, fontWeight: '700' },
  deleteButton: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: colors.error }, deleteButtonText: { color: '#fff', fontWeight: '800' },
  disabled: { opacity: 0.45 },
  deletedScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }, deletedText: { color: colors.ink, fontSize: 19, lineHeight: 27, textAlign: 'center' },
  rtl: { textAlign: 'right', writingDirection: 'rtl' }
});
