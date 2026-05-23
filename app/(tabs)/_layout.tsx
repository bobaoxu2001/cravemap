import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, SafeAreaView, View, StyleSheet } from 'react-native';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../src/hooks/useAuth';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, color, focused }: { name: IoniconName; color: string; focused: boolean }) {
  return (
    <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
      <Ionicons
        name={focused ? name : (`${name}-outline` as IoniconName)}
        size={22}
        color={color}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    width: 48,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperActive: {
    backgroundColor: Colors.secondary,
  },
});

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
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          height: 70,
          paddingBottom: 10,
          paddingTop: 4,
          paddingHorizontal: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 16,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: -2,
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
      <Tabs.Screen
        name="rewards"
        options={{
          title: 'Rewards',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="star" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
