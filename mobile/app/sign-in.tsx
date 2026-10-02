import { AuthView } from '@clerk/expo/native';
import { Linking, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/src/theme';

export default function SignInScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.auth}><AuthView mode="signInOrUp" isDismissible={false} /></View>
      <Pressable onPress={() => void Linking.openURL('https://www.mursaltheorie.nl/privacy')} accessibilityRole="link" style={styles.privacy}><Text style={styles.privacyText}>Privacybeleid · سیاست حریم خصوصی · د محرمیت تګلاره</Text></Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  auth: { flex: 1 }, privacy: { alignItems: 'center', padding: 14 }, privacyText: { color: colors.primary, fontSize: 12, textAlign: 'center' }
});

