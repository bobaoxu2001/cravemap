import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { Restaurant } from '../types';
import { getAllRestaurants } from '../src/services/restaurants';
import { createCheckIn } from '../src/services/checkIns';
import { getTastePersona, getCurrentProfile } from '../src/services/profile';
import { useAuth } from '../src/hooks/useAuth';
import { getPetStats, getXPForCheckIn, PetStats } from '../src/services/petSystem';
import ProgressBar from '../components/ProgressBar';
import TagChip from '../components/TagChip';
import AnimatedMascot from '../components/AnimatedMascot';
import Sparkles from '../components/Sparkles';

const DEMO_USER_ID = 'u001';

const TOTAL_STEPS = 2;
const MAX_PHOTOS = 6;

const tasteTags = ['Spicy', 'Very Spicy', 'Savory', 'Sweet', 'Smoky', 'Sour', 'Umami', 'Light', 'Rich', 'Crispy'];
const dietTags = ['Vegan', 'Vegetarian', 'Halal', 'Gluten-Free', 'Dairy-Free'];
const sceneTags = ['Solo Dining', 'Date Night', 'Group Dinner', 'Work Lunch', 'Late Night', 'Brunch', 'Quick Bite'];

type HypeRating = 'worth_it' | 'overhyped' | 'not_sure';
const hypeOptions: { value: HypeRating; label: string; emoji: string }[] = [
  { value: 'worth_it', label: 'Worth It', emoji: '✅' },
  { value: 'overhyped', label: 'Overhyped', emoji: '🚫' },
  { value: 'not_sure', label: 'Not Sure', emoji: '🤔' },
];

