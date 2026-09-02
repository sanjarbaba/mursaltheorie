import { AuthView } from '@clerk/expo/native';
import { SafeAreaView, StyleSheet } from 'react-native';

export default function SignInScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <AuthView mode="signInOrUp" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f3ea' }
});

