import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';

const STUDIO_BLUE = '#3A3AFF';

interface ModuleItem {
  icon: string;
  title: string;
  status: string;
  ready: boolean;
  href?: string;
}

const MODULES: ModuleItem[] = [
  {
    icon: '🧠',
    title: 'AI Menu Analysis',
    status: 'Tap to generate insights',
    ready: true,
    href: '/studio/analysis',
  },
  { icon: '📣', title: 'Campaign Generator', status: 'Ready after analysis', ready: false },
  { icon: '📈', title: 'Review Intelligence', status: 'Ready after analysis', ready: false },
  { icon: '🤖', title: 'Agent Logs', status: 'No runs yet', ready: false },
];

export default function StudioDashboard() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Welcome to</Text>
            <Text style={styles.brandName}>CraveMap Studio</Text>
          </View>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.replace('/role-select')}
            activeOpacity={0.7}
          >
            <Ionicons name="exit-outline" size={20} color="#A0A0C8" />
          </TouchableOpacity>
        </View>

        {/* Status card */}
        <View style={styles.statusCard}>
          <View style={styles.statusIconWrap}>
            <Text style={styles.statusIcon}>⚡</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitle}>Profile saved successfully</Text>
            <Text style={styles.statusBody}>
              Your menu is in the queue. AI analysis typically takes under 30 seconds once triggered.
            </Text>
          </View>
        </View>

        {/* Module list */}
        <Text style={styles.sectionLabel}>YOUR STUDIO MODULES</Text>
        <View style={styles.moduleList}>
          {MODULES.map((item, i) => {
            const cardInner = (
              <>
                <View style={styles.moduleIconWrap}>
                  <Text style={styles.moduleIcon}>{item.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.moduleTitle}>{item.title}</Text>
                  <Text style={styles.moduleStatus}>{item.status}</Text>
                </View>
                <View style={[styles.moduleBadge, item.ready && styles.moduleBadgeReady]}>
                  <Text style={[styles.moduleBadgeText, item.ready && styles.moduleBadgeTextReady]}>
                    {item.ready ? 'Open' : 'Soon'}
                  </Text>
                </View>
              </>
            );
            return item.href ? (
              <TouchableOpacity
                key={i}
                style={[styles.moduleCard, styles.moduleCardActive]}
                onPress={() => router.push(item.href as never)}
                activeOpacity={0.85}
              >
                {cardInner}
              </TouchableOpacity>
            ) : (
              <View key={i} style={styles.moduleCard}>{cardInner}</View>
            );
          })}
        </View>

        {/* Re-submit CTA */}
        <TouchableOpacity
          style={styles.resubmitBtn}
          onPress={() => router.push('/studio/onboarding')}
          activeOpacity={0.85}
        >
          <Ionicons name="refresh-outline" size={16} color={STUDIO_BLUE} />
          <Text style={styles.resubmitBtnText}>Update restaurant info</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0E0E2A',
  },
  blob1: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#3A3AFF18',
  },
  blob2: {
    position: 'absolute',
    bottom: 80,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.primary + '14',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  greeting: {
    ...Typography.label,
    color: '#8888FF',
    letterSpacing: 0.5,
  },
  brandName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: '#1E1E40',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3A3AFF30',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: '#1A2A1A',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#2A4A2A',
    marginBottom: Spacing.xl,
  },
  statusIconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: '#0A1A0A',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statusIcon: { fontSize: 20 },
  statusTitle: {
    ...Typography.label,
    color: '#88CC88',
    fontWeight: '700',
    marginBottom: 3,
  },
  statusBody: {
    ...Typography.caption,
    color: '#669966',
    lineHeight: 18,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#6666AA',
    marginBottom: Spacing.md,
  },
  moduleList: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: '#1E1E40',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#3A3AFF20',
  },
  moduleCardActive: {
    borderColor: '#3A3AFF60',
    shadowColor: '#3A3AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  moduleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: '#14142E',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  moduleIcon: { fontSize: 20 },
  moduleTitle: {
    ...Typography.label,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 2,
  },
  moduleStatus: {
    ...Typography.caption,
    color: '#8888BB',
  },
  moduleBadge: {
    backgroundColor: '#14142E',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#3A3AFF30',
    flexShrink: 0,
  },
  moduleBadgeReady: {
    backgroundColor: '#1A2A1A',
    borderColor: '#2A4A2A',
  },
  moduleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6666AA',
    letterSpacing: 0.5,
  },
  moduleBadgeTextReady: {
    color: '#88CC88',
  },
  resubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: '#1E1E40',
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1.5,
    borderColor: STUDIO_BLUE + '50',
  },
  resubmitBtnText: {
    ...Typography.label,
    color: STUDIO_BLUE,
    fontWeight: '700',
  },
});
