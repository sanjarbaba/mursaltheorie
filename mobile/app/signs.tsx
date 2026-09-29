import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TabShell } from '@/src/Menu';
import { CourseGate } from '@/src/CourseGate';
import { colors } from '@/src/theme';
import signs from '@/src/signs.json';
import type { Locale } from '@/src/types';

type Sign = (typeof signs)[number];
const categoryLabels: Record<string, Record<Locale, string>> = {
  priority: { nl: 'Voorrang', fa: 'حق تقدم', ps: 'لومړیتوب' },
  prohibition: { nl: 'Verbod', fa: 'ممنوعیت', ps: 'منع' },
  mandatory: { nl: 'Gebod', fa: 'دستور', ps: 'اجباري' },
  warning: { nl: 'Waarschuwing', fa: 'هشدار', ps: 'خبرداری' },
  information: { nl: 'Informatie', fa: 'اطلاعات', ps: 'معلومات' }
};

function localizedName(sign: Sign, locale: Locale): string {
  return locale === 'ps' ? sign.namePs : locale === 'fa' ? sign.nameFa || sign.name : sign.name;
}

function localizedExplanation(sign: Sign, locale: Locale): string {
  return locale === 'ps' ? sign.explanationPs : locale === 'fa' ? sign.explanationFa || sign.explanation : sign.explanation;
}

function choicesFor(sign: Sign): Sign[] {
  const position = signs.findIndex((item) => item.code === sign.code);
  const others = signs.filter((item) => item.code !== sign.code);
  const distractors = [0, 7, 15].map((offset) => others[(position * 5 + offset) % others.length]);
  return [sign, ...distractors].sort((a, b) => a.code.localeCompare(b.code));
}

export default function SignsScreen() {
  const { locale: rawLocale } = useLocalSearchParams<{ locale?: string }>();
  const locale: Locale = rawLocale === 'fa' || rawLocale === 'ps' ? rawLocale : 'nl';
  const rtl = locale !== 'nl';
  const [category, setCategory] = useState('');
  const [mode, setMode] = useState<'catalog' | 'quiz'>('catalog');
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const categories = useMemo(() => [...new Set(signs.map((sign) => sign.category))], []);
  const visible = useMemo(() => category ? signs.filter((sign) => sign.category === category) : signs, [category]);
  const sign = visible[index];

  function selectCategory(next: string) { setCategory(next); setIndex(0); setAnswer(null); setScore(0); }
  function next() { setIndex((current) => current + 1); setAnswer(null); }
  function restart() { setIndex(0); setAnswer(null); setScore(0); }

  const header = <>
    <Text style={[styles.title, rtl && styles.rtl]}>{locale === 'nl' ? 'Verkeersborden' : locale === 'fa' ? 'تابلوهای راهنمایی' : 'ترافیکي نښې'}</Text>
    {locale === 'fa' ? <Text style={[styles.muted, styles.rtl]}>نام هلندی تابلو همیشه نمایش داده می‌شود. ترجمه‌های دری که هنوز بررسی نشده‌اند، فعلاً نمایش داده نمی‌شوند.</Text> : null}
    <View style={styles.modeRow}>
      <Pressable onPress={() => setMode('catalog')} style={[styles.modeButton, mode === 'catalog' && styles.selected]}><Text style={[styles.buttonText, mode === 'catalog' && styles.selectedText]}>{locale === 'nl' ? 'Bekijken' : locale === 'fa' ? 'دیدن' : 'کتل'}</Text></Pressable>
      <Pressable onPress={() => { setMode('quiz'); restart(); }} style={[styles.modeButton, mode === 'quiz' && styles.selected]}><Text style={[styles.buttonText, mode === 'quiz' && styles.selectedText]}>{locale === 'nl' ? 'Borden oefenen' : locale === 'fa' ? 'تمرین تابلوها' : 'د نښو تمرین'}</Text></Pressable>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
      <Pressable onPress={() => selectCategory('')} style={[styles.chip, !category && styles.selected]}><Text style={[styles.buttonText, !category && styles.selectedText]}>{locale === 'nl' ? 'Alle borden' : locale === 'fa' ? 'همه تابلوها' : 'ټولې نښې'}</Text></Pressable>
      {categories.map((item) => <Pressable key={item} onPress={() => selectCategory(item)} style={[styles.chip, category === item && styles.selected]}><Text style={[styles.buttonText, category === item && styles.selectedText]}>{categoryLabels[item]?.[locale] || item}</Text></Pressable>)}
    </ScrollView>
  </>;
  return <TabShell locale={locale} active="signs"><CourseGate locale={locale}>{mode === 'catalog' ? <FlatList data={visible} keyExtractor={(item) => item.code} ListHeaderComponent={header} contentContainerStyle={styles.container} ItemSeparatorComponent={() => <View style={{ height: 12 }} />} initialNumToRender={6} maxToRenderPerBatch={6} windowSize={5} renderItem={({ item }) => <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.image} resizeMode="contain" accessibilityLabel={item.name} />
      <View style={styles.details}><Text style={styles.code}>{item.code} · {categoryLabels[item.category]?.[locale] || item.category}</Text><Text style={styles.name}>{item.name}</Text>{locale !== 'nl' && localizedName(item, locale) !== item.name ? <Text style={[styles.localized, rtl && styles.rtl]}>{localizedName(item, locale)}</Text> : null}<Text style={styles.explanation}>{item.explanation}</Text>{locale !== 'nl' && localizedExplanation(item, locale) !== item.explanation ? <Text style={[styles.explanation, rtl && styles.rtl]}>{localizedExplanation(item, locale)}</Text> : null}</View>
    </View>} /> : <ScrollView contentContainerStyle={styles.container}>{header}{sign ? <>
      <Text style={styles.muted}>{Math.min(index + 1, visible.length)} / {visible.length} · {locale === 'nl' ? 'Goed' : '✓'}: {score}</Text>
      <View style={styles.quizCard}>
        <Image source={{ uri: sign.image }} style={styles.quizImage} resizeMode="contain" accessibilityLabel={`Verkeersbord ${sign.code}`} />
        <Text style={[styles.question, rtl && styles.rtl]}>{locale === 'nl' ? 'Wat betekent dit bord?' : locale === 'fa' ? 'این تابلو چه معنایی دارد؟' : 'دا نښه څه معنا لري؟'}</Text>
        {choicesFor(sign).map((choice) => <Pressable key={choice.code} disabled={answer !== null} onPress={() => { setAnswer(choice.code); if (choice.code === sign.code) setScore((value) => value + 1); }} style={[styles.option, answer === choice.code && (answer === sign.code ? styles.correct : styles.incorrect), answer !== null && choice.code === sign.code && styles.correct]}><Text style={styles.optionText}>{choice.name}{locale !== 'nl' && localizedName(choice, locale) !== choice.name ? `\n${localizedName(choice, locale)}` : ''}</Text></Pressable>)}
        {answer !== null ? <View style={styles.feedback}><Text style={styles.feedbackTitle}>{answer === sign.code ? (locale === 'nl' ? 'Goed!' : '✓') : (locale === 'nl' ? `Juiste antwoord: ${sign.name}` : `${sign.name} · ${localizedName(sign, locale)}`)}</Text><Text style={styles.explanation}>{sign.explanation}</Text>{locale !== 'nl' && localizedExplanation(sign, locale) !== sign.explanation ? <Text style={[styles.explanation, rtl && styles.rtl]}>{localizedExplanation(sign, locale)}</Text> : null}</View> : null}
      </View>
      {answer !== null ? <Pressable onPress={index + 1 < visible.length ? next : restart} style={styles.next}><Text style={[styles.buttonText, styles.selectedText]}>{index + 1 < visible.length ? (locale === 'nl' ? 'Volgend bord →' : locale === 'fa' ? 'تابلوی بعدی →' : 'بله نښه →') : (locale === 'nl' ? `Klaar: ${score} van ${visible.length} goed · Opnieuw` : locale === 'fa' ? `پایان: ${score} از ${visible.length} درست · دوباره` : `پای: ${score} له ${visible.length} سم · بیا پیل`)}</Text></Pressable> : null}
    </> : null}</ScrollView>}</CourseGate></TabShell>;
}

