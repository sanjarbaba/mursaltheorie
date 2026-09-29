import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { CourseGate } from '@/src/CourseGate';
import { colors } from '@/src/theme';
import type { Locale } from '@/src/types';
import { words } from '@/src/words';

export default function WordsScreen() {
  const { locale: rawLocale } = useLocalSearchParams<{ locale?: string }>();
  const locale: Locale = rawLocale === 'fa' || rawLocale === 'ps' ? rawLocale : 'nl';
  const [query, setQuery] = useState('');
  const visible = useMemo(() => words.filter((item) => `${item.nl} ${item.fa} ${item.ps}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())), [query]);

  return <CourseGate locale={locale}><FlatList data={visible} keyExtractor={(item) => item.nl} contentContainerStyle={styles.container} ItemSeparatorComponent={() => <View style={styles.separator} />}
    ListHeaderComponent={<View style={styles.header}>
      <Text style={styles.title}>{locale === 'nl' ? 'Verkeerswoorden' : locale === 'fa' ? 'واژه‌های ترافیکی' : 'د ترافیک کلمې'}</Text>
      <Text style={styles.subtitle}>{locale === 'nl' ? 'Nederlandse woorden met vertaling in Dari/Farsi en Pashto.' : locale === 'fa' ? 'واژه‌های هلندی با ترجمهٔ دری/فارسی.' : 'هالنډي ټکي له پښتو ژباړې سره.'}</Text>
      <TextInput value={query} onChangeText={setQuery} placeholder={locale === 'nl' ? 'Zoek een woord' : locale === 'fa' ? 'جست‌وجوی واژه' : 'کلمه ولټوئ'} placeholderTextColor={colors.muted} autoCapitalize="none" style={styles.search} />
      <Text style={styles.count}>{visible.length} {locale === 'nl' ? 'woorden' : locale === 'fa' ? 'واژه' : 'کلمې'}</Text>
    </View>}
    ListEmptyComponent={<Text style={styles.subtitle}>{locale === 'nl' ? 'Geen woorden gevonden.' : locale === 'fa' ? 'واژه‌ای پیدا نشد.' : 'کلمه ونه موندل شوه.'}</Text>}
    renderItem={({ item }) => <View style={styles.card}><Text style={styles.dutch}>{item.nl}</Text><Text style={styles.translation}>{locale === 'ps' ? item.ps : item.fa}</Text></View>} /></CourseGate>;
}

const styles = StyleSheet.create({
  container: { padding: 18, paddingBottom: 40, backgroundColor: colors.background }, separator: { height: 10 }, header: { gap: 11, paddingBottom: 17 },
  title: { color: colors.ink, fontSize: 29, fontWeight: '900' }, subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  search: { minHeight: 50, paddingHorizontal: 15, borderRadius: 13, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, color: colors.ink, fontSize: 16 },
  count: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 62, padding: 16, borderRadius: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  dutch: { color: colors.ink, fontSize: 17, fontWeight: '800', flex: 1 }, translation: { color: colors.primary, fontSize: 17, fontWeight: '700', textAlign: 'right', flex: 1 }
});
