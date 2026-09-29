import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import type { Locale } from './types';

type Page = 'lessons' | 'practice' | 'signs' | 'exams';

const items: { page: Page; path: '/' | '/practice' | '/signs' | '/exams'; labels: Record<Locale, string> }[] = [
  { page: 'lessons', path: '/', labels: { nl: 'Lessen', fa: 'درس‌ها', ps: 'درسونه' } },
  { page: 'practice', path: '/practice', labels: { nl: 'Oefenen', fa: 'تمرین', ps: 'تمرین' } },
  { page: 'signs', path: '/signs', labels: { nl: 'Borden', fa: 'تابلوها', ps: 'نښې' } },
  { page: 'exams', path: '/exams', labels: { nl: 'Examens', fa: 'امتحان‌ها', ps: 'ازموینې' } }
];

export function Menu({ locale, active }: { locale: Locale; active: Page }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {items.map((item) => (
        <Link key={item.page} href={{ pathname: item.path, params: { locale } }} asChild>
          <Pressable style={[styles.item, active === item.page && styles.active]}>
            <Text style={[styles.text, active === item.page && styles.activeText]}>{item.labels[locale]}</Text>
          </Pressable>
        </Link>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 8 },
  item: { borderRadius: 12, borderWidth: 1, borderColor: '#355795', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#152957' },
  active: { backgroundColor: '#e84a5f', borderColor: '#ff7b8e' },
  text: { color: '#d9e7ff', fontWeight: '700' },
  activeText: { color: '#fff' }
});
