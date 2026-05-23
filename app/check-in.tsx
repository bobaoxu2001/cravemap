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
import * as Location from 'expo-location';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { Restaurant } from '../types';
import { getAllRestaurants } from '../src/services/restaurants';
import { createCheckIn } from '../src/services/checkIns';
import { getTastePersona } from '../src/services/profile';
import { useAuth } from '../src/hooks/useAuth';
import ProgressBar from '../components/ProgressBar';
import TagChip from '../components/TagChip';

const DEMO_USER_ID = 'u001';

// Check-in is a post-visit action — users typically post from home or transit
// after a meal, not on-site. Location verification is opt-in (a chip on the
// final step) rather than a required step, so honest after-the-fact posts
// don't get punished while genuine on-site visits can still earn the badge.
const TOTAL_STEPS = 4;
const MAX_PHOTOS = 6;

// A check-in counts as location-verified when the device is within this many
// meters of the restaurant. 200m absorbs typical urban GPS drift (worse
// indoors) while still rejecting a check-in posted from home.
const VERIFY_RADIUS_METERS = 200;
// getCurrentPositionAsync has no built-in timeout and can hang indoors or on
// a simulator with no location set — cap the wait so the UI never sticks.
const LOCATION_TIMEOUT_MS = 12000;

// Great-circle distance in meters between two coordinates (haversine).
function distanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadius = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(a));
}

