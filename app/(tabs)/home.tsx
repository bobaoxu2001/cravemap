import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { Restaurant, UserProfile, CheckIn } from '../../types';
import { getAllRestaurants } from '../../src/services/restaurants';
import { getAllCheckIns } from '../../src/services/checkIns';
import { getCurrentProfile, getTastePersona } from '../../src/services/profile';
import {
  applyTastePassport,
  getDecisionHeadline,
  getHungryNowPick,
  getHungryNowReason,
  getPrimaryOrder,
} from '../../src/lib/recommendations';
import SectionHeader from '../../components/SectionHeader';
import HorizontalScroll from '../../components/HorizontalScroll';
import RestaurantCard from '../../components/RestaurantCard';
import VoiceMic from '../../components/VoiceMic';

const CITIES = ['New York City', 'Los Angeles', 'Bay Area', 'Seattle', 'Boston'];

const PERSONA_EMOJI: Record<string, string> = {
  'Spicy Adventurer': '🌶️',
  'Healthy Foodie': '🥗',
  'Comfort Seeker': '🍜',
  'Authentic Explorer': '🍱',
};

const QUICK_FILTERS = [
  { key: 'all', label: 'All', emoji: '✨' },
  { key: 'actually-spicy', label: 'Spicy', emoji: '🌶️' },
  { key: 'local-approved', label: 'Local', emoji: '🏘️' },
  { key: 'hidden-gems', label: 'Hidden Gems', emoji: '💎' },
  { key: 'late-night', label: 'Late Night', emoji: '🌙' },
  { key: 'student-favorites', label: 'Budget', emoji: '🎓' },
  { key: 'culture-approved', label: 'Authentic', emoji: '🍜' },
];

