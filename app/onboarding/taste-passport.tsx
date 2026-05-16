import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import ProgressBar from '../../components/ProgressBar';

const TOTAL_STEPS = 6;

const cities = [
  { id: 'nyc', label: 'New York City', emoji: '🗽' },
  { id: 'la', label: 'Los Angeles', emoji: '🌴' },
  { id: 'bay', label: 'Bay Area', emoji: '🌉' },
  { id: 'sea', label: 'Seattle', emoji: '🌲' },
  { id: 'bos', label: 'Boston', emoji: '🦞' },
];

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
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TastePassport() {
  const router = useRouter();
  const [step, setStep] = useState(1);
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

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      router.replace('/(tabs)/home');
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
    'We will personalize recommendations for your area',
    'Choose all that apply',
    'Pick everything that sounds delicious',
    'We will filter these out for you',
    "We'll show you diet-friendly options",
    'Find the right vibe for every occasion',
  ];

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
          <ProgressBar progress={step / TOTAL_STEPS} height={4} />
        </View>

        {/* Content */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>🛂 Taste Passport</Text>
          </View>
          <Text style={styles.title}>{stepTitles[step - 1]}</Text>
          <Text style={styles.subtitle}>{stepSubtitles[step - 1]}</Text>

          {step === 1 && (
            <CityGrid selected={data.city} onSelect={(id) => setData({ ...data, city: id })} />
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
            disabled={!canAdvance()}
          >
            <Text style={styles.nextButtonText}>
              {step === TOTAL_STEPS ? 'See My Recommendations 🍽️' : 'Next →'}
            </Text>
          </TouchableOpacity>
          {step < TOTAL_STEPS && step >= 4 && (
            <TouchableOpacity onPress={handleNext} style={styles.skipBtn}>
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
});
