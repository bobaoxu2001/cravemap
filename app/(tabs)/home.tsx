import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { mockRestaurants } from '../../data/mockRestaurants';
import { mockUser } from '../../data/mockUser';
import SectionHeader from '../../components/SectionHeader';
import HorizontalScroll from '../../components/HorizontalScroll';
import RestaurantCard from '../../components/RestaurantCard';

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

function getRestaurantsForSection(key: string, city: string) {
  let list = city ? mockRestaurants.filter((r) => r.city === city) : mockRestaurants;
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

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logoSm}>好吃GO</Text>
          <Text style={styles.greeting}>{getGreeting()}, {mockUser.name.split(' ')[0]}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.citySelector}
            onPress={() => setCityDropdownOpen(!cityDropdownOpen)}
          >
            <Text style={styles.citySelectorText}>{selectedCity.split(' ')[0]}</Text>
            <Ionicons name="chevron-down" size={14} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={22} color={Colors.text} />
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
            🌶️ Spicy Adventurer · {mockUser.tastePreferences.length} cuisines saved
          </Text>
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
          </View>
        </View>

        {/* Check-in CTA */}
        <TouchableOpacity
          style={styles.checkInBanner}
          onPress={() => router.push('/check-in')}
          activeOpacity={0.85}
        >
          <View>
            <Text style={styles.checkInTitle}>Had a great meal?</Text>
            <Text style={styles.checkInSub}>Post a check-in and earn Founding Scout points</Text>
          </View>
          <View style={styles.checkInBtn}>
            <Text style={styles.checkInBtnText}>+ Check In</Text>
          </View>
        </TouchableOpacity>

        {/* Hero featured pick */}
        {(() => {
          const cityList = mockRestaurants.filter((r) => r.city === selectedCity);
          const featured = [...cityList].sort((a, b) => b.tasteMatchPercent - a.tasteMatchPercent)[0];
          if (!featured) return null;
          return (
            <View style={styles.heroSection}>
              <Text style={styles.heroTitle}>🎯 Today&apos;s Pick for You</Text>
              <Text style={styles.heroSub}>
                {featured.tasteMatchPercent}% of Spicy Adventurers in {selectedCity.split(' ')[0]} who tried {featured.cuisine.split(' - ')[0].toLowerCase()} this month said this was worth it.
              </Text>
              <View style={styles.heroCardWrap}>
                <RestaurantCard restaurant={featured} />
              </View>
            </View>
          );
        })()}

        {/* Sections */}
        {sections.map((sec) => {
          const restaurants = getRestaurantsForSection(sec.key, selectedCity);
          if (restaurants.length === 0) return null;
          return (
            <View key={sec.key} style={styles.section}>
              <SectionHeader
                title={sec.title}
                emoji={sec.emoji}
                subtitle={sec.subtitle(selectedCity)}
                onSeeAll={() => router.push('/map')}
              />
              <HorizontalScroll restaurants={restaurants} />
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
  personaChip: {
    alignSelf: 'flex-start',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  personaChipText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  heroSection: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  heroTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: 2,
  },
  heroSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  heroCardWrap: {
    alignItems: 'flex-start',
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
  notifBtn: {
    padding: 4,
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
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
  },
  checkInBanner: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkInTitle: {
    ...Typography.label,
    color: '#fff',
    fontWeight: '700',
    marginBottom: 2,
  },
  checkInSub: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.8)',
    maxWidth: 200,
  },
  checkInBtn: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  checkInBtnText: {
    ...Typography.label,
    color: Colors.primary,
    fontWeight: '700',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  bottomPad: {
    height: Spacing.xl,
  },
});
