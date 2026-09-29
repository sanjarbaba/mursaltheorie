import { ClerkProvider, useAuth } from '@clerk/expo';
import { useAuthViewState } from '@clerk/expo/native';
import { tokenCache } from '@clerk/expo/token-cache';
import { Stack } from 'expo-router';
import { colors } from '@/src/theme';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';

if (!publishableKey) {
  throw new Error('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ontbreekt. Kopieer .env.example naar .env.');
}

function Routes() {
  const { isLoaded, isSignedIn } = useAuth();
  const { isLoaded: isAuthViewLoaded, isAuthFlowComplete } = useAuthViewState();
  if (!isLoaded) return null;
  const isReady = Boolean(isSignedIn && isAuthViewLoaded && isAuthFlowComplete);

  return (
    <Stack screenOptions={{ headerTitle: 'Mursal Theorie', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.ink, headerShadowVisible: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Protected guard={!isReady}>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={isReady}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="lesson/[id]" options={{ title: 'Les' }} />
        <Stack.Screen name="practice" options={{ headerShown: false }} />
        <Stack.Screen name="signs" options={{ headerShown: false }} />
        <Stack.Screen name="exams" options={{ headerShown: false }} />
        <Stack.Screen name="exam/[number]" options={{ title: 'Oefenexamen' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <Routes />
    </ClerkProvider>
  );
}


