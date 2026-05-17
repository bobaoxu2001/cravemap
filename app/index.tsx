import { Redirect } from 'expo-router';
import { ActivityIndicator, SafeAreaView } from 'react-native';
import { Colors } from '../constants/theme';
import { useAuth } from '../src/hooks/useAuth';

export default function Index() {
  const { loading, isAuthenticated, isSupabaseMode } = useAuth();

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.secondary }}>
        <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (isSupabaseMode && isAuthenticated) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/onboarding/welcome" />;
}
