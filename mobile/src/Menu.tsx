import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from './theme';
import type { Locale } from './types';

type Page = 'lessons' | 'practice' | 'signs' | 'exams';
type IconName = React.ComponentProps<typeof Ionicons>['name'];

const items: { page: Page; path: '/' | '/practice' | '/signs' | '/exams'; icon: IconName; activeIcon: IconName; labels: Record<Locale, string> }[] = [
  { page: 'lessons', path: '/', icon: 'book-outline', activeIcon: 'book', labels: { nl: 'Lessen', fa: '??????', ps: '??????' } },
  { page: 'practice', path: '/practice', icon: 'flash-outline', activeIcon: 'flash', labels: { nl: 'Oefenen', fa: '?????', ps: '?????' } },
  { page: 'signs', path: '/signs', icon: 'shapes-outline', activeIcon: 'shapes', labels: { nl: 'Borden', fa: '???????', ps: '???' } },
  { page: 'exams', path: '/exams', icon: 'document-text-outline', activeIcon: 'document-text', labels: { nl: 'Examens', fa: '?????????', ps: '???????' } }
];

export function TabShell({ locale, active, children }: { locale: Locale; active: Page; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.shell, { paddingTop: insets.top }]}>
    <StatusBar style="dark" />
    <View style={styles.content}>{children}</View>
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 9) }]} accessibilityRole="tablist">
      {items.map((item) => {
        const selected = active === item.page;
        return <Link key={item.page} href={{ pathname: item.path, params: { locale } }} asChild>
          <Pressable accessibilityRole="tab" accessibilityLabel={item.labels[locale]} accessibilityState={{ selected }} style={styles.tab}>
            <View style={[styles.iconWrap, selected && styles.iconWrapActive]}>
              <Ionicons name={selected ? item.activeIcon : item.icon} size={22} color={selected ? colors.primary : colors.muted} />
            </View>
            <Text numberOfLines={1} style={[styles.label, selected && styles.labelActive]}>{item.labels[locale]}</Text>
          </Pressable>
        </Link>;
      })}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  bar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.surface, paddingTop: 6, paddingHorizontal: 7 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 52, gap: 2 },
  iconWrap: { alignItems: 'center', justifyContent: 'center', width: 44, height: 32, borderRadius: 15 },
  iconWrapActive: { backgroundColor: colors.primarySoft },
  label: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  labelActive: { color: colors.primary, fontWeight: '800' }
});

