import { ClerkProvider, useAuth } from '@clerk/expo';
import { useAuthViewState } from '@clerk/expo/native';
import { tokenCache } from '@clerk/expo/token-cache';
import { Stack } from 'expo-router';

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
    <Stack screenOptions={{ headerTitle: 'Mursal Theorie' }}>
      <Stack.Protected guard={!isReady}>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={isReady}>
        <Stack.Screen name="index" options={{ title: 'Mijn cursus' }} />
        <Stack.Screen name="lesson/[id]" options={{ title: 'Les' }} />
        <Stack.Screen name="practice" options={{ title: 'Oefenen' }} />
        <Stack.Screen name="signs" options={{ title: 'Verkeersborden' }} />
        <Stack.Screen name="exams" options={{ title: 'Oefenexamens' }} />
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

