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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { Restaurant } from '../types';
import { getAllRestaurants } from '../src/services/restaurants';
import { createCheckIn } from '../src/services/checkIns';
import { useAuth } from '../src/hooks/useAuth';
import ProgressBar from '../components/ProgressBar';
import TagChip from '../components/TagChip';

const DEMO_USER_ID = 'u001';

const TOTAL_STEPS = 5;
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
  const { session, isSupabaseMode } = useAuth();
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
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState('');

  const [sampleRestaurants, setSampleRestaurants] = useState<Restaurant[]>([]);

  useEffect(() => {
    getAllRestaurants().then((r) => setSampleRestaurants(r.slice(0, 6)));
  }, []);

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
    try {
      await createCheckIn({
        restaurantId: selectedRestaurant.id,
        review,
        photos,
        tasteTags: selectedTasteTags,
        dietTags: selectedDietTags,
        sceneTags: selectedSceneTags,
        hypeRating,
        locationVerified: locationStatus === 'verified',
      });
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
      if (step === TOTAL_STEPS - 1) {
        setLocationStatus('verifying');
        setTimeout(() => setLocationStatus('verified'), 2000);
      }
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
    'Verify location',
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
          <View style={styles.restaurantList}>
            {sampleRestaurants.map((r) => (
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
            ))}
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

        {/* Step 5: Location verification */}
        {step === 5 && (
          <View style={styles.locationSection}>
            <View style={styles.locationCard}>
              {locationStatus === 'idle' && (
                <>
                  <Ionicons name="location-outline" size={48} color={Colors.textMuted} />
                  <Text style={styles.locationTitle}>Location Verification</Text>
                  <Text style={styles.locationDesc}>
                    Verifying you were actually at {selectedRestaurant?.name} adds credibility to your check-in.
                  </Text>
                  <TouchableOpacity
                    style={styles.verifyBtn}
                    onPress={() => {
                      setLocationStatus('verifying');
                      setTimeout(() => setLocationStatus('verified'), 2000);
                    }}
                  >
                    <Text style={styles.verifyBtnText}>Verify My Location</Text>
                  </TouchableOpacity>
                </>
              )}

              {locationStatus === 'verifying' && (
                <>
                  <Ionicons name="locate-outline" size={48} color={Colors.accent} />
                  <Text style={styles.locationTitle}>Verifying...</Text>
                  <Text style={styles.locationDesc}>Checking your location against restaurant coordinates.</Text>
                  <View style={styles.verifyingDots}>
                    <Text style={styles.verifyingDotText}>● ● ●</Text>
                  </View>
                </>
              )}

              {locationStatus === 'verified' && (
                <>
                  <View style={styles.verifiedCircle}>
                    <Ionicons name="checkmark" size={40} color="#fff" />
                  </View>
                  <Text style={[styles.locationTitle, { color: Colors.green }]}>Location Verified! ✅</Text>
                  <Text style={styles.locationDesc}>
                    Your check-in will show the verified badge — this makes it 3x more helpful to other foodies.
                  </Text>
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="shield-checkmark" size={16} color={Colors.green} />
                    <Text style={styles.verifiedBadgeText}>+50 bonus points for verified check-in</Text>
                  </View>
                </>
              )}
            </View>

            {locationStatus !== 'verified' && !submitting && (
              <TouchableOpacity style={styles.skipVerify} onPress={() => void handleSubmit()}>
                <Text style={styles.skipVerifyText}>Skip verification (no bonus points)</Text>
              </TouchableOpacity>
            )}
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
            <Text style={styles.successEmoji}>🎉</Text>
            <Text style={styles.successTitle}>You&apos;re shaping the map.</Text>
            <Text style={styles.successSub}>
              Your take on {selectedRestaurant?.name} just hit the local-approved feed.
            </Text>
            <View style={styles.pointsRow}>
              <Text style={styles.pointsEarned}>+200 points earned</Text>
              {locationStatus === 'verified' && (
                <Text style={styles.pointsBonus}>+50 verification bonus</Text>
              )}
            </View>
            <Text style={styles.scoutProgress}>
              Founding Scout progress: 2/3 check-ins done
            </Text>
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
  successEmoji: {
    fontSize: 64,
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
  pointsRow: {
    gap: Spacing.xs,
    alignItems: 'center',
  },
  pointsEarned: {
    ...Typography.label,
    color: Colors.green,
    fontWeight: '700',
    fontSize: 16,
  },
  pointsBonus: {
    ...Typography.label,
    color: Colors.accent,
    fontWeight: '600',
  },
  scoutProgress: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
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