function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)}m` : `${(meters / 1000).toFixed(1)}km`;
}

// Resolves to a fresh position, or null if the OS doesn't answer in time.
async function getPositionOrTimeout(): Promise<Location.LocationObject | null> {
  return Promise.race([
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), LOCATION_TIMEOUT_MS)),
  ]);
}

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
  const [locationStatus, setLocationStatus] = useState<'idle' | 'verifying' | 'verified' | 'failed'>('idle');
  const [locationMessage, setLocationMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitWarning, setSubmitWarning] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState('');

  const params = useLocalSearchParams<{ restaurantId?: string }>();
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);
  const [restaurantQuery, setRestaurantQuery] = useState('');

  useEffect(() => {
    getAllRestaurants()
      .then((r) => {
        setAllRestaurants(r);
        // Deep-linked from a restaurant page — lock that restaurant in and
        // skip the picker so the user isn't asked to choose it again.
        if (params.restaurantId) {
          const match = r.find((x) => x.id === params.restaurantId);
          if (match) {
            setSelectedRestaurant(match);
            setStep(2);
          }
        }
      })
      .finally(() => setRestaurantsLoading(false));
  }, [params.restaurantId]);

  const toggleTag = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const canNext = () => {
    if (submitting) return false;
    if (step === 1) return selectedRestaurant !== null;
    if (step === 3) return review.length > 10 || selectedTasteTags.length > 0;
    if (step === 4) return hypeRating !== null;
    return true;
  };

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
      setShowSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Check-in failed. Please try again.';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const verifyLocation = async () => {
    if (!selectedRestaurant) return;
    const { latitude, longitude } = selectedRestaurant;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setLocationStatus('failed');
      setLocationMessage(
        "This restaurant has no coordinates on file, so we can't verify it. You can still post your check-in."
      );
      return;
    }

    setLocationStatus('verifying');
    setLocationMessage('');

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('failed');
        setLocationMessage(
          "Location access is off, so we can't confirm you're here. You can still post without the verified badge."
        );
        return;
      }

      const position = await getPositionOrTimeout();
      if (!position) {
        setLocationStatus('failed');
        setLocationMessage(
          "Couldn't get a location fix. Make sure location services are on, then try again, or skip."
        );
        return;
      }

      const distance = distanceInMeters(
        position.coords.latitude,
        position.coords.longitude,
        latitude,
        longitude
      );

      if (distance <= VERIFY_RADIUS_METERS) {
        setLocationStatus('verified');
        setLocationMessage(`Confirmed within ${formatDistance(distance)} of ${selectedRestaurant.name}.`);
      } else {
        setLocationStatus('failed');
        setLocationMessage(
          `You're about ${formatDistance(distance)} from ${selectedRestaurant.name}. Check in on-site to earn the verified badge, or skip.`
        );
      }
    } catch {
      setLocationStatus('failed');
      setLocationMessage(
        "Something went wrong checking your location. You can still post without the verified badge."
      );
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
    'Add photos',
    'Write your review',
    'Rate & tag',
  ];

  if (restaurantsLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const queryTrimmed = restaurantQuery.trim().toLowerCase();
  const filteredRestaurants = queryTrimmed
    ? allRestaurants.filter((r) =>
        r.name.toLowerCase().includes(queryTrimmed) ||
        r.neighborhood.toLowerCase().includes(queryTrimmed) ||
        r.cuisine.toLowerCase().includes(queryTrimmed)
      )
    : allRestaurants;

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

        {/* Step 1: Restaurant selection — searchable list of all restaurants.
            Used to show only the first 6, which made the picker unusable for
            anyone whose target restaurant wasn't in that slice. */}
        {step === 1 && (
          <View style={styles.restaurantList}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                value={restaurantQuery}
                onChangeText={setRestaurantQuery}
                placeholder="Search by name, cuisine, or neighborhood"
                placeholderTextColor={Colors.textMuted}
                autoCorrect={false}
                returnKeyType="search"
              />
              {restaurantQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setRestaurantQuery('')}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                >
                  <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
            {filteredRestaurants.length === 0 ? (
              <Text style={styles.noResults}>No restaurants found. Try a different search.</Text>
            ) : (
              filteredRestaurants.map((r) => (
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
                    <Text style={styles.restaurantOptionAddr} numberOfLines={1}>{r.address}</Text>
                  </View>
                  {selectedRestaurant?.id === r.id && (
                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Step 2: Photos */}
        {step === 2 && (
          <View style={styles.photoSection}>
            {selectedRestaurant && (
              <View style={styles.selectedInfo}>
                <Text style={styles.selectedLabel}>Checking in at</Text>
                <Text style={styles.selectedName}>{selectedRestaurant.name}</Text>
              </View>
            )}
            {photos.length === 0 ? (
              <TouchableOpacity
                style={styles.photoPlaceholder}
                onPress={pickFromLibrary}
                activeOpacity={0.7}
              >
                <Ionicons name="camera-outline" size={40} color={Colors.textMuted} />
                <Text style={styles.photoPlaceholderText}>Tap to add photos</Text>
                <Text style={styles.photoPlaceholderSub}>Photos make your check-in more helpful</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.photoGrid}>
                {photos.map((uri) => (
                  <View key={uri} style={styles.photoThumbWrap}>
                    <Image source={{ uri }} style={styles.photoThumb} />
                    <TouchableOpacity
                      style={styles.photoRemoveBtn}
                      onPress={() => removePhoto(uri)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <TouchableOpacity
                    style={styles.photoAddTile}
                    onPress={pickFromLibrary}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={28} color={Colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            )}
            <View style={styles.photoButtons}>
              <TouchableOpacity
                style={[styles.photoBtn, remainingPhotoSlots <= 0 && styles.photoBtnDisabled]}
                onPress={pickFromCamera}
                disabled={remainingPhotoSlots <= 0}
              >
                <Ionicons name="camera-outline" size={20} color={Colors.primary} />
                <Text style={styles.photoBtnText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.photoBtn, remainingPhotoSlots <= 0 && styles.photoBtnDisabled]}
                onPress={pickFromLibrary}
                disabled={remainingPhotoSlots <= 0}
              >
                <Ionicons name="images-outline" size={20} color={Colors.primary} />
                <Text style={styles.photoBtnText}>Gallery</Text>
              </TouchableOpacity>
            </View>
            {photoError ? (
              <Text style={styles.photoErrorText}>{photoError}</Text>
            ) : (
              <Text style={styles.photoSkipNote}>
                {photos.length > 0
                  ? `${photos.length}/${MAX_PHOTOS} photos selected — you can also skip and post text-only.`
                  : 'You can skip photos and still post your check-in'}
              </Text>
            )}
          </View>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <View style={styles.reviewSection}>
            <Text style={styles.inputLabel}>Your honest review</Text>
            <TextInput
              style={styles.reviewInput}
              placeholder="What made this meal memorable? Be specific — help others decide!"
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={5}
              value={review}
              onChangeText={setReview}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{review.length}/500</Text>

            <Text style={styles.inputLabel}>Taste tags</Text>
            <MultiChips
              options={tasteTags}
              selected={selectedTasteTags}
              onToggle={(v) => toggleTag(selectedTasteTags, setSelectedTasteTags, v)}
              variant="primary"
            />
          </View>
        )}

        {/* Step 4: Diet, scene tags + hype rating */}
        {step === 4 && (
          <View style={styles.tagsSection}>
            <Text style={styles.inputLabel}>Dietary info (optional)</Text>
            <MultiChips
              options={dietTags}
              selected={selectedDietTags}
              onToggle={(v) => toggleTag(selectedDietTags, setSelectedDietTags, v)}
              variant="green"
            />

            <Text style={styles.inputLabel}>Food scene (optional)</Text>
            <MultiChips
              options={sceneTags}
              selected={selectedSceneTags}
              onToggle={(v) => toggleTag(selectedSceneTags, setSelectedSceneTags, v)}
              variant="yellow"
            />

            <Text style={styles.inputLabel}>Was it worth it?</Text>
            <Text style={styles.inputHint}>Helps others decide. Shown next to your check-in.</Text>
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
          </View>
        )}

      </ScrollView>

      {/* Navigation */}
      <View style={styles.navBar}>
        {submitError ? (
          <Text style={styles.submitError}>{submitError}</Text>
        ) : null}

        {/* Opt-in on-site verification — only on the final step. Check-ins
            are post-visit by default; tapping this tries a GPS fix and
            adds the verified badge only if the user is actually at the
            restaurant. After-the-fact posters just hit Post below. */}
        {step === TOTAL_STEPS && locationStatus !== 'verified' && (
          <TouchableOpacity
            style={styles.verifyChip}
            onPress={() => void verifyLocation()}
            disabled={locationStatus === 'verifying'}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Verify I am at this restaurant"
            accessibilityHint="Runs a GPS check and adds the verified badge if you are on-site"
          >
            {locationStatus === 'verifying' ? (
              <>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.verifyChipText}>Checking your location…</Text>
              </>
            ) : locationStatus === 'failed' ? (
              <>
                <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.verifyChipText} numberOfLines={2}>
                  {locationMessage} Tap to retry.
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="location-outline" size={16} color={Colors.primary} />
                <Text style={styles.verifyChipText}>
                  At the restaurant? Tap to verify (+50 bonus)
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {step === TOTAL_STEPS && locationStatus === 'verified' && (
          <View style={[styles.verifyChip, styles.verifyChipVerified]}>
            <Ionicons name="shield-checkmark" size={16} color={Colors.green} />
            <Text style={[styles.verifyChipText, styles.verifyChipTextVerified]}>
              Verified · +50 bonus
            </Text>
          </View>
        )}

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

      {/* Success Modal — minimalist confirmation. Mascot + sparkles removed;
          single line + single CTA. Points/verification still surface as
          quiet supporting text. */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <Ionicons
              name="checkmark-circle"
              size={48}
              color={Colors.green}
              style={{ marginBottom: Spacing.sm }}
            />
            <Text style={styles.successTitle}>Check-in posted</Text>
            <Text style={styles.successSub}>
              {selectedRestaurant?.name}
            </Text>
            {submitWarning ? (
              <Text style={styles.warningBannerText}>{submitWarning}</Text>
            ) : null}
            <Text style={styles.scoutProgress}>
              +200 points{locationStatus === 'verified' ? ' · +50 verified bonus' : ''}
            </Text>
            <TouchableOpacity
              style={styles.successBtn}
              onPress={() => {
                setShowSuccess(false);
                // Pass a flag so Home can show a brief "+200 pts" toast,
                // connecting the action (check-in) to the reward (Scout pts).
                router.replace({
                  pathname: '/(tabs)/home',
                  params: { posted: '1', bonus: locationStatus === 'verified' ? '1' : '0' },
                });
              }}
            >
              <Text style={styles.successBtnText}>Done</Text>
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
  },
  noResults: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
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
  restaurantOptionAddr: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 11,
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
  inputHint: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
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
  verifyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  verifyChipVerified: {
    backgroundColor: '#E8F5EE',
    borderColor: Colors.green,
  },
  verifyChipText: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'center',
  },
  verifyChipTextVerified: {
    color: Colors.green,
    fontWeight: '600',
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
  successTitle: {
    ...Typography.h2,
    color: Colors.text,
  },
  successSub: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  scoutProgress: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
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
});
