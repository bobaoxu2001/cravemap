import { Redirect } from 'expo-router';
import { ActivityIndicator, SafeAreaView } from 'react-native';
import { Colors } from '../constants/theme';
import { useAuth } from '../src/hooks/useAuth';

export default function Index() {
  const {
    loading,
    profileLoading,
    isAuthenticated,
    isProfileComplete,
    isSupabaseMode,
  } = useAuth();

  if (loading || (isSupabaseMode && isAuthenticated && profileLoading)) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.secondary }}>
        <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (isSupabaseMode && isAuthenticated) {
    if (!isProfileComplete) {
      return <Redirect href="/onboarding/taste-passport" />;
    }
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/onboarding/welcome" />;
}
