import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { Restaurant, UserProfile } from '../../types';
import { getAllRestaurants } from '../../src/services/restaurants';
import { getCurrentProfile } from '../../src/services/profile';
import SectionHeader from '../../components/SectionHeader';
import HorizontalScroll from '../../components/HorizontalScroll';
import RestaurantCard from '../../components/RestaurantCard';
import VoiceMic from '../../components/VoiceMic';

const CITIES = ['New York City', 'Los Angeles', 'Bay Area', 'Seattle', 'Boston'];

const sections = [
  { key: 'trending-week', emoji: '🔥', title: 'Trending this week', subtitle: (city: string) => `What people in ${city} are talking about right now` },
  { key: 'local-approved', emoji: '🏘️', title: 'Local-approved', subtitle: () => 'What your neighbors actually eat — not what tourists post' },
  { key: 'taste-match', emoji: '👤', title: 'People with your taste', subtitle: () => '247 Spicy Adventurers in NYC saved these this month' },
  { key: 'actually-spicy', emoji: '🌶️', title: 'Actually spicy', subtitle: () => 'Cleared by scouts with verified spice tolerance' },
  { key: 'hidden-by-algo', emoji: '🫥', title: 'Hidden by the algorithm', subtitle: () => "Locals know. Algorithms don't. Yet." },
  { key: 'anti-hype', emoji: '🤫', title: 'Worth-it picks', subtitle: () => 'Quietly excellent. No viral video required.' },
  { key: 'culture-approved', emoji: '🍜', title: 'Culture-approved', subtitle: () => 'Validated by people from where the food is from' },
  { key: 'diet-approved', emoji: '🥗', title: 'Diet-approved', subtitle: () => 'Matches your dietary preferences' },
  { key: 'late-night', emoji: '🌙', title: 'Late-night eats', subtitle: () => 'Open past 10. The night-shift crew approves.' },
  { key: 'student-favorites', emoji: '📚', title: 'Student favorites', subtitle: () => '$10 fills you up. The graduate student diet.' },
  { key: 'hidden-gems', emoji: '💎', title: 'Hidden gems', subtitle: () => '<500 check-ins, but the right 500' },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function getGreetingEmoji() {
  const h = new Date().getHours();
  if (h < 12) return '☀️';
  if (h < 18) return '🌤️';
  return '🌙';
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
  const [selectedCity, setSelectedCity] = useState('New York City');
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAllRestaurants(), getCurrentProfile()])
      .then(([r, p]) => { setRestaurants(r); setProfile(p); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const firstName = profile?.name.split(' ')[0] ?? 'there';

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logoSm}>好吃GO</Text>
          <View style={styles.greetingRow}>
            <Text style={styles.greetingEmoji}>{getGreetingEmoji()}</Text>
            <Text style={styles.greeting}>{getGreeting()}, {firstName}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.citySelector}
            onPress={() => setCityDropdownOpen(!cityDropdownOpen)}
          >
            <Ionicons name="location" size={12} color={Colors.primary} />
            <Text style={styles.citySelectorText}>{selectedCity.split(' ')[0]}</Text>
            <Ionicons name="chevron-down" size={12} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={22} color={Colors.text} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* City dropdown */}
      {cityDropdownOpen && (
        <View style={styles.dropdown}>
          {CITIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.dropdownItem, selectedCity === c && styles.dropdownItemActive]}
              onPress={() => { setSelectedCity(c); setCityDropdownOpen(false); }}
            >
              {selectedCity === c && <Ionicons name="checkmark" size={14} color={Colors.primary} />}
              <Text style={[styles.dropdownText, selectedCity === c && styles.dropdownTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Persona chip */}
        <TouchableOpacity
          style={styles.personaChip}
          onPress={() => router.push('/profile')}
          activeOpacity={0.7}
        >
          <Text style={styles.personaChipText}>
            🌶️ Spicy Adventurer · {profile?.tastePreferences.length ?? 0} cuisines saved
          </Text>
          <Ionicons name="chevron-forward" size={12} color={Colors.primary} />
        </TouchableOpacity>

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search restaurants, cuisines..."
              placeholderTextColor={Colors.textMuted}
              editable={false}
            />
            <VoiceMic
              restaurants={restaurants}
              onResult={() => router.push('/voice-results')}
            />
          </View>
        </View>

        {/* Check-in CTA */}
        <TouchableOpacity
          style={styles.checkInBanner}
          onPress={() => router.push('/check-in')}
          activeOpacity={0.85}
        >
          <View style={styles.checkInLeft}>
            <Text style={styles.checkInEmoji}>🍽️</Text>
            <View>
              <Text style={styles.checkInTitle}>Had a great meal?</Text>
              <Text style={styles.checkInSub}>Earn Founding Scout points</Text>
            </View>
          </View>
          <View style={styles.checkInBtn}>
            <Text style={styles.checkInBtnText}>Check In</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
          </View>
        </TouchableOpacity>

        {/* Hero featured pick */}
        {(() => {
          const cityList = restaurants.filter((r) => r.city === selectedCity);
          const featured = [...cityList].sort((a, b) => b.tasteMatchPercent - a.tasteMatchPercent)[0];
          if (!featured) return null;
          return (
            <View style={styles.heroSection}>
              <View style={styles.heroLabelRow}>
                <View style={styles.heroAccentDot} />
                <Text style={styles.heroLabel}>TODAY'S PICK FOR YOU</Text>
              </View>
              <Text style={styles.heroTitle}>🎯 {featured.name}</Text>
              <Text style={styles.heroSub}>
                {featured.tasteMatchPercent}% of Spicy Adventurers in {selectedCity.split(' ')[0]} who tried {featured.cuisine.split(' - ')[0].toLowerCase()} this month said this was worth it.
              </Text>
              <View style={styles.heroCardWrap}>
                <RestaurantCard
                  restaurant={featured}
                  topCheckIn={{ userName: 'Sarah K.', hypeRating: 'worth_it', review: 'Skip the menu, order the #6. Cash only but absolutely worth it.' }}
                />
              </View>
            </View>
          );
        })()}

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    backgroundColor: Colors.background,
    zIndex: 10,
  },
  headerLeft: {
    flex: 1,
  },
  logoSm: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  greetingEmoji: {
    fontSize: 18,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
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
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.primary + '25',
  },
  citySelectorText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  notifBtn: {
    padding: 4,
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    borderWidth: 1.5,
    borderColor: Colors.background,
  },
  dropdown: {
    position: 'absolute',
    top: 62,
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
    minWidth: 170,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
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
  personaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    gap: 4,
  },
  personaChipText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
  },
  searchFilter: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInBanner: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary + '30',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  checkInLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  checkInEmoji: {
    fontSize: 26,
  },
  checkInTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 1,
  },
  checkInSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  checkInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.sm - 2,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  checkInBtnText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700',
  },
  heroSection: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  heroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  heroAccentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 1.5,
  },
  heroTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: 4,
  },
  heroSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 17,
  },
  heroCardWrap: {
    alignItems: 'flex-start',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  bottomPad: {
    height: Spacing.xl,
  },
});
