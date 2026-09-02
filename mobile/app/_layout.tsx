import { ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { Stack } from 'expo-router';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';

if (!publishableKey) {
  throw new Error('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ontbreekt. Kopieer .env.example naar .env.');
}

function Routes() {
  const { isLoaded, isSignedIn } = useAuth({ treatPendingAsSignedOut: false });
  if (!isLoaded) return null;

  return (
    <Stack screenOptions={{ headerTitle: 'Mursal Theorie' }}>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(isSignedIn)}>
        <Stack.Screen name="index" options={{ title: 'Mijn cursus' }} />
        <Stack.Screen name="lesson/[id]" options={{ title: 'Les' }} />
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

