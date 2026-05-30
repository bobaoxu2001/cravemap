import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { useAuth } from '../src/hooks/useAuth';
import {
  getNotifications,
  timeAgo,
  AppNotification,
  NotificationType,
} from '../src/services/notifications';

const DEMO_USER_ID = 'u001';

const TYPE_STYLE: Record<NotificationType, { icon: string; color: string }> = {
  checkin:   { icon: 'camera',     color: Colors.primary },
  xp:        { icon: 'star',       color: Colors.accent },
  helpful:   { icon: 'thumbs-up',  color: '#7B9EFF' },
  community: { icon: 'people',     color: Colors.green },
};

function NotificationRow({
  item,
  read,
  isLast,
}: {
  item: AppNotification;
  read: boolean;
  isLast: boolean;
}) {
  const unread = item.unread && !read;
  const style = TYPE_STYLE[item.type];
  return (
    <View style={[styles.notifRow, isLast && styles.notifRowLast]}>
      {/* Unread dot */}
      <View style={styles.unreadDotWrap}>
        {unread ? <View style={styles.unreadDot} /> : <View style={styles.unreadDotPlaceholder} />}
      </View>

      {/* Icon circle */}
      <View style={[styles.iconCircle, { backgroundColor: style.color }]}>
        <Ionicons name={style.icon as any} size={20} color="#fff" />
      </View>

      {/* Content */}
      <View style={styles.notifContent}>
        <Text style={[styles.notifTitle, unread && styles.notifTitleUnread]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
      </View>

      {/* Time */}
      <Text style={styles.notifTime}>{timeAgo(item.timestamp)}</Text>
    </View>
  );
}

export default function Notifications() {
  const router = useRouter();
  const { session, isSupabaseMode, profile: authProfile } = useAuth();
  const userId = isSupabaseMode ? (session?.userId ?? null) : DEMO_USER_ID;

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [allRead, setAllRead] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (isSupabaseMode && !userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    const id = userId ?? DEMO_USER_ID;
    setLoading(true);
    setError('');
    getNotifications(id, authProfile)
      .then((items) => { setNotifications(items); setAllRead(false); })
      .catch(() => setError('Could not load your activity. Please try again.'))
      .finally(() => setLoading(false));
  }, [userId, isSupabaseMode, authProfile]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const unreadCount = allRead ? 0 : notifications.filter((n) => n.unread).length;
  const markAllRead = () => setAllRead(true);

  const newNotifs = allRead ? [] : notifications.filter((n) => n.unread);
  const earlierNotifs = allRead ? notifications : notifications.filter((n) => !n.unread);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Activity</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadPill}>
              <Text style={styles.unreadPillText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllRead} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.markAllRead}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />
      ) : error ? (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Couldn&apos;t load activity</Text>
          <Text style={styles.emptySubtext}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load} activeOpacity={0.85}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* New / Unread */}
          {newNotifs.length > 0 && (
            <View style={styles.group}>
              <Text style={styles.groupLabel}>NEW</Text>
              <View style={styles.groupCard}>
                {newNotifs.map((item, idx) => (
                  <NotificationRow key={item.id} item={item} read={allRead} isLast={idx === newNotifs.length - 1} />
                ))}
              </View>
            </View>
          )}

          {/* Earlier / Read */}
          {earlierNotifs.length > 0 && (
            <View style={styles.group}>
              <Text style={styles.groupLabel}>EARLIER</Text>
              <View style={styles.groupCard}>
                {earlierNotifs.map((item, idx) => (
                  <NotificationRow key={item.id} item={item} read={allRead} isLast={idx === earlierNotifs.length - 1} />
                ))}
              </View>
            </View>
          )}

          {notifications.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No activity yet</Text>
              <Text style={styles.emptySubtext}>Check back after your first check-in!</Text>
            </View>
          )}

          <View style={styles.bottomPad} />
        </ScrollView>
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
    backgroundColor: Colors.card,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  unreadPill: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: 'center',
  },
  unreadPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  markAllRead: {
    ...Typography.label,
    color: Colors.primary,
    fontWeight: '600',
  },
  scrollContent: {
    paddingTop: Spacing.lg,
  },
  group: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
    paddingLeft: Spacing.xs,
  },
  groupCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  notifRowLast: {
    borderBottomWidth: 0,
  },
  unreadDotWrap: {
    width: 8,
    alignItems: 'center',
    paddingTop: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4A90E2',
  },
  unreadDotPlaceholder: {
    width: 8,
    height: 8,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notifContent: {
    flex: 1,
    gap: 3,
  },
  notifTitle: {
    ...Typography.label,
    color: Colors.text,
    fontWeight: '400',
    lineHeight: 18,
  },
  notifTitleUnread: {
    fontWeight: '700',
  },
  notifBody: {
    ...Typography.caption,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  notifTime: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
    flexShrink: 0,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: Spacing.sm,
  },
  emptyText: {
    ...Typography.h3,
    color: Colors.text,
  },
  emptySubtext: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  retryBtn: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  retryBtnText: {
    ...Typography.label,
    color: '#fff',
    fontWeight: '700',
  },
  bottomPad: {
    height: Spacing.xl,
  },
});
