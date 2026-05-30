import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import ProgressBar from '../../components/ProgressBar';
import AnimatedMascot from '../../components/AnimatedMascot';
import Sparkles from '../../components/Sparkles';
import { useAuth } from '../../src/hooks/useAuth';
import { completeTastePassport } from '../../src/services/profile';
import type { UpdateTastePassportInput } from '../../src/services/types';

const TOTAL_STEPS = 6;

const cities = [
  { id: 'nyc', label: 'New York City', emoji: '🗽', spots: '10 restaurants' },
  { id: 'la', label: 'Los Angeles', emoji: '🌴', spots: '8 restaurants' },
  { id: 'bay', label: 'Bay Area', emoji: '🌉', spots: '6 restaurants' },
  { id: 'sea', label: 'Seattle', emoji: '🌲', spots: '4 restaurants' },
  { id: 'bos', label: 'Boston', emoji: '🦞', spots: '4 restaurants' },
];

const stepNames = ['City', 'Trust', 'Taste', 'Dislikes', 'Diet', 'Scene'];

function derivePersona(data: { taste: string[]; diet: string[] }): { emoji: string; name: string } {
  const tasteStr = data.taste.join(' ').toLowerCase();
  const diet = data.diet.filter((d) => d !== 'None');
  if (tasteStr.includes('spicy')) return { emoji: '🌶️', name: 'Spicy Adventurer' };
  if (diet.some((d) => ['Vegan', 'Vegetarian', 'Halal', 'Gluten-Free', 'Dairy-Free'].includes(d))) {
    return { emoji: '🥗', name: 'Healthy Foodie' };
  }
  if (data.taste.includes('Comfort Food')) return { emoji: '🍜', name: 'Comfort Seeker' };
  return { emoji: '🍱', name: 'Authentic Explorer' };
}

const trustOptions = [
  'Locals', 'Same culture', 'Similar taste',
  'Same diet', 'Verified visits', 'Anti-hype foodies',
];

const tasteOptions = [
  'Spicy', 'Very Spicy', 'Savory', 'Sweet',
  'Smoky', 'Sour', 'Umami', 'Light', 'Comfort Food', 'Bold Flavor',
];

const dislikeOptions = [
  'Too Sweet', 'Too Salty', 'Too Bland', 'Too Oily',
  'Touristy', 'Overhyped', 'Long Wait', 'Tiny Portions',
];

const dietOptions = [
  'None', 'Vegan', 'Vegetarian', 'Halal',
  'Gluten-Free', 'Dairy-Free', 'High-Protein', 'Low-Carb',
];

const sceneOptions = [
  'Cheap Eats', 'Date Night', 'Group Dinner', 'Late-Night',
  'Study Cafe', 'Work Lunch', 'Brunch', 'Solo Dining',
];

interface StepData {
  city: string;
  trust: string[];
  taste: string[];
  dislikes: string[];
  diet: string[];
  scenes: string[];
}