const styles = StyleSheet.create({
  container: { gap: 14, padding: 18, paddingBottom: 30 },
  title: { color: colors.ink, fontSize: 30, fontWeight: '900' },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeButton: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  filters: { gap: 8 },
  chip: { padding: 10, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  selected: { backgroundColor: colors.primary },
  buttonText: { color: colors.ink, fontWeight: '800' }, selectedText: { color: '#fff' },
  card: { flexDirection: 'row', gap: 14, padding: 14, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  image: { width: 82, height: 92, backgroundColor: colors.background, borderRadius: 10 },
  details: { flex: 1, gap: 4 },
  code: { color: colors.primary, fontWeight: '700' },
  name: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  localized: { color: colors.primaryDeep, fontSize: 16, fontWeight: '700' },
  explanation: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  muted: { color: colors.muted },
  quizCard: { gap: 12, padding: 18, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  quizImage: { width: '100%', height: 200, backgroundColor: colors.background, borderRadius: 12 },
  question: { color: colors.ink, fontSize: 21, fontWeight: '800' },
  option: { padding: 14, minHeight: 52, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  optionText: { color: colors.ink, fontSize: 16 },
  correct: { borderColor: colors.success, backgroundColor: colors.successSoft },
  incorrect: { borderColor: colors.error, backgroundColor: colors.errorSoft },
  feedback: { gap: 6, padding: 12, borderRadius: 12, backgroundColor: colors.primarySoft },
  feedbackTitle: { color: colors.primaryDeep, fontWeight: '800' },
  next: { alignItems: 'center', padding: 15, borderRadius: 12, backgroundColor: colors.primary },
  rtl: { textAlign: 'right', writingDirection: 'rtl' }
});

