import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Menu } from '@/src/Menu';
import signs from '@/src/signs.json';
import type { Locale } from '@/src/types';

type Sign = (typeof signs)[number];

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
  const categories = [...new Set(signs.map((sign) => sign.category))];
  const visible = category ? signs.filter((sign) => sign.category === category) : signs;
  const sign = visible[index];

  function selectCategory(next: string) { setCategory(next); setIndex(0); setAnswer(null); setScore(0); }
  function next() { setIndex((current) => current + 1); setAnswer(null); }
  function restart() { setIndex(0); setAnswer(null); setScore(0); }

  return <ScrollView contentContainerStyle={styles.container}>
    <Menu locale={locale} active="signs" />
    <Text style={[styles.title, rtl && styles.rtl]}>{locale === 'nl' ? 'Verkeersborden' : locale === 'fa' ? 'تابلوهای راهنمایی' : 'ترافیکي نښې'}</Text>
    <View style={styles.modeRow}>
      <Pressable onPress={() => setMode('catalog')} style={[styles.modeButton, mode === 'catalog' && styles.selected]}><Text style={styles.buttonText}>{locale === 'nl' ? 'Bekijken' : 'کتل'}</Text></Pressable>
      <Pressable onPress={() => { setMode('quiz'); restart(); }} style={[styles.modeButton, mode === 'quiz' && styles.selected]}><Text style={styles.buttonText}>{locale === 'nl' ? 'Borden oefenen' : 'تمرین'}</Text></Pressable>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
      <Pressable onPress={() => selectCategory('')} style={[styles.chip, !category && styles.selected]}><Text style={styles.buttonText}>{locale === 'nl' ? 'Alle borden' : 'همه'}</Text></Pressable>
      {categories.map((item) => <Pressable key={item} onPress={() => selectCategory(item)} style={[styles.chip, category === item && styles.selected]}><Text style={styles.buttonText}>{item}</Text></Pressable>)}
    </ScrollView>
    {mode === 'catalog' ? visible.map((item) => <View key={item.code} style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.image} resizeMode="contain" accessibilityLabel={item.name} />
      <View style={styles.details}><Text style={styles.code}>{item.code} · {item.category}</Text><Text style={styles.name}>{item.name}</Text><Text style={styles.explanation}>{item.explanation}</Text></View>
    </View>) : sign ? <>
      <Text style={styles.muted}>{Math.min(index + 1, visible.length)} / {visible.length} · {locale === 'nl' ? 'Goed' : '✓'}: {score}</Text>
      <View style={styles.quizCard}>
        <Image source={{ uri: sign.image }} style={styles.quizImage} resizeMode="contain" accessibilityLabel={`Verkeersbord ${sign.code}`} />
        <Text style={[styles.question, rtl && styles.rtl]}>{locale === 'nl' ? 'Wat betekent dit bord?' : locale === 'fa' ? 'این تابلو چه معنایی دارد؟' : 'دا نښه څه معنا لري؟'}</Text>
        {choicesFor(sign).map((choice) => <Pressable key={choice.code} disabled={answer !== null} onPress={() => { setAnswer(choice.code); if (choice.code === sign.code) setScore((value) => value + 1); }} style={[styles.option, answer === choice.code && (answer === sign.code ? styles.correct : styles.incorrect), answer !== null && choice.code === sign.code && styles.correct]}><Text style={styles.optionText}>{choice.name}</Text></Pressable>)}
        {answer !== null ? <View style={styles.feedback}><Text style={styles.feedbackTitle}>{answer === sign.code ? (locale === 'nl' ? 'Goed!' : '✓') : (locale === 'nl' ? `Juiste antwoord: ${sign.name}` : sign.name)}</Text><Text style={styles.explanation}>{sign.explanation}</Text></View> : null}
      </View>
      {answer !== null ? <Pressable onPress={index + 1 < visible.length ? next : restart} style={styles.next}><Text style={styles.buttonText}>{index + 1 < visible.length ? (locale === 'nl' ? 'Volgend bord →' : '→') : (locale === 'nl' ? `Klaar: ${score} van ${visible.length} goed · Opnieuw` : 'Opnieuw')}</Text></Pressable> : null}
    </> : null}
  </ScrollView>;
}

const styles = StyleSheet.create({
  container: { minHeight: '100%', gap: 14, padding: 18, paddingBottom: 50, backgroundColor: '#0b1633' },
  title: { color: '#fff', fontSize: 30, fontWeight: '800' },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeButton: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: '#152957', borderWidth: 1, borderColor: '#355795' },
  filters: { gap: 8 },
  chip: { padding: 10, borderRadius: 999, backgroundColor: '#152957', borderWidth: 1, borderColor: '#355795' },
  selected: { backgroundColor: '#e84a5f' },
  buttonText: { color: '#fff', fontWeight: '800' },
  card: { flexDirection: 'row', gap: 14, padding: 14, borderRadius: 16, backgroundColor: '#142653', borderWidth: 1, borderColor: '#24437f' },
  image: { width: 82, height: 92, backgroundColor: '#fff', borderRadius: 10 },
  details: { flex: 1, gap: 4 },
  code: { color: '#9cc9ff', fontWeight: '700' },
  name: { color: '#fff', fontSize: 17, fontWeight: '800' },
  explanation: { color: '#e2ecfa', fontSize: 15, lineHeight: 22 },
  muted: { color: '#a9c2ea' },
  quizCard: { gap: 12, padding: 18, borderRadius: 18, backgroundColor: '#142653', borderWidth: 1, borderColor: '#24437f' },
  quizImage: { width: '100%', height: 200, backgroundColor: '#fff', borderRadius: 12 },
  question: { color: '#fff', fontSize: 21, fontWeight: '800' },
  option: { padding: 14, borderRadius: 12, backgroundColor: '#1b315e', borderWidth: 1, borderColor: '#44639b' },
  optionText: { color: '#fff', fontSize: 16 },
  correct: { borderColor: '#55c795', backgroundColor: '#174b43' },
  incorrect: { borderColor: '#e9717a', backgroundColor: '#5b293c' },
  feedback: { gap: 6, padding: 12, borderRadius: 12, backgroundColor: '#20345c' },
  feedbackTitle: { color: '#ffd66b', fontWeight: '800' },
  next: { alignItems: 'center', padding: 15, borderRadius: 12, backgroundColor: '#e84a5f' },
  rtl: { textAlign: 'right', writingDirection: 'rtl' }
});
