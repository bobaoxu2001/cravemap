import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Colors, Spacing, Typography } from '../../constants/theme';
import { useAuth } from '../../src/hooks/useAuth';
import {
  getLatestCampaign,
  runCampaignGeneration,
  StudioNoAnalysisError,
  type StoredCampaign,
} from '../../src/services/studio/runCampaignGeneration';
import type {
  ContentCalendarItem,
  InstagramCaption,
  RecommendationCard,
  VideoScript,
} from '../../src/services/studio/campaignGeneration';
import { friendlyGeminiMessage } from '../../src/services/studio/gemini';

// ── Theme ─────────────────────────────────────────────────────────────────────

const S = {
  blue: '#3A3AFF',
  dark: '#0E0E2A',
  card: '#1E1E40',
  border: '#3A3AFF30',
  dim: '#A0A0C8',
  green: '#44CC88',
  amber: '#FFB800',
  pink: '#FF5A8A',
};

const CHANNEL_COLORS: Record<string, string> = {
  instagram: '#E1306C',
  tiktok: '#69C9D0',
  facebook: '#1877F2',
  email: '#44CC88',
};

type Stage = 'loading' | 'empty' | 'running' | 'result' | 'error';

// ── Copy helper ───────────────────────────────────────────────────────────────

async function shareText(text: string): Promise<void> {
  try {
    await Share.share({ message: text });
  } catch {
    // silently ignore if user cancels
  }
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function StudioCampaign() {
  const router = useRouter();
  const { session, isSupabaseMode } = useAuth();

  const [stage, setStage] = useState<Stage>('loading');
  const [campaign, setCampaign] = useState<StoredCampaign | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const loadExisting = useCallback(async () => {
    if (!isSupabaseMode || !session) {
      setStage('empty');
      return;
    }
    try {
      const existing = await getLatestCampaign(session.userId);
      if (existing) {
        setCampaign(existing);
        setStage('result');
      } else {
        setStage('empty');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not load campaign.');
      setStage('error');
    }
  }, [isSupabaseMode, session]);

  useEffect(() => {
    loadExisting();
  }, [loadExisting]);

  const handleRun = async () => {
    if (!isSupabaseMode || !session) {
      setErrorMsg('Please sign in before generating a campaign.');
      setStage('error');
      return;
    }
    setStage('running');
    setErrorMsg('');
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    try {
      const result = await runCampaignGeneration(session.userId);
      setCampaign(result);
      setStage('result');
    } catch (err) {
      if (err instanceof StudioNoAnalysisError) {
        setErrorMsg('Run your AI menu analysis first — the campaign generator needs those insights.');
      } else {
        // Clean message — err.message embeds raw Gemini API bodies.
        setErrorMsg(friendlyGeminiMessage(err));
      }
      setStage('error');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={18} color={S.dim} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Campaign Generator</Text>
        <View style={{ width: 36 }} />
      </View>

      {stage === 'loading' && (
        <View style={styles.centerState}>
          <ActivityIndicator color={S.blue} size="large" />
        </View>
      )}

      {stage === 'empty' && <EmptyState onRun={handleRun} onAnalysis={() => router.push('/studio/analysis')} />}

      {stage === 'running' && <RunningState />}

      {stage === 'error' && (
        <ErrorState
          message={errorMsg}
          onRetry={handleRun}
          showAnalysisLink={errorMsg.includes('analysis')}
          onAnalysis={() => router.push('/studio/analysis')}
        />
      )}

      {stage === 'result' && campaign && (
        <ResultView
          scrollRef={scrollRef}
          campaign={campaign}
          onRerun={handleRun}
        />
      )}
    </SafeAreaView>
  );
}

// ── State screens ─────────────────────────────────────────────────────────────

function EmptyState({
  onRun,
  onAnalysis,
}: {
  onRun: () => void;
  onAnalysis: () => void;
}) {
  const hasKey = Boolean(process.env.EXPO_PUBLIC_GEMINI_API_KEY);
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.heroWrap}>
        <Text style={styles.heroEmoji}>📣</Text>
        <Text style={styles.heroTitle}>7-Day Campaign,{'\n'}generated in seconds.</Text>
        <Text style={styles.heroSub}>
          CraveMap Studio uses your menu analysis to write a full week of content — captions, video scripts, and recommendation cards ready to post.
        </Text>
      </View>

      {!hasKey && <DemoBanner />}

      <View style={styles.deliverableList}>
        {[
          ['📅', '7-day content calendar'],
          ['🎬', 'TikTok / Reels video scripts'],
          ['📸', 'Instagram captions + hashtags'],
          ['🃏', 'CraveMap recommendation cards'],
          ['🎯', 'Target segment per day'],
          ['📢', 'CTA for every post'],
        ].map(([icon, label]) => (
          <View key={label} style={styles.deliverableRow}>
            <Text style={styles.deliverableIcon}>{icon}</Text>
            <Text style={styles.deliverableLabel}>{label}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.primaryCta} onPress={onRun} activeOpacity={0.85}>
        <Ionicons name="rocket-outline" size={18} color="#fff" />
        <Text style={styles.primaryCtaText}>Generate My 7-Day Campaign</Text>
      </TouchableOpacity>
      <Text style={styles.ctaCaption}>Requires a completed AI menu analysis.</Text>

      <TouchableOpacity style={styles.linkBtn} onPress={onAnalysis} activeOpacity={0.7}>
        <Ionicons name="arrow-back-outline" size={14} color={S.dim} />
        <Text style={styles.linkBtnText}>Run menu analysis first</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function RunningState() {
  return (
    <View style={styles.centerState}>
      <ActivityIndicator color={S.blue} size="large" />
      <Text style={styles.runningTitle}>Building your campaign…</Text>
      <Text style={styles.runningSub}>Writing captions, scripts, and calendar posts.</Text>
      <Text style={styles.runningCaption}>Usually takes under 30 seconds.</Text>
    </View>
  );
}

function ErrorState({
  message,
  onRetry,
  showAnalysisLink,
  onAnalysis,
}: {
  message: string;
  onRetry: () => void;
  showAnalysisLink: boolean;
  onAnalysis: () => void;
}) {
  return (
    <View style={styles.centerState}>
      <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
      <Text style={styles.errorTitle}>Couldn't generate campaign</Text>
      <Text style={styles.errorBody}>{message}</Text>
      <View style={styles.errorActions}>
        {showAnalysisLink && (
          <TouchableOpacity style={styles.secondaryCta} onPress={onAnalysis} activeOpacity={0.85}>
            <Text style={styles.secondaryCtaText}>Go to Analysis</Text>
          </TouchableOpacity>
        )}
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
  campaign,
  onRerun,
  scrollRef,
}: {
  campaign: StoredCampaign;
  onRerun: () => void;
  scrollRef: React.RefObject<ScrollView | null>;
}) {
  const { data } = campaign;
  const formattedDate = new Date(campaign.createdAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {campaign.isDemo && <DemoBanner />}

      {/* Campaign header — screenshot target #1 */}
      <View style={styles.campaignHeader}>
        <View style={styles.campaignMeta}>
          <View style={styles.metaPill}>
            <View style={styles.metaDot} />
            <Text style={styles.metaPillText}>{campaign.modelUsed}</Text>
          </View>
          <Text style={styles.metaTimestamp}>{formattedDate}</Text>
        </View>
        <Text style={styles.campaignTitle}>{data.campaign_title}</Text>
        <View style={styles.goalRow}>
          <Ionicons name="flag-outline" size={14} color={S.dim} />
          <Text style={styles.goalText}>{data.campaign_goal}</Text>
        </View>
      </View>

      {/* 7-Day content calendar — screenshot target #2 */}
      <SectionTitle icon="📅" title="7-Day Content Calendar" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.calendarScroll}
      >
        {data.content_calendar.map((item, i) => (
          <DayCard key={i} item={item} dayNum={i + 1} />
        ))}
      </ScrollView>

      {/* Video scripts — screenshot target #3 */}
      <SectionTitle icon="🎬" title="Short Video Scripts" />
      <View style={{ gap: Spacing.md }}>
        {data.short_video_scripts.map((script, i) => (
          <VideoScriptCard key={i} script={script} />
        ))}
      </View>

      {/* Instagram captions — screenshot target #4 */}
      <SectionTitle icon="📸" title="Instagram Captions" />
      <View style={{ gap: Spacing.sm }}>
        {data.instagram_captions.map((cap, i) => (
          <CaptionCard key={i} caption={cap} />
        ))}
      </View>

      {/* Recommendation cards — screenshot target #5 */}
      <SectionTitle icon="🃏" title="CraveMap Recommendation Cards" />
      <View style={{ gap: Spacing.sm }}>
        {data.recommendation_cards.map((card, i) => (
          <RecommendationCardView key={i} card={card} />
        ))}
      </View>

      {/* Re-run */}
      <TouchableOpacity style={styles.rerunBtn} onPress={onRerun} activeOpacity={0.85}>
        <Ionicons name="refresh" size={15} color={S.blue} />
        <Text style={styles.rerunBtnText}>Regenerate campaign</Text>
      </TouchableOpacity>

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
}

// ── Day card (horizontal calendar) ───────────────────────────────────────────

function DayCard({ item, dayNum }: { item: ContentCalendarItem; dayNum: number }) {
  const channelColor = CHANNEL_COLORS[item.channel.toLowerCase()] ?? S.blue;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = `${item.caption}\n\n${item.hashtags.join(' ')}\n\n${item.cta}`;
    await shareText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.dayCard}>
      {/* Day header */}
      <View style={styles.dayHeader}>
        <View style={[styles.dayNumBadge, { backgroundColor: channelColor + '25' }]}>
          <Text style={[styles.dayNum, { color: channelColor }]}>{dayNum}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.dayDate}>{item.date}</Text>
          <View style={[styles.channelBadge, { backgroundColor: channelColor + '20' }]}>
            <Text style={[styles.channelText, { color: channelColor }]}>
              {item.channel.charAt(0).toUpperCase() + item.channel.slice(1)}
            </Text>
          </View>
        </View>
      </View>

      {/* Hero dish */}
      <View style={styles.heroDishRow}>
        <Text style={styles.heroDishLabel}>HERO DISH</Text>
        <Text style={styles.heroDishName}>{item.heroDish}</Text>
      </View>

      {/* Content type */}
      <View style={styles.contentTypeBadge}>
        <Ionicons name="film-outline" size={11} color={S.dim} />
        <Text style={styles.contentTypeText}>{item.contentType}</Text>
      </View>

      {/* Caption preview */}
      <Text style={styles.dayCaptionPreview} numberOfLines={3}>{item.caption}</Text>

      {/* Target segment */}
      <View style={styles.segmentRow}>
        <Ionicons name="people-outline" size={12} color={S.dim} />
        <Text style={styles.segmentText}>{item.targetSegment}</Text>
      </View>

      {/* CTA */}
      <View style={styles.ctaBox}>
        <Text style={styles.ctaBoxText}>{item.cta}</Text>
      </View>

      {/* Copy button */}
      <TouchableOpacity style={styles.dayCopyBtn} onPress={handleCopy} activeOpacity={0.8}>
        <Ionicons
          name={copied ? 'checkmark' : 'share-outline'}
          size={13}
          color={copied ? S.green : S.blue}
        />
        <Text style={[styles.dayCopyText, copied && { color: S.green }]}>
          {copied ? 'Shared!' : 'Share'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Video script card ─────────────────────────────────────────────────────────

function VideoScriptCard({ script }: { script: VideoScript }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const fullText = [
    `${script.title} (${script.format})`,
    `Hook: ${script.hookLine}`,
    '',
    ...script.scenes.map(
      (s) => `Scene ${s.sceneNumber} [${s.duration}]\nVisual: ${s.visualDescription}\nVO: ${s.voiceover}`,
    ),
    '',
    `CTA: ${script.callToAction}`,
  ].join('\n');

  const handleCopy = async () => {
    await shareText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.scriptCard}>
      <TouchableOpacity
        style={styles.scriptHeader}
        onPress={() => setExpanded((e) => !e)}
        activeOpacity={0.8}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.scriptTitle}>{script.title}</Text>
          <View style={styles.scriptFormatBadge}>
            <Text style={styles.scriptFormatText}>{script.format}</Text>
          </View>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={S.dim}
        />
      </TouchableOpacity>

      {/* Hook line always visible */}
      <View style={styles.hookRow}>
        <Text style={styles.hookLabel}>HOOK</Text>
        <Text style={styles.hookText}>"{script.hookLine}"</Text>
      </View>

      {expanded && (
        <>
          <View style={styles.scriptDivider} />
          {script.scenes.map((scene) => (
            <View key={scene.sceneNumber} style={styles.sceneRow}>
              <View style={styles.sceneNumWrap}>
                <Text style={styles.sceneNum}>{scene.sceneNumber}</Text>
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <View style={styles.sceneDurationRow}>
                  <Ionicons name="timer-outline" size={11} color={S.dim} />
                  <Text style={styles.sceneDuration}>{scene.duration}</Text>
                </View>
                <Text style={styles.sceneVisual}>📷 {scene.visualDescription}</Text>
                <Text style={styles.sceneVoiceover}>🎙 "{scene.voiceover}"</Text>
              </View>
            </View>
          ))}
          <View style={styles.scriptCtaRow}>
            <Ionicons name="megaphone-outline" size={14} color={S.amber} />
            <Text style={styles.scriptCtaText}>{script.callToAction}</Text>
          </View>
        </>
      )}

      <TouchableOpacity style={styles.copyRow} onPress={handleCopy} activeOpacity={0.8}>
        <Ionicons name={copied ? 'checkmark' : 'share-outline'} size={14} color={copied ? S.green : S.blue} />
        <Text style={[styles.copyRowText, copied && { color: S.green }]}>
          {copied ? 'Shared!' : 'Share full script'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Instagram caption card ────────────────────────────────────────────────────

function CaptionCard({ caption }: { caption: InstagramCaption }) {
  const [copied, setCopied] = useState(false);

  const fullText = `${caption.caption}\n\n${caption.hashtags.join(' ')}`;

  const handleCopy = async () => {
    await shareText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.captionCard}>
      <View style={styles.captionHeader}>
        <Text style={styles.captionDish}>{caption.dishOrTheme}</Text>
        <View style={styles.captionFormatBadge}>
          <Text style={styles.captionFormatText}>{caption.format}</Text>
        </View>
      </View>
      <Text style={styles.captionBody}>{caption.caption}</Text>
      <Text style={styles.captionHashtags}>{caption.hashtags.join(' ')}</Text>
      <TouchableOpacity style={styles.copyRow} onPress={handleCopy} activeOpacity={0.8}>
        <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={14} color={copied ? S.green : S.blue} />
        <Text style={[styles.copyRowText, copied && { color: S.green }]}>
          {copied ? 'Copied!' : 'Copy caption + hashtags'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Recommendation card ───────────────────────────────────────────────────────

function RecommendationCardView({ card }: { card: RecommendationCard }) {
  const [copied, setCopied] = useState(false);

  const fullText = `${card.headline}\n${card.body}\n${card.callToAction}`;

  const handleCopy = async () => {
    await shareText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.recCard}>
      {/* Simulated CraveMap card design */}
      <View style={styles.recCardInner}>
        <Text style={styles.recHeadline}>{card.headline}</Text>
        <Text style={styles.recBody}>{card.body}</Text>
        <View style={styles.recSubjectRow}>
          <Ionicons name="restaurant-outline" size={12} color={S.dim} />
          <Text style={styles.recSubject}>{card.subject}</Text>
        </View>
      </View>
      <View style={styles.recCtaRow}>
        <Text style={styles.recCta}>{card.callToAction}</Text>
        <TouchableOpacity onPress={handleCopy} activeOpacity={0.8} style={styles.recCopyBtn}>
          <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={14} color={copied ? S.green : S.blue} />
          <Text style={[styles.copyRowText, copied && { color: S.green }]}>
            {copied ? 'Copied!' : 'Copy'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionIcon}>{icon}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function DemoBanner() {
  return (
    <View style={styles.demoBanner}>
      <Ionicons name="information-circle-outline" size={16} color={S.amber} />
      <Text style={styles.demoBannerText}>
        Demo mode — add EXPO_PUBLIC_GEMINI_API_KEY to .env for real AI-generated campaigns.
      </Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: S.dark },
  blob1: {
    position: 'absolute', top: -60, right: -60,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: '#3A3AFF18',
  },
  blob2: {
    position: 'absolute', bottom: 60, left: -80,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: Colors.primary + '12',
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: BorderRadius.full,
    backgroundColor: S.card, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: S.border,
  },
  headerTitle: { ...Typography.h3, color: '#FFFFFF', fontWeight: '700' },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.xl },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xl },

  // Empty
  heroWrap: { alignItems: 'center', marginBottom: Spacing.xl },
  heroEmoji: { fontSize: 56, marginBottom: Spacing.md },
  heroTitle: { ...Typography.h1, color: '#FFFFFF', fontWeight: '800', textAlign: 'center', marginBottom: Spacing.sm, lineHeight: 36 },
  heroSub: { ...Typography.body, color: S.dim, textAlign: 'center', lineHeight: 22 },
  deliverableList: {
    backgroundColor: S.card, borderRadius: BorderRadius.lg,
    padding: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.xl,
    borderWidth: 1, borderColor: S.border,
  },
  deliverableRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  deliverableIcon: { fontSize: 16, width: 22 },
  deliverableLabel: { ...Typography.label, color: '#FFFFFF' },
  primaryCta: {
    backgroundColor: S.blue, borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: Spacing.sm,
    shadowColor: S.blue, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  primaryCtaCompact: {
    backgroundColor: S.blue, borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
  },
  primaryCtaText: { ...Typography.h3, color: '#fff' },
  ctaCaption: { ...Typography.caption, color: S.dim, textAlign: 'center', marginTop: Spacing.sm },
  linkBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.md, marginTop: Spacing.xs },
  linkBtnText: { ...Typography.caption, color: S.dim },

  // Running
  runningTitle: { ...Typography.h2, color: '#FFFFFF', fontWeight: '800', marginTop: Spacing.md, textAlign: 'center' },
  runningSub: { ...Typography.body, color: S.dim, textAlign: 'center', lineHeight: 22 },
  runningCaption: { ...Typography.caption, color: '#666688', marginTop: Spacing.sm },

  // Error
  errorTitle: { ...Typography.h2, color: '#FFFFFF', fontWeight: '800' },
  errorBody: { ...Typography.body, color: S.dim, textAlign: 'center', lineHeight: 22 },
  errorActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  secondaryCta: {
    backgroundColor: S.card, borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.lg,
    borderWidth: 1, borderColor: S.border,
  },
  secondaryCtaText: { ...Typography.label, color: S.dim, fontWeight: '700' },

  // Demo banner
  demoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#3A2A0A', borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    marginBottom: Spacing.md, borderWidth: 1, borderColor: '#5A4520',
  },
  demoBannerText: { ...Typography.caption, color: '#FFD37A', flex: 1, lineHeight: 17 },

  // Campaign header
  campaignHeader: {
    backgroundColor: S.card, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, borderWidth: 1, borderColor: S.border,
    marginBottom: Spacing.lg,
  },
  campaignMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  metaPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#14142E', borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm + 2, paddingVertical: 4,
    borderWidth: 1, borderColor: S.border,
  },
  metaDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: S.green },
  metaPillText: { fontSize: 10, fontWeight: '700', color: S.dim, letterSpacing: 0.5 },
  metaTimestamp: { ...Typography.caption, color: S.dim },
  campaignTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', lineHeight: 28, marginBottom: Spacing.sm },
  goalRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  goalText: { ...Typography.caption, color: S.dim, flex: 1, lineHeight: 18 },

  // Section
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  sectionIcon: { fontSize: 18 },
  sectionTitle: { ...Typography.h3, color: '#FFFFFF', fontWeight: '700' },

  // Calendar
  calendarScroll: { paddingBottom: Spacing.sm, gap: Spacing.sm },
  dayCard: {
    width: 210, backgroundColor: S.card, borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: S.border, gap: 8,
  },
  dayHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  dayNumBadge: { width: 36, height: 36, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center' },
  dayNum: { fontSize: 16, fontWeight: '800' },
  dayDate: { ...Typography.caption, color: '#FFFFFF', fontWeight: '700', marginBottom: 3 },
  channelBadge: { borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  channelText: { fontSize: 10, fontWeight: '700' },
  heroDishRow: { gap: 2 },
  heroDishLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: '#8888FF' },
  heroDishName: { ...Typography.label, color: '#FFFFFF', fontWeight: '700' },
  contentTypeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#14142E', borderRadius: BorderRadius.full,
    paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: S.border,
  },
  contentTypeText: { fontSize: 10, color: S.dim, fontWeight: '600' },
  dayCaptionPreview: { ...Typography.caption, color: '#FFFFFF', lineHeight: 18 },
  segmentRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  segmentText: { fontSize: 10, color: S.dim, flex: 1 },
  ctaBox: {
    backgroundColor: '#14142E', borderRadius: BorderRadius.md,
    padding: Spacing.sm, borderWidth: 1, borderColor: S.border,
  },
  ctaBoxText: { fontSize: 11, color: S.amber, fontWeight: '600', lineHeight: 16 },
  dayCopyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: Spacing.xs + 2,
    borderTopWidth: 1, borderTopColor: S.border, marginTop: 4,
  },
  dayCopyText: { fontSize: 11, color: S.blue, fontWeight: '700' },

  // Script
  scriptCard: {
    backgroundColor: S.card, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: S.border, overflow: 'hidden',
  },
  scriptHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: Spacing.md, gap: Spacing.sm,
  },
  scriptTitle: { ...Typography.label, color: '#FFFFFF', fontWeight: '700', marginBottom: 4 },
  scriptFormatBadge: {
    backgroundColor: S.blue + '25', borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 2, alignSelf: 'flex-start',
  },
  scriptFormatText: { fontSize: 10, fontWeight: '700', color: '#8888FF' },
  hookRow: {
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, gap: 4,
  },
  hookLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: '#8888FF' },
  hookText: { ...Typography.body, color: '#FFFFFF', fontStyle: 'italic', lineHeight: 22 },
  scriptDivider: { height: 1, backgroundColor: S.border, marginHorizontal: Spacing.md, marginBottom: Spacing.md },
  sceneRow: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, marginBottom: Spacing.sm,
  },
  sceneNumWrap: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: S.blue + '30', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 2,
  },
  sceneNum: { fontSize: 11, fontWeight: '800', color: '#8888FF' },
  sceneDurationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sceneDuration: { fontSize: 10, color: S.dim, fontWeight: '600' },
  sceneVisual: { ...Typography.caption, color: '#DDDDFF', lineHeight: 18 },
  sceneVoiceover: { ...Typography.caption, color: S.dim, lineHeight: 18, fontStyle: 'italic' },
  scriptCtaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: Spacing.md, marginBottom: Spacing.md,
    backgroundColor: '#2A2010', borderRadius: BorderRadius.md,
    padding: Spacing.sm, borderWidth: 1, borderColor: '#4A3520',
  },
  scriptCtaText: { ...Typography.caption, color: S.amber, flex: 1, lineHeight: 17 },
  copyRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: Spacing.sm + 2,
    borderTopWidth: 1, borderTopColor: S.border,
  },
  copyRowText: { ...Typography.caption, color: S.blue, fontWeight: '700' },

  // Captions
  captionCard: {
    backgroundColor: S.card, borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: S.border, gap: Spacing.sm,
  },
  captionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  captionDish: { ...Typography.label, color: '#FFFFFF', fontWeight: '700', flex: 1 },
  captionFormatBadge: {
    backgroundColor: '#E1306C20', borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
  },
  captionFormatText: { fontSize: 10, fontWeight: '700', color: '#E1306C' },
  captionBody: { ...Typography.body, color: '#FFFFFF', lineHeight: 22 },
  captionHashtags: { ...Typography.caption, color: '#8888FF', lineHeight: 18 },

  // Rec cards
  recCard: {
    backgroundColor: S.card, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: S.border, overflow: 'hidden',
  },
  recCardInner: {
    padding: Spacing.md, gap: Spacing.sm,
    borderLeftWidth: 3, borderLeftColor: Colors.primary,
  },
  recHeadline: { ...Typography.h3, color: '#FFFFFF', fontWeight: '800' },
  recBody: { ...Typography.caption, color: S.dim, lineHeight: 18 },
  recSubjectRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  recSubject: { ...Typography.caption, color: '#8888FF', fontStyle: 'italic' },
  recCtaRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderTopWidth: 1, borderTopColor: S.border,
  },
  recCta: { ...Typography.label, color: Colors.primary, fontWeight: '700' },
  recCopyBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },

  // Re-run
  rerunBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: Spacing.md, marginTop: Spacing.lg,
  },
  rerunBtnText: { ...Typography.label, color: S.blue, fontWeight: '700' },
});
