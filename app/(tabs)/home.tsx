import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { Restaurant, UserProfile } from '../../types';
import { getAllRestaurants } from '../../src/services/restaurants';
import { getCurrentProfile } from '../../src/services/profile';
import SectionHeader from '../../components/SectionHeader';
import HorizontalScroll from '../../components/HorizontalScroll';

const CITIES = ['New York City', 'Los Angeles', 'Bay Area', 'Seattle', 'Boston'];

// Minimalist pass: reduced from 11 sections → 3 to lower cognitive load.
// Full discovery (spicy, late-night, hidden gems, etc.) lives on the Explore tab,
// where users can filter intentionally instead of scrolling past 8 unread shelves.
// Subtitles tell the user WHY a section exists, not just what's in it.
// "Trending" = social proof of the moment; "For your taste" = personalized;
// "Local-approved" = neighborhood-level trust.
const sections = [
  { key: 'taste-match',    emoji: '', title: 'For your taste',     subtitle: () => 'Matches your taste passport' },
  { key: 'trending-week',  emoji: '', title: 'Trending this week', subtitle: (city: string) => `Most-saved in ${city} this week` },
  { key: 'local-approved', emoji: '', title: 'Local-approved',     subtitle: () => 'Highest approval from people who live nearby' },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function getRestaurantsForSection(key: string, city: string, allRestaurants: Restaurant[]) {
  let list = city ? allRestaurants.filter((r) => r.city === city) : allRestaurants;
  if (key === 'taste-match') {
    return [...list].sort((a, b) => b.tasteMatchPercent - a.tasteMatchPercent).slice(0, 8);
  }
  if (key === 'trending-week') {
    return list.filter((r) => r.trendingSignal === 'trending' || r.trendingSignal === 'rising').slice(0, 8);
  }
  if (key === 'hidden-by-algo') {
    return list
      .filter((r) => r.trendingSignal === 'underrated' || r.verifiedCheckIns < 600)
      .slice(0, 8);
  }
  return list.filter((r) => r.categories.includes(key)).slice(0, 8);
}

export default function Home() {
  const router = useRouter();
  const params = useLocalSearchParams<{ posted?: string; bonus?: string }>();
  const [selectedCity, setSelectedCity] = useState('New York City');
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadData = (mode: 'initial' | 'refresh' = 'initial') => {
    return Promise.all([getAllRestaurants(), getCurrentProfile()])
      .then(([r, p]) => { setRestaurants(r); setProfile(p); })
      .finally(() => {
        if (mode === 'initial') setLoading(false);
        else setRefreshing(false);
      });
  };

  useEffect(() => { loadData('initial'); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData('refresh');
  };

  // Show a brief toast when the user lands here after a successful check-in.
  // Connects the action → reward in plain language ("+200 pts toward Scout").
  useEffect(() => {
    if (params.posted === '1') {
      const bonus = params.bonus === '1' ? ' · +50 verified bonus' : '';
      setToastMsg(`Check-in posted · +200 pts toward Founding Scout${bonus}`);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToastMsg(null), 2800);
    }
  }, [params.posted, params.bonus]);

  // Clear the pending toast timer on unmount so we don't setState on an
  // unmounted component if the user navigates away during the 2.8s window.
  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
        toastTimer.current = null;
      }
    };
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm }}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={{ ...Typography.caption, color: Colors.textMuted }}>Finding spots in your city…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Post-action toast — fires when arriving from check-in/save flows */}
      {toastMsg && (
        <View style={styles.toast} pointerEvents="none">
          <Ionicons name="checkmark-circle" size={16} color={Colors.green} />
          <Text style={styles.toastText}>{toastMsg}</Text>
        </View>
      )}

      {/* Minimalist header — logo + city pill only. Notification bell dropped
          (not functional). Persona chip + search bar dropped (decoration). */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logoSm} accessibilityRole="header">好吃GO</Text>
          <Text style={styles.greeting}>{getGreeting()}, {profile?.name.split(' ')[0] ?? 'there'}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.citySelector}
            onPress={() => setCityDropdownOpen(!cityDropdownOpen)}
            accessibilityRole="button"
            accessibilityLabel={`City: ${selectedCity}`}
            accessibilityHint="Opens the city picker"
            accessibilityState={{ expanded: cityDropdownOpen }}
          >
            <Text style={styles.citySelectorText}>{selectedCity.split(' ')[0]}</Text>
            <Ionicons name="chevron-down" size={14} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* City dropdown — opens with a one-line hint explaining the switch
          changes ALL section content below, not just the trending row. */}
      {cityDropdownOpen && (
        <View style={styles.dropdown}>
          <Text style={styles.dropdownHint}>Switch city to see different local picks</Text>
          {CITIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.dropdownItem, selectedCity === c && styles.dropdownItemActive]}
              onPress={() => { setSelectedCity(c); setCityDropdownOpen(false); }}
            >
              <Text style={[styles.dropdownText, selectedCity === c && styles.dropdownTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* First-time guidance — shown only when the user has no activity
            yet. Derived from profile counters (no AsyncStorage needed), so it
            disappears the moment they save or check-in. */}
        {profile && profile.checkInCount === 0 && profile.savedCount === 0 && (
          <View style={styles.firstTimeHint}>
            <Ionicons name="sparkles-outline" size={16} color={Colors.primary} />
            <Text style={styles.firstTimeHintText}>
              Tap any restaurant to see details · Bookmark to save · Check in after a visit
            </Text>
          </View>
        )}

        {/* Single primary CTA — the most important action on this screen.
            Replaces the larger banner + persona chip + (non-functional) search bar
            + hero section. Discovery happens in the section shelves below. */}
        <TouchableOpacity
          style={styles.checkInBtn}
          onPress={() => router.push('/check-in')}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel="Post a check-in"
          accessibilityHint="Opens the check-in modal to share a recent visit"
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.checkInBtnText}>Post a check-in</Text>
        </TouchableOpacity>

        {/* Sections */}
        {sections.map((sec) => {
          const sectionRestaurants = getRestaurantsForSection(sec.key, selectedCity, restaurants);
          if (sectionRestaurants.length === 0) return null;
          return (
            <View key={sec.key} style={styles.section}>
              <SectionHeader
                title={sec.title}
                emoji={sec.emoji}
                subtitle={sec.subtitle(selectedCity)}
                onSeeAll={() => router.push('/map')}
              />
              <HorizontalScroll restaurants={sectionRestaurants} />
            </View>
          );
        })}

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  toast: {
    position: 'absolute',
    top: 50,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    zIndex: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  toastText: {
    ...Typography.label,
    color: Colors.text,
    fontWeight: '500',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    zIndex: 10,
  },
  logo: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
  },
  headerLeft: {
    flex: 1,
  },
  logoSm: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 1,
  },
  greeting: {
    ...Typography.h2,
    color: Colors.text,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  citySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
  },
  citySelectorText: {
    ...Typography.label,
    color: Colors.primary,
    fontWeight: '600',
  },
  dropdown: {
    position: 'absolute',
    top: 56,
    right: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  dropdownHint: {
    ...Typography.caption,
    color: Colors.textMuted,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  dropdownItemActive: {
    backgroundColor: Colors.secondary,
  },
  dropdownText: {
    ...Typography.body,
    color: Colors.text,
  },
  dropdownTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  firstTimeHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.md,
  },
  firstTimeHintText: {
    ...Typography.caption,
    color: Colors.text,
    flex: 1,
    lineHeight: 17,
  },
  checkInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: 14,
  },
  checkInBtnText: {
    ...Typography.label,
    color: '#fff',
    fontWeight: '600',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  bottomPad: {
    height: Spacing.xl,
  },
});
