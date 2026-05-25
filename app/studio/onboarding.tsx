import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { useAuth } from '../../src/hooks/useAuth';
import { saveMerchantOnboarding } from '../../src/services/studio/merchantOnboarding';
import type { MerchantOnboardingInput } from '../../src/services/studio/merchantOnboarding';

// ── Constants ─────────────────────────────────────────────────────────────────

const STUDIO_BLUE = '#3A3AFF';
const STUDIO_BG = '#F5F5FF';
const STUDIO_BORDER = '#D0D0FF';
const TOTAL_STEPS = 3;

const TARGET_CUSTOMER_OPTIONS = [
  { id: 'students', label: 'Students', emoji: '🎓' },
  { id: 'office_lunch', label: 'Office lunch', emoji: '💼' },
  { id: 'families', label: 'Families', emoji: '👨‍👩‍👧' },
  { id: 'date_night', label: 'Date night', emoji: '🕯️' },
  { id: 'late_night', label: 'Late night', emoji: '🌙' },
  { id: 'healthy', label: 'Healthy eaters', emoji: '🥗' },
  { id: 'budget', label: 'Budget meals', emoji: '💰' },
  { id: 'foodies', label: 'Foodies', emoji: '🍽️' },
];

// ── Form state ────────────────────────────────────────────────────────────────

interface FormData {
  restaurantName: string;
  ownerName: string;
  ownerEmail: string;
  city: string;
  cuisineType: string;
  websiteUrl: string;
  googleMapsUrl: string;
  instagramUrl: string;
  menuText: string;
  reviewSnippets: string;
  targetCustomers: string[];
}

