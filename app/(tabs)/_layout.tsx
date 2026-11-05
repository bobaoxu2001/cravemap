import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, SafeAreaView } from 'react-native';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../src/hooks/useAuth';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, color, focused }: { name: IoniconName; color: string; focused: boolean }) {
  return <Ionicons name={focused ? name : (`${name}-outline` as IoniconName)} size={24} color={color} />;
}

export default function TabLayout() {
  const {
    loading,
    profileLoading,
    isAuthenticated,
    isProfileComplete,
    isSupabaseMode,
  } = useAuth();

  if (loading || (isSupabaseMode && isAuthenticated && profileLoading)) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (isSupabaseMode && !isAuthenticated) {
    return <Redirect href="/onboarding/welcome" />;
  }

  if (isSupabaseMode && !isProfileComplete) {
    return <Redirect href="/onboarding/taste-passport" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="map" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="bookmark" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="person" color={color} focused={focused} />
          ),
        }}
      />
      {/* Rewards is reachable from Profile → "Founding Scout" row.
          Hidden from the tab bar to keep top-level nav to 4 items. */}
      <Tabs.Screen
        name="rewards"
        options={{
          href: null,
          title: 'Rewards',
        }}
      />
    </Tabs>
  );
}