function MultiSelectChips({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (val: string) => void;
}) {
  return (
    <View style={styles.chipsContainer}>
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

function CityGrid({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  return (
    <View style={styles.cityGrid}>
      {cities.map((c) => {
        const active = selected === c.id;
        return (
          <TouchableOpacity
            key={c.id}
            style={[styles.cityCard, active && styles.cityCardActive]}
            onPress={() => onSelect(c.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.cityEmoji}>{c.emoji}</Text>
            <Text style={[styles.cityLabel, active && styles.cityLabelActive]}>{c.label}</Text>
            <Text style={styles.citySpots}>{c.spots}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TastePassport() {
  const router = useRouter();
  const { isAuthenticated, isSupabaseMode, loading, refreshProfile, session } = useAuth();
  const [step, setStep] = useState(1);
  const [showResult, setShowResult] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [data, setData] = useState<StepData>({
    city: '',
    trust: [],
    taste: [],
    dislikes: [],
    diet: [],
    scenes: [],
  });

  const toggleArr = (key: keyof Pick<StepData, 'trust' | 'taste' | 'dislikes' | 'diet' | 'scenes'>, val: string) => {
    setData((prev) => {
      const arr = prev[key] as string[];
      return {
        ...prev,
        [key]: arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val],
      };
    });
  };

  const canAdvance = () => {
    if (step === 1) return data.city !== '';
    if (step === 2) return data.trust.length > 0;
    if (step === 3) return data.taste.length > 0;
    return true;
  };

  const toTastePassportInput = (): UpdateTastePassportInput => ({
    city: data.city,
    trustSources: data.trust,
    tastePreferences: data.taste,
    dislikes: data.dislikes,
    dietNeeds: data.diet.filter((d) => d !== 'None'),
    foodScenes: data.scenes,
  });

  const finishTastePassport = async () => {
    setSaveError('');
    if (!isSupabaseMode) {
      setShowResult(true);
      setTimeout(() => {
        router.replace('/(tabs)/home');
      }, 4000);
      return;
    }

    if (!session) {
      setSaveError('Please sign in before saving your Taste Passport.');
      return;
    }

    setSaving(true);
    try {
      await completeTastePassport(session.userId, toTastePassportInput());
      await refreshProfile();
      setShowResult(true);
      setTimeout(() => {
        router.replace('/(tabs)/home');
      }, 4000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save your Taste Passport.');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      void finishTastePassport();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  const stepTitles = [
    'Which city are you in?',
    'Who do you trust for food recommendations?',
    'What flavors do you love?',
    "What do you want to avoid?",
    'Any dietary needs?',
    'What food scenes fit you?',
  ];

  const stepSubtitles = [
    'We surface places real locals trust in your area — not tourist traps.',
    'This determines whose check-ins we weight highest in your feed.',
    'We compute a Taste Match % for every restaurant based on this.',
    'Hard filter. Restaurants matching these patterns get pushed down or hidden.',
    'We surface diet-friendly menu items and call out non-compliant restaurants.',
    'Different mood = different recommendation. We learn yours.',
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (isSupabaseMode && !isAuthenticated) {
    return <Redirect href="/onboarding/welcome" />;
  }

  if (showResult) {
    const persona = derivePersona(data);
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.resultContainer}>
          <View style={styles.resultMascotWrap}>
            <Sparkles active emoji="✨" />
            <AnimatedMascot persona={persona.name} size={160} animate pulse />
          </View>
          <View style={styles.resultXPBadge}>
            <Text style={styles.resultXPText}>+200 XP unlocked</Text>
          </View>
          <Text style={styles.resultPersonaEmoji}>{persona.emoji}</Text>
          <Text style={styles.resultPersona}>{persona.name}</Text>
          <Text style={styles.resultSubtitle}>Your CraveMap feed is now personalized. We matched you with restaurants that{' '}
            <Text style={{ fontWeight: '700' }}>other {persona.name}s</Text> love in your city.
          </Text>
          <View style={styles.resultHighlights}>
            {[
              { emoji: '🎯', text: 'Taste Match % calculated for every restaurant' },
              { emoji: '🏘️', text: 'Local-approved feed now unlocked' },
              { emoji: '🏅', text: 'Taste Passport complete — Founding Scout progress updated' },
            ].map((h) => (
              <View key={h.text} style={styles.resultHighlightRow}>
                <Text style={styles.resultHighlightEmoji}>{h.emoji}</Text>
                <Text style={styles.resultHighlightText}>{h.text}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={styles.resultCTA}
            onPress={() => router.replace('/(tabs)/home')}
            activeOpacity={0.85}
          >
            <Text style={styles.resultCTAText}>Start Exploring 🍜</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.stepCounter}>{step} / {TOTAL_STEPS}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <Text style={styles.stepNameLabel}>Step {step} of {TOTAL_STEPS} · {stepNames[step - 1]}</Text>
          <ProgressBar progress={step / TOTAL_STEPS} height={4} />
        </View>

        {/* Content */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Taste Passport</Text>
          </View>
          <View style={styles.stepIllustration}>
            <Text style={styles.stepIllustrationEmoji}>
              {['🏙️', '🤝', '🌶️', '🚫', '🥗', '🌙'][step - 1]}
            </Text>
          </View>
          <Text style={styles.title}>{stepTitles[step - 1]}</Text>
          <Text style={styles.subtitle}>{stepSubtitles[step - 1]}</Text>

          {step === 1 && (
            <>
              <CityGrid selected={data.city} onSelect={(id) => setData({ ...data, city: id })} />
              <Text style={styles.cityFootnote}>
                Don&apos;t see your city? We&apos;re rolling out coverage gradually — pick the closest for now to preview, and we&apos;ll let you know when your city launches.
              </Text>
            </>
          )}
          {step === 2 && (
            <MultiSelectChips options={trustOptions} selected={data.trust} onToggle={(v) => toggleArr('trust', v)} />
          )}
          {step === 3 && (
            <MultiSelectChips options={tasteOptions} selected={data.taste} onToggle={(v) => toggleArr('taste', v)} />
          )}
          {step === 4 && (
            <MultiSelectChips options={dislikeOptions} selected={data.dislikes} onToggle={(v) => toggleArr('dislikes', v)} />
          )}
          {step === 5 && (
            <MultiSelectChips options={dietOptions} selected={data.diet} onToggle={(v) => toggleArr('diet', v)} />
          )}
          {step === 6 && (
            <MultiSelectChips options={sceneOptions} selected={data.scenes} onToggle={(v) => toggleArr('scenes', v)} />
          )}
        </ScrollView>

        {/* Navigation */}
        <View style={styles.navContainer}>
          <TouchableOpacity
            style={[styles.nextButton, !canAdvance() && styles.nextButtonDisabled]}
            onPress={handleNext}
            activeOpacity={0.85}
            disabled={!canAdvance() || saving}
          >
            <Text style={styles.nextButtonText}>
              {saving ? 'Saving...' : step === TOTAL_STEPS ? 'See My Recommendations 🍽️' : 'Next →'}
            </Text>
          </TouchableOpacity>
          {!canAdvance() && step === 1 && (
            <Text style={styles.nudgeText}>Pick your city to continue</Text>
          )}
          {!canAdvance() && step === 2 && (
            <Text style={styles.nudgeText}>Select at least one source you trust</Text>
          )}
          {!canAdvance() && step === 3 && (
            <Text style={styles.nudgeText}>Pick at least one flavor you love</Text>
          )}
          {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
          {step < TOTAL_STEPS && step >= 4 && (
            <TouchableOpacity onPress={handleNext} style={styles.skipBtn} disabled={saving}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCounter: {
    ...Typography.label,
    color: Colors.textMuted,
  },
  progressContainer: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.md,
  },
  badgeText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
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
  cityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  cityCard: {
    width: '47%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  cityCardActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.primary,
    transform: [{ scale: 1.02 }],
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  citySpots: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  stepNameLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  resultMascotWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
    marginBottom: Spacing.sm,
  },
  resultXPBadge: {
    backgroundColor: '#F0FBF5',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.green + '40',
  },
  resultXPText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.green,
  },
  resultPersonaEmoji: {
    fontSize: 42,
    marginBottom: 4,
  },
  resultPersona: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  resultSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 4,
  },
  resultHighlights: {
    width: '100%',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  resultHighlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.warmBackground,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  resultHighlightEmoji: {
    fontSize: 18,
  },
  resultHighlightText: {
    ...Typography.caption,
    color: Colors.text,
    flex: 1,
    fontWeight: '500',
  },
  resultCTA: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  resultCTAText: {
    ...Typography.h3,
    color: '#fff',
    fontWeight: '800',
  },
  stepIllustration: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  stepIllustrationEmoji: {
    fontSize: 56,
  },
  cityEmoji: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  cityLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  cityLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  cityFootnote: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.md,
    lineHeight: 18,
  },
  navContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  nextButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: Colors.border,
  },
  nextButtonText: {
    ...Typography.h3,
    color: '#fff',
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  skipText: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  nudgeText: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    textAlign: 'center',
    lineHeight: 18,
  },
});
