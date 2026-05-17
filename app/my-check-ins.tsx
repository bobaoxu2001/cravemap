import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { CheckIn } from '../types';
import { getCheckInsByUserId } from '../src/services/checkIns';
import { useAuth } from '../src/hooks/useAuth';
import CheckInCard from '../components/CheckInCard';

const DEMO_USER_ID = 'u001';

export default function MyCheckIns() {
  const router = useRouter();
  const { session, isSupabaseMode } = useAuth();
  const userId = isSupabaseMode ? (session?.userId ?? null) : DEMO_USER_ID;

  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (isSupabaseMode && !userId) {
      setLoading(false);
      return;
    }
    const id = userId ?? DEMO_USER_ID;
    setLoading(true);
    setError('');
    getCheckInsByUserId(id)
      .then((data) => setCheckIns(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load check-ins.'))
      .finally(() => setLoading(false));
  }, [userId, isSupabaseMode]);

  useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Check-ins</Text>
        <View style={styles.headerRight} />
      </View>

      {loading && (
        <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />
      )}

      {!loading && isSupabaseMode && !userId && (
        <View style={styles.emptyState}>
          <Ionicons name="lock-closed-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Sign in to see your check-ins</Text>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/auth/sign-in')}
            activeOpacity={0.85}
          >
            <Text style={styles.actionBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && error !== '' && (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Something went wrong</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={load} activeOpacity={0.85}>
            <Text style={styles.actionBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && error === '' && (!isSupabaseMode || userId) && (
        <FlatList
          data={checkIns}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CheckInCard checkIn={item} />}
          contentContainerStyle={checkIns.length === 0 ? styles.emptyContainer : styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="camera-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No check-ins yet</Text>
              <Text style={styles.emptySubtitle}>Start shaping your food map.</Text>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push('/check-in')}
                activeOpacity={0.85}
              >
                <Text style={styles.actionBtnText}>Post a Check-in</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  headerRight: {
    width: 40,
  },
  list: {
    padding: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.text,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  actionBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  actionBtnText: {
    ...Typography.label,
    color: '#fff',
    fontWeight: '700',
  },
});
