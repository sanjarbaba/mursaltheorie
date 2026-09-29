import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '@/src/theme';
import type { Locale } from '@/src/types';
import { words } from '@/src/words';

export default function WordsScreen() {
  const { locale: rawLocale } = useLocalSearchParams<{ locale?: string }>();
  const locale: Locale = rawLocale === 'fa' || rawLocale === 'ps' ? rawLocale : 'nl';
  const [query, setQuery] = useState('');
  const visible = useMemo(() => words.filter((item) => `${item.nl} ${item.fa}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())), [query]);

  return <FlatList data={visible} keyExtractor={(item) => item.nl} contentContainerStyle={styles.container} ItemSeparatorComponent={() => <View style={styles.separator} />}
    ListHeaderComponent={<View style={styles.header}>
      <Text style={styles.title}>{locale === 'nl' ? 'Verkeerswoorden' : locale === 'fa' ? 'واژه‌های ترافیکی' : 'د ترافیک کلمې'}</Text>
      <Text style={styles.subtitle}>{locale === 'nl' ? 'Nederlandse woorden met vertaling in Dari/Farsi.' : 'Nederlandse woorden · دری/فارسی'}</Text>
      <TextInput value={query} onChangeText={setQuery} placeholder={locale === 'nl' ? 'Zoek een woord' : 'Zoeken'} placeholderTextColor={colors.muted} autoCapitalize="none" style={styles.search} />
      <Text style={styles.count}>{visible.length} {locale === 'nl' ? 'woorden' : ''}</Text>
    </View>}
    ListEmptyComponent={<Text style={styles.subtitle}>{locale === 'nl' ? 'Geen woorden gevonden.' : 'Geen resultaat.'}</Text>}
    renderItem={({ item }) => <View style={styles.card}><Text style={styles.dutch}>{item.nl}</Text><Text style={styles.translation}>{item.fa}</Text></View>} />;
}

const styles = StyleSheet.create({
  container: { padding: 18, paddingBottom: 40, backgroundColor: colors.background }, separator: { height: 10 }, header: { gap: 11, paddingBottom: 17 },
  title: { color: colors.ink, fontSize: 29, fontWeight: '900' }, subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  search: { minHeight: 50, paddingHorizontal: 15, borderRadius: 13, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, color: colors.ink, fontSize: 16 },
  count: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 62, padding: 16, borderRadius: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  dutch: { color: colors.ink, fontSize: 17, fontWeight: '800', flex: 1 }, translation: { color: colors.primary, fontSize: 17, fontWeight: '700', textAlign: 'right', flex: 1 }
});