const EMPTY_FORM: FormData = {
  restaurantName: '',
  ownerName: '',
  ownerEmail: '',
  city: '',
  cuisineType: '',
  websiteUrl: '',
  googleMapsUrl: '',
  instagramUrl: '',
  menuText: '',
  reviewSnippets: '',
  targetCustomers: [],
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StudioInput({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  optional = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  error,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  multiline?: boolean;
  optional?: boolean;
  keyboardType?: 'default' | 'email-address' | 'url';
  autoCapitalize?: 'none' | 'sentences' | 'words';
  error?: string;
}) {
  return (
    <View style={inputStyles.wrapper}>
      <View style={inputStyles.labelRow}>
        <Text style={inputStyles.label}>{label}</Text>
        {optional && <Text style={inputStyles.optional}>optional</Text>}
      </View>
      <TextInput
        style={[
          inputStyles.input,
          multiline && inputStyles.multiline,
          error ? inputStyles.inputError : undefined,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        multiline={multiline}
        numberOfLines={multiline ? 6 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
      />
      {error ? <Text style={inputStyles.errorText}>{error}</Text> : null}
    </View>
  );
}

const inputStyles = StyleSheet.create({
  wrapper: { gap: 6 },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    ...Typography.label,
    color: '#1A1A3E',
    fontWeight: '600',
  },
  optional: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: STUDIO_BORDER,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    ...Typography.body,
    color: Colors.text,
  },
  multiline: {
    height: 140,
    paddingTop: Spacing.sm + 2,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
  },
});

function CustomerChip({
  option,
  selected,
  onToggle,
}: {
  option: (typeof TARGET_CUSTOMER_OPTIONS)[0];
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      style={[chipStyles.chip, selected && chipStyles.chipActive]}
      onPress={onToggle}
      activeOpacity={0.75}
    >
      <Text style={chipStyles.emoji}>{option.emoji}</Text>
      <Text style={[chipStyles.label, selected && chipStyles.labelActive]}>{option.label}</Text>
    </TouchableOpacity>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: STUDIO_BORDER,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  chipActive: {
    backgroundColor: STUDIO_BLUE,
    borderColor: STUDIO_BLUE,
  },
  emoji: { fontSize: 15 },
  label: {
    ...Typography.label,
    color: '#1A1A3E',
  },
  labelActive: {
    color: '#FFFFFF',
  },
});

// ── Validation ────────────────────────────────────────────────────────────────

function validateStep(step: number, data: FormData): Record<string, string> {
  const errors: Record<string, string> = {};
  if (step === 1) {
    if (!data.restaurantName.trim()) errors.restaurantName = 'Restaurant name is required.';
    if (!data.ownerName.trim()) errors.ownerName = 'Your name is required.';
    if (!data.ownerEmail.trim()) {
      errors.ownerEmail = 'Email is required.';
    } else if (!data.ownerEmail.includes('@')) {
      errors.ownerEmail = 'Enter a valid email address.';
    }
    if (!data.city.trim()) errors.city = 'City is required.';
    if (!data.cuisineType.trim()) errors.cuisineType = 'Cuisine type is required.';
  }
  if (step === 2) {
    if (data.menuText.trim().length < 30) {
      errors.menuText =
        'Please paste at least 30 characters of menu content so the AI has something to work with.';
    }
  }
  if (step === 3) {
    if (data.targetCustomers.length === 0) {
      errors.targetCustomers = 'Pick at least one customer type.';
    }
  }
  return errors;
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function StudioOnboarding() {
  const router = useRouter();
  const { session, isSupabaseMode } = useAuth();
  const scrollRef = useRef<ScrollView>(null);

  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [done, setDone] = useState(false);

  const set = (key: keyof FormData) => (value: string) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const toggleCustomer = (id: string) =>
    setData((prev) => ({
      ...prev,
      targetCustomers: prev.targetCustomers.includes(id)
        ? prev.targetCustomers.filter((c) => c !== id)
        : [...prev.targetCustomers, id],
    }));

  const handleNext = () => {
    const errs = validateStep(step, data);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStep((s) => s + 1);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const handleBack = () => {
    setErrors({});
    if (step === 1) {
      router.back();
    } else {
      setStep((s) => s - 1);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  };

  const handleSubmit = async () => {
    const errs = validateStep(3, data);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    if (!isSupabaseMode) {
      setDone(true);
      setTimeout(() => router.replace('/studio/dashboard'), 1200);
      return;
    }

    if (!session) {
      setSubmitError('Please sign in before submitting. Tap Back and sign in through the diner flow.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    const input: MerchantOnboardingInput = {
      restaurantName: data.restaurantName,
      ownerName: data.ownerName,
      ownerEmail: data.ownerEmail,
      city: data.city,
      cuisineType: data.cuisineType,
      websiteUrl: data.websiteUrl || undefined,
      googleMapsUrl: data.googleMapsUrl || undefined,
      instagramUrl: data.instagramUrl || undefined,
      menuText: data.menuText,
      reviewSnippets: data.reviewSnippets || undefined,
      targetCustomers: data.targetCustomers,
    };

    try {
      await saveMerchantOnboarding(session.userId, input);
      setDone(true);
      setTimeout(() => router.replace('/studio/dashboard'), 1400);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (done) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={styles.successTitle}>You're all set!</Text>
          <Text style={styles.successSub}>
            Preparing your first AI analysis…
          </Text>
          <ActivityIndicator color={STUDIO_BLUE} style={{ marginTop: Spacing.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  const progress = step / TOTAL_STEPS;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color="#1A1A3E" />
          </TouchableOpacity>
          <View style={styles.stepPill}>
            <Text style={styles.stepPillText}>Step {step} of {TOTAL_STEPS}</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Step 1: Restaurant ── */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepHero}>
                <Text style={styles.stepEmoji}>🏪</Text>
                <Text style={styles.stepTitle}>Tell us about your place</Text>
                <Text style={styles.stepSub}>
                  Basic info so we know who we're working with.
                </Text>
              </View>

              <View style={styles.fields}>
                <StudioInput
                  label="Restaurant name"
                  value={data.restaurantName}
                  onChangeText={set('restaurantName')}
                  placeholder="e.g. Mama Liu's Noodle House"
                  autoCapitalize="words"
                  error={errors.restaurantName}
                />
                <StudioInput
                  label="Your name"
                  value={data.ownerName}
                  onChangeText={set('ownerName')}
                  placeholder="e.g. Sarah Liu"
                  autoCapitalize="words"
                  error={errors.ownerName}
                />
                <StudioInput
                  label="Your email"
                  value={data.ownerEmail}
                  onChangeText={set('ownerEmail')}
                  placeholder="sarah@mamaliu.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.ownerEmail}
                />
                <StudioInput
                  label="City"
                  value={data.city}
                  onChangeText={set('city')}
                  placeholder="e.g. New York City"
                  autoCapitalize="words"
                  error={errors.city}
                />
                <StudioInput
                  label="Cuisine type"
                  value={data.cuisineType}
                  onChangeText={set('cuisineType')}
                  placeholder="e.g. Chinese, Italian, Mexican…"
                  autoCapitalize="words"
                  error={errors.cuisineType}
                />

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerLabel}>Your online presence</Text>
                  <View style={styles.dividerLine} />
                </View>

                <StudioInput
                  label="Website"
                  value={data.websiteUrl}
                  onChangeText={set('websiteUrl')}
                  placeholder="https://mamaliu.com"
                  keyboardType="url"
                  autoCapitalize="none"
                  optional
                />
                <StudioInput
                  label="Google Maps link"
                  value={data.googleMapsUrl}
                  onChangeText={set('googleMapsUrl')}
                  placeholder="https://maps.google.com/…"
                  keyboardType="url"
                  autoCapitalize="none"
                  optional
                />
                <StudioInput
                  label="Instagram"
                  value={data.instagramUrl}
                  onChangeText={set('instagramUrl')}
                  placeholder="https://instagram.com/mamaliunyc"
                  keyboardType="url"
                  autoCapitalize="none"
                  optional
                />
              </View>
            </View>
          )}

          {/* ── Step 2: Content ── */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepHero}>
                <Text style={styles.stepEmoji}>📋</Text>
                <Text style={styles.stepTitle}>Feed the AI your content</Text>
                <Text style={styles.stepSub}>
                  Paste your menu and any customer reviews. The AI will turn them into insights and campaigns.
                </Text>
              </View>

              <View style={styles.tipCard}>
                <Ionicons name="bulb-outline" size={16} color={STUDIO_BLUE} />
                <Text style={styles.tipText}>
                  The more detail you add, the better the AI output. Even a rough menu copy-paste works great.
                </Text>
              </View>

              <View style={styles.fields}>
                <StudioInput
                  label="Menu content"
                  value={data.menuText}
                  onChangeText={set('menuText')}
                  placeholder={`Paste your full menu here — dish names, descriptions, prices.\n\nExample:\nBroken Yolk Benedict  $16\nTwo poached eggs, Canadian bacon, housemade hollandaise…`}
                  multiline
                  error={errors.menuText}
                />
                <StudioInput
                  label="Customer reviews or feedback"
                  value={data.reviewSnippets}
                  onChangeText={set('reviewSnippets')}
                  placeholder={`Paste snippets from Yelp, Google, DMs — anything your customers have said.\n\n"Best ramen I've had outside of Japan…"\n"The service was a bit slow but the food made up for it."`}
                  multiline
                  optional
                />
              </View>
            </View>
          )}

          {/* ── Step 3: Target customers ── */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepHero}>
                <Text style={styles.stepEmoji}>🎯</Text>
                <Text style={styles.stepTitle}>Who's your crowd?</Text>
                <Text style={styles.stepSub}>
                  The AI will tailor its campaigns and insights to reach the people most likely to love your restaurant.
                </Text>
              </View>

              <View style={styles.chipsGrid}>
                {TARGET_CUSTOMER_OPTIONS.map((opt) => (
                  <CustomerChip
                    key={opt.id}
                    option={opt}
                    selected={data.targetCustomers.includes(opt.id)}
                    onToggle={() => toggleCustomer(opt.id)}
                  />
                ))}
              </View>
              {errors.targetCustomers ? (
                <Text style={styles.chipsError}>{errors.targetCustomers}</Text>
              ) : null}

              {submitError ? (
                <View style={styles.submitErrorCard}>
                  <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
                  <Text style={styles.submitErrorText}>{submitError}</Text>
                </View>
              ) : null}
            </View>
          )}

          {/* ── CTA ── */}
          <View style={styles.ctaRow}>
            {step < TOTAL_STEPS ? (
              <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
                <Text style={styles.nextBtnText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.nextBtn, submitting && styles.nextBtnDisabled]}
                onPress={handleSubmit}
                activeOpacity={0.85}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.nextBtnText}>Generate My First AI Analysis</Text>
                    <Ionicons name="sparkles-outline" size={18} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: STUDIO_BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: STUDIO_BORDER,
  },
  stepPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 1,
    borderWidth: 1,
    borderColor: STUDIO_BORDER,
  },
  stepPillText: {
    ...Typography.caption,
    color: '#4444AA',
    fontWeight: '700',
  },
  progressTrack: {
    height: 3,
    backgroundColor: STUDIO_BORDER,
    marginHorizontal: Spacing.md,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: 3,
    backgroundColor: STUDIO_BLUE,
    borderRadius: 2,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
  },
  stepContainer: {
    paddingTop: Spacing.md,
    gap: Spacing.lg,
  },
  stepHero: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  stepEmoji: {
    fontSize: 40,
    marginBottom: Spacing.xs,
  },
  stepTitle: {
    ...Typography.h2,
    color: '#0E0E2A',
    textAlign: 'center',
    fontWeight: '800',
  },
  stepSub: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.md,
  },
  fields: {
    gap: Spacing.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: STUDIO_BORDER,
  },
  dividerLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: '#EEEEFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: STUDIO_BORDER,
  },
  tipText: {
    ...Typography.caption,
    color: '#3333AA',
    lineHeight: 18,
    flex: 1,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chipsError: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: -Spacing.sm,
  },
  submitErrorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: '#FFF5F5',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.error + '40',
  },
  submitErrorText: {
    ...Typography.caption,
    color: Colors.error,
    lineHeight: 18,
    flex: 1,
  },
  ctaRow: {
    marginTop: Spacing.xl,
  },
  nextBtn: {
    backgroundColor: STUDIO_BLUE,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    shadowColor: STUDIO_BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  nextBtnDisabled: {
    opacity: 0.65,
  },
  nextBtnText: {
    ...Typography.h3,
    color: '#fff',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    backgroundColor: STUDIO_BG,
  },
  successEmoji: {
    fontSize: 64,
  },
  successTitle: {
    ...Typography.h1,
    color: '#0E0E2A',
    fontWeight: '800',
  },
  successSub: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
