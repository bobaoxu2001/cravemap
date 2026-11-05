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
    isMerchant,
    isMerchantLoading,
    isSupabaseMode,
  } = useAuth();

  if (
    loading ||
    (isSupabaseMode && isAuthenticated && (profileLoading || isMerchantLoading))
  ) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.secondary }}>
        <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (isSupabaseMode && isAuthenticated) {
    // Merchants land in Studio. A user with both a merchant_profile and a
    // completed taste_passport is treated as a merchant first — they can
    // still navigate to the diner side from inside Studio.
    if (isMerchant) {
      return <Redirect href="/studio/dashboard" />;
    }
    if (!isProfileComplete) {
      return <Redirect href="/onboarding/taste-passport" />;
    }
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/role-select" />;
}
