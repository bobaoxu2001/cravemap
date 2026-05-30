import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { useAuth } from '../../src/hooks/useAuth';
import {
  getLatestMenuAnalysis,
  runMenuAnalysis,
  StudioNotOnboardedError,
  StudioNoMenuSourceError,
  type StoredAnalysis,
} from '../../src/services/studio/runMenuAnalysis';
import type {
  ContentAngle,
  CustomerPersona,
  RiskNote,
  TopDish,
} from '../../src/services/studio/menuAnalysis';
import { friendlyGeminiMessage } from '../../src/services/studio/gemini';

const STUDIO_BLUE = '#3A3AFF';
const STUDIO_DARK = '#0E0E2A';
const STUDIO_CARD = '#1E1E40';
const STUDIO_BORDER = '#3A3AFF30';
const STUDIO_TEXT_DIM = '#A0A0C8';

type Stage = 'loading' | 'empty' | 'running' | 'result' | 'error';

export default function StudioAnalysis() {
  const router = useRouter();
  const { session, isSupabaseMode } = useAuth();

  const [stage, setStage] = useState<Stage>('loading');
  const [analysis, setAnalysis] = useState<StoredAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const loadExisting = useCallback(async () => {
    if (!isSupabaseMode || !session) {
      setStage('empty');
      return;
    }
    try {
      const existing = await getLatestMenuAnalysis(session.userId);
      if (existing) {
        setAnalysis(existing);
        setStage('result');
      } else {
        setStage('empty');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not load analysis.');
      setStage('error');
    }
  }, [isSupabaseMode, session]);

  useEffect(() => {
    loadExisting();
  }, [loadExisting]);

  const handleRun = async () => {
    if (!isSupabaseMode || !session) {
      setErrorMsg('Please sign in before running an analysis.');
      setStage('error');
      return;
    }
    setStage('running');
    setErrorMsg('');
    try {
      const result = await runMenuAnalysis(session.userId);
      setAnalysis(result);
      setStage('result');
    } catch (err) {
      if (err instanceof StudioNotOnboardedError) {
        setErrorMsg('Complete onboarding first so we have your restaurant info.');
      } else if (err instanceof StudioNoMenuSourceError) {
        setErrorMsg('Submit your menu via onboarding before running an analysis.');
      } else {
        // Map Gemini/network errors to a clean message — err.message embeds raw
        // API response bodies that shouldn't be shown to a merchant.
        setErrorMsg(friendlyGeminiMessage(err));
      }
      setStage('error');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color={STUDIO_TEXT_DIM} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Menu Analysis</Text>
        <View style={{ width: 36 }} />
      </View>

      {stage === 'loading' && (
        <View style={styles.centerState}>
          <ActivityIndicator color={STUDIO_BLUE} size="large" />
          <Text style={styles.centerStateText}>Loading…</Text>
        </View>
      )}

      {stage === 'empty' && <EmptyState onRun={handleRun} />}

      {stage === 'running' && <RunningState />}

      {stage === 'error' && (
        <ErrorState message={errorMsg} onRetry={handleRun} onReload={loadExisting} />
      )}

      {stage === 'result' && analysis && (
        <ResultView
          analysis={analysis}
          onRerun={handleRun}
          onCampaign={() => router.push('/studio/campaign')}
        />
      )}
    </SafeAreaView>
  );
}

// ── State components ──────────────────────────────────────────────────────────

function EmptyState({ onRun }: { onRun: () => void }) {
  const hasKey = Boolean(process.env.EXPO_PUBLIC_GEMINI_API_KEY);
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.emptyHero}>
        <Text style={styles.emptyEmoji}>🧠</Text>
        <Text style={styles.heroTitle}>Ready to analyze your menu?</Text>
        <Text style={styles.heroSub}>
          Gemini will turn your menu and reviews into positioning insights, top dish picks,
          customer personas, content angles, and a list of gaps to address.
        </Text>
      </View>

      {!hasKey && <DemoBanner />}

      <View style={styles.previewList}>
        {[
          ['🎯', 'Positioning summary'],
          ['🍜', 'Top 5 dishes to promote'],
          ['👥', 'Customer personas'],
          ['💲', 'Pricing insights'],
          ['🥗', 'Health & dietary angle'],
          ['📣', 'Content angles for marketing'],
          ['⚠️', 'Risks and missing info'],
        ].map(([icon, label]) => (
          <View key={label} style={styles.previewRow}>
            <Text style={styles.previewIcon}>{icon}</Text>
            <Text style={styles.previewLabel}>{label}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.primaryCta} onPress={onRun} activeOpacity={0.85}>
        <Ionicons name="sparkles-outline" size={18} color="#fff" />
        <Text style={styles.primaryCtaText}>Run AI Analysis</Text>
      </TouchableOpacity>
      <Text style={styles.ctaCaption}>Takes about 30 seconds. Free during beta.</Text>
    </ScrollView>
  );
}

function RunningState() {
  return (
    <View style={styles.centerState}>
      <ActivityIndicator color={STUDIO_BLUE} size="large" />
      <Text style={styles.runningTitle}>Reading your menu…</Text>
      <Text style={styles.runningSub}>
        Gemini is analyzing positioning, dishes, and customer fit.
      </Text>
      <Text style={styles.runningCaption}>Typically takes under 30 seconds.</Text>
    </View>
  );
}

function ErrorState({
  message,
  onRetry,
  onReload,
}: {
  message: string;
  onRetry: () => void;
  onReload: () => void;
}) {
  return (
    <View style={styles.centerState}>
      <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorBody}>{message}</Text>
      <View style={styles.errorActions}>
        <TouchableOpacity style={styles.secondaryCta} onPress={onReload} activeOpacity={0.85}>
          <Text style={styles.secondaryCtaText}>Reload</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryCtaCompact} onPress={onRetry} activeOpacity={0.85}>
          <Ionicons name="refresh" size={16} color="#fff" />
          <Text style={styles.primaryCtaText}>Retry</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Result view ───────────────────────────────────────────────────────────────

function ResultView({
  analysis,
  onRerun,
  onCampaign,
}: {
  analysis: StoredAnalysis;
  onRerun: () => void;
  onCampaign: () => void;
}) {
  const { data } = analysis;
  const formattedDate = new Date(analysis.createdAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {analysis.isDemo && <DemoBanner />}

      {/* Meta */}
      <View style={styles.metaRow}>
        <View style={styles.metaPill}>
          <View style={styles.metaDot} />
          <Text style={styles.metaPillText}>{analysis.modelUsed}</Text>
        </View>
        <Text style={styles.metaTimestamp}>Generated {formattedDate}</Text>
      </View>

      {/* Summary hero */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>POSITIONING SUMMARY</Text>
        <Text style={styles.summaryText}>{data.summary}</Text>
      </View>

      {/* Top dishes */}
      <SectionTitle icon="🍜" title="Top dishes to promote" />
      <View style={{ gap: Spacing.sm }}>
        {data.top_dishes.map((dish, i) => (
          <DishCard key={i} dish={dish} rank={i + 1} />
        ))}
      </View>

      {/* Taste tags */}
      <SectionTitle icon="🏷️" title="Taste tags" />
      <View style={styles.tagRow}>
        {data.taste_tags.map((tag, i) => (
          <View key={i} style={styles.tagChip}>
            <Text style={styles.tagChipText}>{tag}</Text>
          </View>
        ))}
      </View>

      {/* Personas */}
      <SectionTitle icon="👥" title="Customer personas" />
      <View style={{ gap: Spacing.sm }}>
        {data.customer_personas.map((p, i) => (
          <PersonaCard key={i} persona={p} />
        ))}
      </View>

      {/* Pricing */}
      <SectionTitle icon="💲" title="Pricing insights" />
      <View style={styles.subCard}>
        <View style={styles.pricingHeaderRow}>
          <View style={styles.tierBadge}>
            <Text style={styles.tierBadgeText}>{data.pricing_insights.tier}</Text>
          </View>
          <Text style={styles.pricingPositioning}>{data.pricing_insights.positioning}</Text>
        </View>
        <View style={styles.opportunitiesList}>
          {data.pricing_insights.opportunities.map((op, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>{op}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Health */}
      <SectionTitle icon="🥗" title="Health & dietary positioning" />
      <View style={styles.subCard}>
        <ColumnBlock label="Highlights" items={data.health_positioning.highlights} />
        <ColumnBlock label="Dietary options" items={data.health_positioning.dietaryOptions} />
        <ColumnBlock
          label="Safe marketing claims"
          items={data.health_positioning.marketingClaims}
          hideBorder
        />
      </View>

      {/* Content angles */}
      <SectionTitle icon="📣" title="Content angles" />
      <View style={{ gap: Spacing.sm }}>
        {data.content_angles.length === 0 ? (
          <Text style={styles.emptyHint}>No content angles generated.</Text>
        ) : (
          data.content_angles.map((angle, i) => <ContentAngleCard key={i} angle={angle} />)
        )}
      </View>

      {/* Risks */}
      <SectionTitle icon="⚠️" title="Risks & missing info" />
      <View style={{ gap: Spacing.sm }}>
        {data.risks.length === 0 ? (
          <Text style={styles.emptyHint}>No risks flagged.</Text>
        ) : (
          data.risks.map((r, i) => <RiskCard key={i} risk={r} />)
        )}
      </View>

      {/* CTAs */}
      <TouchableOpacity style={styles.campaignCta} onPress={onCampaign} activeOpacity={0.85}>
        <Ionicons name="rocket-outline" size={18} color="#fff" />
        <Text style={styles.primaryCtaText}>Generate Campaign</Text>
        <Ionicons name="arrow-forward" size={16} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.rerunBtn} onPress={onRerun} activeOpacity={0.85}>
        <Ionicons name="refresh" size={15} color={STUDIO_BLUE} />
        <Text style={styles.rerunBtnText}>Re-run analysis</Text>
      </TouchableOpacity>

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionIcon}>{icon}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function DishCard({ dish, rank }: { dish: TopDish; rank: number }) {
  return (
    <View style={styles.dishCard}>
      <View style={styles.dishRankWrap}>
        <Text style={styles.dishRank}>#{rank}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.dishHeader}>
          <Text style={styles.dishName}>{dish.name}</Text>
          <Text style={styles.dishPrice}>{dish.estimatedPrice}</Text>
        </View>
        <Text style={styles.dishAngle}>{dish.marketingAngle}</Text>
        {dish.tags.length > 0 && (
          <View style={styles.dishTagsRow}>
            {dish.tags.map((t, i) => (
              <View key={i} style={styles.dishTag}>
                <Text style={styles.dishTagText}>{t}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function PersonaCard({ persona }: { persona: CustomerPersona }) {
  return (
    <View style={styles.subCard}>
      <Text style={styles.personaName}>{persona.name}</Text>
      <Text style={styles.personaDesc}>{persona.description}</Text>
      {persona.motivations.length > 0 && (
        <View style={styles.personaSection}>
          <Text style={styles.personaSubLabel}>Motivations</Text>
          <Text style={styles.personaSubText}>{persona.motivations.join(' · ')}</Text>
        </View>
      )}
      {persona.recommendedDishes.length > 0 && (
        <View style={styles.personaSection}>
          <Text style={styles.personaSubLabel}>Recommended dishes</Text>
          <Text style={styles.personaSubText}>{persona.recommendedDishes.join(' · ')}</Text>
        </View>
      )}
    </View>
  );
}

function ContentAngleCard({ angle }: { angle: ContentAngle }) {
  return (
    <View style={styles.subCard}>
      <View style={styles.angleHeader}>
        <Text style={styles.angleTheme}>{angle.theme}</Text>
        <View style={styles.formatBadge}>
          <Text style={styles.formatBadgeText}>{angle.suggestedFormat}</Text>
        </View>
      </View>
      <Text style={styles.angleDesc}>{angle.description}</Text>
    </View>
  );
}

function RiskCard({ risk }: { risk: RiskNote }) {
  return (
    <View style={styles.riskCard}>
      <View style={styles.riskHeader}>
        <Ionicons name="warning-outline" size={14} color="#FFB800" />
        <Text style={styles.riskCategory}>{risk.category}</Text>
      </View>
      <Text style={styles.riskDesc}>{risk.description}</Text>
      <Text style={styles.riskRec}>
        <Text style={{ fontWeight: '700', color: '#FFD37A' }}>Recommendation: </Text>
        {risk.recommendation}
      </Text>
    </View>
  );
}

function ColumnBlock({
  label,
  items,
  hideBorder,
}: {
  label: string;
  items: string[];
  hideBorder?: boolean;
}) {
  return (
    <View style={[styles.columnBlock, !hideBorder && styles.columnBlockDivider]}>
      <Text style={styles.columnLabel}>{label}</Text>
      {items.length === 0 ? (
        <Text style={styles.emptyHint}>None listed.</Text>
      ) : (
        items.map((it, i) => (
          <View key={i} style={styles.bulletRow}>
            <View style={styles.bullet} />
            <Text style={styles.bulletText}>{it}</Text>
          </View>
        ))
      )}
    </View>
  );
}

function DemoBanner() {
  return (
    <View style={styles.demoBanner}>
      <Ionicons name="information-circle-outline" size={16} color="#FFB800" />
      <Text style={styles.demoBannerText}>
        Demo mode — add EXPO_PUBLIC_GEMINI_API_KEY to .env to use real Gemini output.
      </Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: STUDIO_DARK,
  },
  blob1: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#3A3AFF18',
  },
  blob2: {
    position: 'absolute',
    bottom: 60,
    left: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.primary + '12',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: '#1E1E40',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: STUDIO_BORDER,
  },
  headerTitle: {
    ...Typography.h3,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  centerStateText: {
    ...Typography.label,
    color: STUDIO_TEXT_DIM,
  },

  // Empty
  emptyHero: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: Spacing.md,
  },
  heroTitle: {
    ...Typography.h1,
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  heroSub: {
    ...Typography.body,
    color: STUDIO_TEXT_DIM,
    textAlign: 'center',
    lineHeight: 22,
  },
  previewList: {
    backgroundColor: STUDIO_CARD,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: STUDIO_BORDER,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  previewIcon: {
    fontSize: 16,
    width: 22,
  },
  previewLabel: {
    ...Typography.label,
    color: '#FFFFFF',
  },
  primaryCta: {
    backgroundColor: STUDIO_BLUE,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    shadowColor: STUDIO_BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryCtaCompact: {
    backgroundColor: STUDIO_BLUE,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  primaryCtaText: {
    ...Typography.h3,
    color: '#fff',
  },
  ctaCaption: {
    ...Typography.caption,
    color: STUDIO_TEXT_DIM,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },

  // Running
  runningTitle: {
    ...Typography.h2,
    color: '#FFFFFF',
    fontWeight: '800',
    marginTop: Spacing.md,
  },
  runningSub: {
    ...Typography.body,
    color: STUDIO_TEXT_DIM,
    textAlign: 'center',
    lineHeight: 22,
  },
  runningCaption: {
    ...Typography.caption,
    color: '#666688',
    marginTop: Spacing.sm,
  },

  // Error
  errorTitle: {
    ...Typography.h2,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  errorBody: {
    ...Typography.body,
    color: STUDIO_TEXT_DIM,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  secondaryCta: {
    backgroundColor: STUDIO_CARD,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: STUDIO_BORDER,
  },
  secondaryCtaText: {
    ...Typography.label,
    color: STUDIO_TEXT_DIM,
    fontWeight: '700',
  },

  // Demo banner
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3A2A0A',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#5A4520',
  },
  demoBannerText: {
    ...Typography.caption,
    color: '#FFD37A',
    flex: 1,
    lineHeight: 17,
  },

  // Meta
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: STUDIO_CARD,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: STUDIO_BORDER,
  },
  metaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#44CC88',
  },
  metaPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: STUDIO_TEXT_DIM,
    letterSpacing: 0.5,
  },
  metaTimestamp: {
    ...Typography.caption,
    color: STUDIO_TEXT_DIM,
  },

  // Summary
  summaryCard: {
    backgroundColor: STUDIO_CARD,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: STUDIO_BORDER,
    marginBottom: Spacing.lg,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#8888FF',
    marginBottom: Spacing.sm,
  },
  summaryText: {
    ...Typography.body,
    color: '#FFFFFF',
    lineHeight: 23,
  },

  // Section
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionIcon: {
    fontSize: 18,
  },
  sectionTitle: {
    ...Typography.h3,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Sub-card
  subCard: {
    backgroundColor: STUDIO_CARD,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: STUDIO_BORDER,
  },

  // Dish
  dishCard: {
    flexDirection: 'row',
    backgroundColor: STUDIO_CARD,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: STUDIO_BORDER,
  },
  dishRankWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: STUDIO_BLUE + '30',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dishRank: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8888FF',
  },
  dishHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: Spacing.sm,
  },
  dishName: {
    ...Typography.label,
    color: '#FFFFFF',
    fontWeight: '700',
    flex: 1,
  },
  dishPrice: {
    ...Typography.label,
    color: '#88CC88',
    fontWeight: '700',
  },
  dishAngle: {
    ...Typography.caption,
    color: STUDIO_TEXT_DIM,
    lineHeight: 18,
    marginBottom: Spacing.xs + 2,
  },
  dishTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  dishTag: {
    backgroundColor: '#14142E',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: STUDIO_BORDER,
  },
  dishTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: STUDIO_TEXT_DIM,
  },

  // Tags
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    backgroundColor: STUDIO_CARD,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 1,
    borderWidth: 1,
    borderColor: STUDIO_BORDER,
  },
  tagChipText: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Persona
  personaName: {
    ...Typography.h3,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 4,
  },
  personaDesc: {
    ...Typography.caption,
    color: STUDIO_TEXT_DIM,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  personaSection: {
    marginTop: Spacing.xs,
  },
  personaSubLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8888FF',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  personaSubText: {
    ...Typography.caption,
    color: '#FFFFFF',
    lineHeight: 18,
  },

  // Pricing
  pricingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  tierBadge: {
    backgroundColor: '#88CC88' + '20',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderWidth: 1,
    borderColor: '#88CC88' + '60',
  },
  tierBadgeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#88CC88',
  },
  pricingPositioning: {
    ...Typography.caption,
    color: '#FFFFFF',
    flex: 1,
    lineHeight: 18,
  },
  opportunitiesList: {
    gap: 6,
  },

  // Bullets
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: STUDIO_BLUE,
    marginTop: 7,
  },
  bulletText: {
    ...Typography.caption,
    color: STUDIO_TEXT_DIM,
    lineHeight: 18,
    flex: 1,
  },

  // Column block
  columnBlock: {
    paddingVertical: Spacing.sm,
  },
  columnBlockDivider: {
    borderBottomWidth: 1,
    borderBottomColor: STUDIO_BORDER,
  },
  columnLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8888FF',
    letterSpacing: 0.5,
    marginBottom: 6,
  },

  // Content angles
  angleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  angleTheme: {
    ...Typography.label,
    color: '#FFFFFF',
    fontWeight: '700',
    flex: 1,
  },
  formatBadge: {
    backgroundColor: STUDIO_BLUE + '25',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  formatBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8888FF',
  },
  angleDesc: {
    ...Typography.caption,
    color: STUDIO_TEXT_DIM,
    lineHeight: 18,
  },

  // Risks
  riskCard: {
    backgroundColor: '#2A2010',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#4A3520',
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  riskCategory: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#FFB800',
    textTransform: 'uppercase',
  },
  riskDesc: {
    ...Typography.caption,
    color: '#FFFFFF',
    lineHeight: 18,
    marginBottom: 4,
  },
  riskRec: {
    ...Typography.caption,
    color: STUDIO_TEXT_DIM,
    lineHeight: 18,
  },

  emptyHint: {
    ...Typography.caption,
    color: '#666688',
    fontStyle: 'italic',
  },

  // CTAs
  campaignCta: {
    backgroundColor: STUDIO_BLUE,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    shadowColor: STUDIO_BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  rerunBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  rerunBtnText: {
    ...Typography.label,
    color: STUDIO_BLUE,
    fontWeight: '700',
  },
});