const sections = [
  { key: 'trending-week', emoji: '🔥', title: 'Trending this week', subtitle: (city: string) => `What people in ${city} are talking about right now` },
  { key: 'local-approved', emoji: '🏘️', title: 'Local-approved', subtitle: () => 'What your neighbors actually eat — not what tourists post' },
  { key: 'taste-match', emoji: '👤', title: 'People with your taste', subtitle: () => 'Ranked by how well each spot matches your Taste Passport' },
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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([]);

  useEffect(() => {
    Promise.all([getAllRestaurants(), getCurrentProfile()])
      .then(([r, p]) => { setRestaurants(r); setProfile(p); })
      .finally(() => setLoading(false));
    getAllCheckIns().then(setRecentCheckIns);
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const firstName = profile?.name.split(' ')[0] ?? 'there';
  const persona = profile ? getTastePersona(profile) : 'Authentic Explorer';
  const personaEmoji = PERSONA_EMOJI[persona] ?? '🍱';

  // Personalize `tasteMatchPercent` against this user's Taste Passport so
  // shelves, search, and the Hungry Now pick all reflect per-user taste.
  const personalizedRestaurants = applyTastePassport(restaurants, profile);
  const hungryNowPick = getHungryNowPick(personalizedRestaurants, selectedCity);

  // Search results
  const trimmedQuery = searchQuery.trim();
  const searchResults = trimmedQuery
    ? personalizedRestaurants.filter((r) => {
        const haystack = (r.name + ' ' + r.cuisine + ' ' + r.neighborhood + ' ' + r.tags.join(' ')).toLowerCase();
        return haystack.includes(trimmedQuery.toLowerCase());
      })
    : [];

  // Filter helpers
  const isFiltered = activeFilter !== 'all' && !trimmedQuery;
  const filteredSections = isFiltered
    ? sections.filter((sec) => sec.key === activeFilter || sec.key === 'taste-match')
    : sections;

  const cityList = personalizedRestaurants.filter((r) => r.city === selectedCity);
  const filteredCityList = isFiltered
    ? cityList.filter((r) => r.categories.includes(activeFilter))
    : cityList;
  const featured = [...filteredCityList].sort((a, b) => b.tasteMatchPercent - a.tasteMatchPercent)[0];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logoSm}>好吃GO · CRAVEMAP</Text>
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
          <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/(tabs)/rewards')}>
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
            {personaEmoji} {persona} · {profile?.tastePreferences.length ?? 0} cuisines saved
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
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            ) : (
              <VoiceMic
                restaurants={restaurants}
                onResult={() => router.push('/voice-results')}
              />
            )}
          </View>
        </View>

        {/* Quick filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickFilterRow}
          contentContainerStyle={{ paddingRight: Spacing.md }}
        >
          {QUICK_FILTERS.map((filter) => {
            const isActive = activeFilter === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                style={[styles.quickFilterChip, isActive && styles.quickFilterChipActive]}
                onPress={() => setActiveFilter(filter.key)}
                activeOpacity={0.75}
              >
                <Text style={{ fontSize: 13 }}>{filter.emoji}</Text>
                <Text style={[styles.quickFilterChipText, isActive && styles.quickFilterChipTextActive]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Search results view */}
        {trimmedQuery ? (
          <>
            <View style={styles.searchResultsHeader}>
              <Text style={styles.searchResultsCount}>
                {searchResults.length} spot{searchResults.length !== 1 ? 's' : ''} found for "{trimmedQuery}"
              </Text>
            </View>
            {searchResults.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={styles.searchResultRow}
                onPress={() => router.push('/restaurant/' + r.id)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.searchResultName}>{r.name}</Text>
                  <Text style={styles.searchResultSub}>{r.neighborhood} · {r.cuisine}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 2 }}>
                  <Text style={styles.searchResultMatch}>{r.tasteMatchPercent}% match</Text>
                  <Text style={[styles.searchResultSub, { textAlign: 'right' }]}>{r.price}</Text>
                </View>
              </TouchableOpacity>
            ))}
            {searchResults.length === 0 && (
              <View style={{ paddingHorizontal: Spacing.md, paddingVertical: Spacing.lg }}>
                <Text style={[Typography.body, { color: Colors.textMuted, textAlign: 'center' }]}>
                  No restaurants found. Try a different search.
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
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
                  <Text style={styles.checkInSub}>Every check-in here is location-verified</Text>
                </View>
              </View>
              <View style={styles.checkInBtn}>
                <Text style={styles.checkInBtnText}>Check In</Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
              </View>
            </TouchableOpacity>

            {/* Hungry Now — single best pick for this city right now */}
            {hungryNowPick && (
              <TouchableOpacity
                style={styles.hungryCard}
                onPress={() => router.push('/restaurant/' + hungryNowPick.id)}
                activeOpacity={0.9}
              >
                <View style={styles.hungryTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.hungryEyebrow}>Hungry now</Text>
                    <Text style={styles.hungryTitle}>{hungryNowPick.name}</Text>
                  </View>
                  <View style={styles.hungryBadge}>
                    <Text style={styles.hungryBadgeText}>{hungryNowPick.tasteMatchPercent}%</Text>
                  </View>
                </View>
                <Text style={styles.hungryReason}>{getDecisionHeadline(hungryNowPick)}</Text>
                <Text style={styles.hungryMeta}>{getHungryNowReason(hungryNowPick)}</Text>
                <View style={styles.hungryOrderRow}>
                  <Ionicons name="restaurant-outline" size={15} color={Colors.primary} />
                  <Text style={styles.hungryOrderText} numberOfLines={1}>
                    Start with {getPrimaryOrder(hungryNowPick)}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Hero featured pick */}
            {featured && (() => {
              const featuredTopCheckIn = recentCheckIns
                .filter((ci) => ci.restaurantId === featured.id && ci.review && ci.review.length > 0)
                .sort((a, b) => (b.helpful ?? 0) - (a.helpful ?? 0))[0];
              return (
                <View style={styles.heroSection}>
                  <View style={styles.heroLabelRow}>
                    <View style={styles.heroAccentDot} />
                    <Text style={styles.heroLabel}>TODAY'S PICK FOR YOU</Text>
                  </View>
                  <Text style={styles.heroTitle}>🎯 {featured.name}</Text>
                  <Text style={styles.heroSub}>
                    {featured.tasteMatchPercent}% match · Top pick in {selectedCity.split(' ')[0]} for {featured.cuisine.split(' - ')[0].toLowerCase()}
                  </Text>
                  <View style={styles.heroCardWrap}>
                    <RestaurantCard
                      restaurant={featured}
                      topCheckIn={featuredTopCheckIn ? {
                        userName: featuredTopCheckIn.userName,
                        hypeRating: featuredTopCheckIn.hypeRating,
                        review: featuredTopCheckIn.review,
                      } : undefined}
                    />
                  </View>
                </View>
              );
            })()}

            {/* Scout Activity — empty-state CTA when no real check-ins yet */}
            {searchQuery === '' && activeFilter === 'all' && recentCheckIns.length === 0 && (
              <TouchableOpacity
                style={styles.scoutEmpty}
                onPress={() => router.push('/check-in')}
                activeOpacity={0.85}
              >
                <Text style={styles.scoutEmptyEmoji}>🌱</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.scoutEmptyTitle}>Be the first scout in {selectedCity.split(' ')[0]}</Text>
                  <Text style={styles.scoutEmptySub}>No check-ins here yet. Yours could be the one that helps your neighbors find the real spots.</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
              </TouchableOpacity>
            )}

            {/* Scout Activity */}
            {searchQuery === '' && activeFilter === 'all' && recentCheckIns.length > 0 && (
              <View style={styles.activitySection}>
                <View style={styles.activityHeader}>
                  <View style={styles.activityLiveDot} />
                  <Text style={styles.activityTitle}>Scout Activity</Text>
                  <Text style={styles.activitySub}>What locals checked in recently</Text>
                </View>
                {recentCheckIns.slice(0, 4).map((ci) => {
                  const restaurant = restaurants.find((r) => r.id === ci.restaurantId);
                  if (!restaurant) return null;
                  return (
                    <View key={ci.id} style={styles.activityRow}>
                      <Image source={{ uri: ci.userAvatar }} style={styles.activityAvatar} />
                      <View style={styles.activityBody}>
                        <View style={styles.activityTopLine}>
                          <Text style={styles.activityName}>{ci.userName}</Text>
                          <Text style={styles.activityAt}> at </Text>
                          <Text style={styles.activityRestaurant} numberOfLines={1}>{restaurant.name}</Text>
                        </View>
                        {ci.review ? (
                          <Text style={styles.activityReview} numberOfLines={2}>"{ci.review}"</Text>
                        ) : null}
                        <View style={styles.activityMeta}>
                          <Text style={[
                            styles.activityHype,
                            { color: ci.hypeRating === 'worth_it' ? Colors.green : ci.hypeRating === 'overhyped' ? '#C44545' : Colors.textMuted }
                          ]}>
                            {ci.hypeRating === 'worth_it' ? '✅ Worth it' : ci.hypeRating === 'overhyped' ? '🚫 Overhyped' : '🤔 Not sure'}
                          </Text>
                          {ci.locationVerified && (
                            <Text style={styles.activityVerified}>· ✓ Verified</Text>
                          )}
                        </View>
                      </View>
                      <Text style={styles.activityHelpful}>👍 {ci.helpful}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Sections */}
            {filteredSections.map((sec) => {
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
          </>
        )}

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
  quickFilterRow: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  quickFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.card,
  },
  quickFilterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  quickFilterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  quickFilterChipTextActive: {
    color: '#fff',
  },
  searchResultsHeader: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchResultsCount: {
    ...Typography.label,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  searchResultName: {
    ...Typography.label,
    fontWeight: '700',
    color: Colors.text,
  },
  searchResultSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  searchResultMatch: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.green,
  },
  hungryCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  hungryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  hungryEyebrow: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  hungryTitle: {
    ...Typography.h2,
    color: Colors.text,
  },
  hungryBadge: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  hungryBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  hungryReason: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  hungryMeta: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  hungryOrderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hungryOrderText: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
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
  activitySection: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  scoutEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '25',
  },
  scoutEmptyEmoji: {
    fontSize: 28,
  },
  scoutEmptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  scoutEmptySub: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.warmBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  activityLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.green,
  },
  activityTitle: {
    ...Typography.label,
    fontWeight: '800',
    color: Colors.text,
  },
  activitySub: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginLeft: 'auto',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  activityAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  activityBody: {
    flex: 1,
  },
  activityTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  activityName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  activityAt: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  activityRestaurant: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    flex: 1,
  },
  activityReview: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    marginTop: 2,
    fontStyle: 'italic',
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  activityHype: {
    fontSize: 11,
    fontWeight: '600',
  },
  activityVerified: {
    fontSize: 11,
    color: Colors.green,
    fontWeight: '600',
  },
  activityHelpful: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    alignSelf: 'center',
  },
  bottomPad: {
    height: Spacing.xl,
  },
});
