import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/context/AuthContext';
import ErrorBoundary from '../components/ErrorBoundary';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding/welcome" />
          <Stack.Screen name="onboarding/taste-passport" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="restaurant/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="check-in" options={{ presentation: 'modal' }} />
          <Stack.Screen name="my-check-ins" options={{ presentation: 'card' }} />
          <Stack.Screen name="redeem" options={{ presentation: 'modal' }} />
          <Stack.Screen name="privacy-policy" options={{ presentation: 'card' }} />
          <Stack.Screen name="terms" options={{ presentation: 'card' }} />
        </Stack>
      </AuthProvider>
    </ErrorBoundary>
  );
}