function MultiChips({
  options,
  selected,
  onToggle,
  variant = 'primary',
}: {
  options: string[];
  selected: string[];
  onToggle: (val: string) => void;
  variant?: 'primary' | 'green' | 'yellow';
}) {
  return (
    <View style={styles.chips}>
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onToggle(opt)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function CheckIn() {
  const router = useRouter();
  const { session, isSupabaseMode, profile: authProfile } = useAuth();
  const persona = authProfile ? getTastePersona(authProfile) : 'Authentic Explorer';
  const userId = isSupabaseMode ? (session?.userId ?? null) : DEMO_USER_ID;

  const [step, setStep] = useState(1);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [review, setReview] = useState('');
  const [selectedTasteTags, setSelectedTasteTags] = useState<string[]>([]);
  const [selectedDietTags, setSelectedDietTags] = useState<string[]>([]);
  const [selectedSceneTags, setSelectedSceneTags] = useState<string[]>([]);
  const [hypeRating, setHypeRating] = useState<HypeRating | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'verifying' | 'verified'>('idle');
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitWarning, setSubmitWarning] = useState('');
  const [xpEarned, setXpEarned] = useState(50);
  const [petStatsBefore, setPetStatsBefore] = useState<PetStats | null>(null);
  const [petStatsAfter, setPetStatsAfter] = useState<PetStats | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState('');

  const [sampleRestaurants, setSampleRestaurants] = useState<Restaurant[]>([]);
  const [restaurantSearch, setRestaurantSearch] = useState('');
  const params = useLocalSearchParams<{ restaurantId?: string }>();

  useEffect(() => {
    getAllRestaurants().then((all) => {
      setSampleRestaurants(all);
      // Deep-linked from a restaurant page — lock the restaurant in and
      // skip the picker so the user isn't asked to choose it again.
      if (params.restaurantId) {
        const match = all.find((r) => r.id === params.restaurantId);
        if (match) {
          setSelectedRestaurant(match);
          setStep(2);
        }
      }
    });
  }, [params.restaurantId]);

  const filteredRestaurants = restaurantSearch.trim()
    ? sampleRestaurants.filter((r) =>
        [r.name, r.cuisine, r.neighborhood].join(' ').toLowerCase().includes(restaurantSearch.toLowerCase())
      )
    : sampleRestaurants;

  const toggleTag = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const canNext = () => {
    if (submitting) return false;
    if (step === 1) return selectedRestaurant !== null;
    if (step === 2) return hypeRating !== null;
    return true;
  };

  useEffect(() => {
    if (step === 2) {
      setLocationStatus('verifying');
      const timer = setTimeout(() => setLocationStatus('verified'), 2000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const remainingPhotoSlots = MAX_PHOTOS - photos.length;

  const pickFromLibrary = async () => {
    setPhotoError('');
    if (remainingPhotoSlots <= 0) {
      setPhotoError(`You can only attach up to ${MAX_PHOTOS} photos.`);
      return;
    }
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setPhotoError('Photo library access is required to attach photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: remainingPhotoSlots,
        quality: 0.7,
      });
      if (result.canceled) return;
      const newUris = result.assets.map((a) => a.uri).filter(Boolean);
      setPhotos((prev) => [...prev, ...newUris].slice(0, MAX_PHOTOS));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not open photo library.';
      setPhotoError(message);
    }
  };

  const pickFromCamera = async () => {
    setPhotoError('');
    if (remainingPhotoSlots <= 0) {
      setPhotoError(`You can only attach up to ${MAX_PHOTOS} photos.`);
      return;
    }
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setPhotoError('Camera access is required to take photos.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.7,
      });
      if (result.canceled) return;
      const newUris = result.assets.map((a) => a.uri).filter(Boolean);
      setPhotos((prev) => [...prev, ...newUris].slice(0, MAX_PHOTOS));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not open camera.';
      setPhotoError(message);
    }
  };

  const removePhoto = (uri: string) => {
    setPhotos((prev) => prev.filter((p) => p !== uri));
  };

  const handleSubmit = async () => {
    if (isSupabaseMode && !userId) {
      Alert.alert(
        'Sign in required',
        'Create an account to post check-ins.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.replace('/onboarding/welcome') },
        ]
      );
      return;
    }

    if (!selectedRestaurant || !hypeRating) return;

    setSubmitting(true);
    setSubmitError('');
    setSubmitWarning('');
    try {
      const result = await createCheckIn({
        restaurantId: selectedRestaurant.id,
        review,
        photos,
        tasteTags: selectedTasteTags,
        dietTags: selectedDietTags,
        sceneTags: selectedSceneTags,
        hypeRating,
        locationVerified: locationStatus === 'verified',
      });
      if (result.warning) {
        setSubmitWarning(result.warning);
      }
      // Capture pet state before/after for the level-up display
      const profileBefore = await getCurrentProfile();
      if (profileBefore) {
        setPetStatsBefore(getPetStats(profileBefore));
        const earned = getXPForCheckIn(locationStatus === 'verified');
        setXpEarned(earned);
        // Simulate post-check-in profile (increment check-in count)
        const profileAfter = { ...profileBefore, checkInCount: profileBefore.checkInCount + 1 };
        setPetStatsAfter(getPetStats(profileAfter));
      }
      setShowSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Check-in failed. Please try again.';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      void handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  const stepTitles = [
    'Which restaurant?',
    'Your take?',
  ];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.closeBtn}>
          <Ionicons name={step === 1 ? 'close' : 'chevron-back'} size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Check In</Text>
        <Text style={styles.stepCounter}>{step}/{TOTAL_STEPS}</Text>
      </View>

      <View style={styles.progressContainer}>
        <ProgressBar progress={step / TOTAL_STEPS} height={3} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.stepTitle}>{stepTitles[step - 1]}</Text>

        {/* Step 1: Restaurant selection */}
        {step === 1 && (
          <>
            <View style={styles.restaurantSearchBar}>
              <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
              <TextInput
                style={styles.restaurantSearchInput}
                placeholder="Search restaurant, cuisine, or neighborhood..."
                placeholderTextColor={Colors.textMuted}
                value={restaurantSearch}
                onChangeText={setRestaurantSearch}
                autoCapitalize="none"
                returnKeyType="search"
              />
              {restaurantSearch.length > 0 && (
                <TouchableOpacity onPress={() => setRestaurantSearch('')}>
                  <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.restaurantList}>
              {filteredRestaurants.length === 0 && (
                <View style={styles.restaurantNoResults}>
                  <Text style={styles.restaurantNoResultsText}>No restaurants found for "{restaurantSearch}"</Text>
                </View>
              )}
              {filteredRestaurants.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={[styles.restaurantOption, selectedRestaurant?.id === r.id && styles.restaurantOptionSelected]}
                  onPress={() => setSelectedRestaurant(r)}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: r.images[0] }} style={styles.restaurantOptionImage} />
                  <View style={styles.restaurantOptionInfo}>
                    <Text style={styles.restaurantOptionName}>{r.name}</Text>
                    <Text style={styles.restaurantOptionSub}>{r.neighborhood} · {r.cuisine}</Text>
                    <View style={styles.restaurantOptionMeta}>
                      <Text style={[styles.restaurantOptionMatch, { color: r.tasteMatchPercent >= 85 ? Colors.green : Colors.accent }]}>
                        {r.tasteMatchPercent}% match
                      </Text>
                      <Text style={styles.restaurantOptionDot}>·</Text>
                      <Text style={[styles.restaurantOptionOpen, { color: r.isOpen ? Colors.green : Colors.textMuted }]}>
                        {r.isOpen ? 'Open' : 'Closed'}
                      </Text>
                      <Text style={styles.restaurantOptionDot}>·</Text>
                      <Text style={styles.restaurantOptionPrice}>{r.price}</Text>
                    </View>
                  </View>
                  {selectedRestaurant?.id === r.id && (
                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Step 2: Combined "Your take?" */}
        {step === 2 && (
          <View style={styles.quickTakeSection}>
            {/* Restaurant banner with location pill */}
            {selectedRestaurant && (
              <View style={styles.selectedBanner}>
                <View style={styles.selectedBannerLeft}>
                  <Image source={{ uri: selectedRestaurant.images[0] }} style={styles.selectedBannerImg} />
                  <View>
                    <Text style={styles.selectedBannerName}>{selectedRestaurant.name}</Text>
                    <Text style={styles.selectedBannerSub}>{selectedRestaurant.neighborhood}</Text>
                  </View>
                </View>
                {locationStatus === 'verifying' ? (
                  <View style={styles.locationVerifyingPill}>
                    <ActivityIndicator size="small" color={Colors.textMuted} />
                    <Text style={styles.locationVerifyingText}>Locating...</Text>
                  </View>
                ) : locationStatus === 'verified' ? (
                  <View style={styles.locationVerifiedPill}>
                    <Text style={styles.locationVerifiedText}>✓ Location verified</Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* Compact photo row */}
            <View style={styles.photoRow}>
              <TouchableOpacity
                style={[styles.photoAddBtn, remainingPhotoSlots <= 0 && styles.photoBtnDisabled]}
                onPress={pickFromCamera}
                disabled={remainingPhotoSlots <= 0}
                activeOpacity={0.7}
              >
                <Ionicons name="camera-outline" size={18} color={Colors.primary} />
                <Text style={styles.photoAddBtnText}>Photo</Text>
              </TouchableOpacity>
              {photos.slice(0, 3).map((uri) => (
                <View key={uri} style={styles.photoThumbSmall}>
                  <Image source={{ uri }} style={styles.photoThumbSmallImg} />
                  <TouchableOpacity
                    style={styles.photoRemoveBtnSmall}
                    onPress={() => removePhoto(uri)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close" size={10} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            {photoError ? <Text style={styles.photoErrorText}>{photoError}</Text> : null}

            {/* Hype rating — required */}
            <Text style={styles.inputLabel}>Was it worth it?</Text>
            <View style={styles.hypeOptions}>
              {hypeOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.hypeOption, hypeRating === opt.value && styles.hypeOptionSelected]}
                  onPress={() => setHypeRating(opt.value)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.hypeEmoji}>{opt.emoji}</Text>
                  <Text style={[styles.hypeLabel, hypeRating === opt.value && styles.hypeLabelSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Taste tags — optional */}
            <Text style={styles.inputLabel}>
              Taste tags <Text style={styles.optionalLabel}>(optional)</Text>
            </Text>
            <MultiChips
              options={tasteTags}
              selected={selectedTasteTags}
              onToggle={(v) => toggleTag(selectedTasteTags, setSelectedTasteTags, v)}
              variant="primary"
            />
          </View>
        )}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navBar}>
        {submitError ? (
          <Text style={styles.submitError}>{submitError}</Text>
        ) : null}
        <TouchableOpacity
          style={[styles.nextBtn, !canNext() && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={!canNext()}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextBtnText}>
              {step === TOTAL_STEPS ? 'Post Check-in 🎉' : 'Next →'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successMascotBox}>
              <Sparkles active={showSuccess} />
              <AnimatedMascot
                key={String(showSuccess)}
                persona={persona}
                size={140}
                animate
              />
            </View>
            <Text style={styles.successTitle}>You&apos;re shaping the map.</Text>
            <Text style={styles.successSub}>
              Your take on {selectedRestaurant?.name} just hit the local-approved feed.
            </Text>
            {submitWarning ? (
              <View style={styles.warningBanner}>
                <Ionicons name="warning-outline" size={16} color={Colors.accent} />
                <Text style={styles.warningBannerText}>{submitWarning}</Text>
              </View>
            ) : null}
            {/* XP earned */}
            <View style={styles.xpRow}>
              <View style={styles.xpBadge}>
                <Text style={styles.xpBadgeText}>+{xpEarned} XP</Text>
              </View>
              {locationStatus === 'verified' && (
                <View style={[styles.xpBadge, styles.xpBadgeBonus]}>
                  <Text style={[styles.xpBadgeText, { color: Colors.green }]}>✓ Verified bonus</Text>
                </View>
              )}
            </View>

            {/* Level-up banner */}
            {petStatsBefore && petStatsAfter && petStatsAfter.level > petStatsBefore.level && (
              <View style={styles.levelUpBanner}>
                <Text style={styles.levelUpText}>
                  🎉 Level Up! {petStatsAfter.emoji} {petStatsAfter.titleZh} reached!
                </Text>
              </View>
            )}

            {/* Pet progress bar */}
            {petStatsAfter && !petStatsAfter.isMaxLevel && (
              <View style={styles.petProgressRow}>
                <Text style={styles.petProgressLabel}>
                  {petStatsAfter.emoji} {petStatsAfter.titleZh} · {petStatsAfter.totalXP} XP
                </Text>
                <Text style={styles.petProgressHint}>
                  {petStatsAfter.xpToNextLevel} XP to {petStatsAfter.nextLevel?.titleZh}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.successBtn}
              onPress={() => {
                setShowSuccess(false);
                router.replace('/(tabs)/home');
              }}
            >
              <Text style={styles.successBtnText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  stepCounter: {
    ...Typography.label,
    color: Colors.textMuted,
    width: 40,
    textAlign: 'right',
  },
  progressContainer: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
  },
  stepTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  restaurantList: {
    gap: Spacing.sm,
  },
  restaurantOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  restaurantOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.secondary,
  },
  restaurantOptionImage: {
    width: 70,
    height: 70,
  },
  restaurantOptionInfo: {
    flex: 1,
    padding: Spacing.sm,
  },
  restaurantOptionName: {
    ...Typography.label,
    color: Colors.text,
    fontWeight: '700',
  },
  restaurantOptionSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  restaurantOptionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  restaurantOptionMatch: {
    fontSize: 11,
    fontWeight: '700',
  },
  restaurantOptionDot: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  restaurantOptionOpen: {
    fontSize: 11,
    fontWeight: '600',
  },
  restaurantOptionPrice: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  photoSection: {
    gap: Spacing.md,
  },
  selectedInfo: {
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  selectedLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  selectedName: {
    ...Typography.h3,
    color: Colors.primary,
  },
  photoPlaceholder: {
    height: 180,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  photoPlaceholderText: {
    ...Typography.label,
    color: Colors.textMuted,
  },
  photoPlaceholderSub: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  photoBtnText: {
    ...Typography.label,
    color: Colors.primary,
    fontWeight: '600',
  },
  photoSkipNote: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  photoErrorText: {
    ...Typography.caption,
    color: Colors.error,
    textAlign: 'center',
  },
  photoBtnDisabled: {
    opacity: 0.5,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  photoThumbWrap: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAddTile: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
  },
  reviewSection: {
    gap: Spacing.sm,
  },
  inputLabel: {
    ...Typography.label,
    color: Colors.text,
    fontWeight: '700',
    marginBottom: 4,
    marginTop: Spacing.sm,
  },
  reviewInput: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.text,
    minHeight: 120,
  },
  charCount: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'right',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.primary,
  },
  chipText: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  tagsSection: {
    gap: Spacing.xs,
  },
  hypeOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  hypeOption: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  hypeOptionSelected: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.primary,
  },
  hypeEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  hypeLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  hypeLabelSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  locationSection: {
    gap: Spacing.md,
  },
  locationCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  locationTitle: {
    ...Typography.h3,
    color: Colors.text,
    textAlign: 'center',
  },
  locationDesc: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  verifyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.sm,
  },
  verifyBtnText: {
    ...Typography.label,
    color: '#fff',
    fontWeight: '700',
  },
  verifyingDots: {
    marginTop: Spacing.sm,
  },
  verifyingDotText: {
    fontSize: 20,
    color: Colors.accent,
    letterSpacing: 4,
  },
  verifiedCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: '#E8F5EE',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  verifiedBadgeText: {
    ...Typography.label,
    color: Colors.green,
    fontWeight: '600',
  },
  skipVerify: {
    alignItems: 'center',
  },
  skipVerifyText: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  navBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  nextBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  nextBtnDisabled: {
    backgroundColor: Colors.border,
  },
  nextBtnText: {
    ...Typography.h3,
    color: '#fff',
  },
  submitError: {
    ...Typography.caption,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  successCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    width: '100%',
  },
  successMascotBox: {
    width: 200,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    ...Typography.h1,
    color: Colors.text,
  },
  successSub: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  xpRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  xpBadge: {
    backgroundColor: '#F0FBF5',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.green + '40',
  },
  xpBadgeBonus: {
    backgroundColor: '#FFF4E6',
    borderColor: Colors.accent + '40',
  },
  xpBadgeText: {
    ...Typography.label,
    color: Colors.green,
    fontWeight: '700',
    fontSize: 14,
  },
  levelUpBanner: {
    backgroundColor: '#FFF4E6',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.accent + '60',
    alignItems: 'center',
  },
  levelUpText: {
    ...Typography.label,
    color: Colors.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  petProgressRow: {
    alignItems: 'center',
    gap: 2,
  },
  petProgressLabel: {
    ...Typography.label,
    color: Colors.text,
    fontWeight: '600',
  },
  petProgressHint: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    backgroundColor: '#FFF8E1',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  warningBannerText: {
    ...Typography.caption,
    color: Colors.text,
    flex: 1,
    lineHeight: 18,
  },
  successBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  successBtnText: {
    ...Typography.h3,
    color: '#fff',
  },
  quickTakeSection: {
    gap: Spacing.md,
  },
  selectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
  },
  selectedBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  selectedBannerImg: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  selectedBannerName: {
    ...Typography.label,
    color: Colors.text,
    fontWeight: '700',
  },
  selectedBannerSub: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 12,
  },
  locationVerifiedPill: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    backgroundColor: '#E8F5EE',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  locationVerifiedText: {
    fontSize: 11,
    color: Colors.green,
    fontWeight: '700',
  },
  locationVerifyingPill: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    backgroundColor: Colors.warmBackground,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  locationVerifyingText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  photoAddBtn: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  photoAddBtnText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  photoThumbSmall: {
    width: 72,
    height: 72,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  photoThumbSmallImg: {
    width: 72,
    height: 72,
  },
  photoRemoveBtnSmall: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionalLabel: {
    color: Colors.textMuted,
    fontWeight: '400',
    fontSize: 12,
  },
  restaurantSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.warmBackground,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  restaurantSearchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  restaurantNoResults: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  restaurantNoResultsText: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
