import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/context/AuthContext';

export default function RootLayout() {
  return (
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
      </Stack>
    </AuthProvider>
  );
}
