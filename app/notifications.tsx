import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

interface Notification {
  id: string;
  type: string;
  icon: string;
  color: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'checkin',   icon: 'camera',           color: Colors.primary, title: "Wei Zhang checked in at Xi'an Famous Foods", body: '"The biangbiang noodles hit different at 2pm" — Worth it ✅', time: '2h ago', unread: true },
  { id: '2', type: 'xp',        icon: 'star',             color: Colors.accent,  title: "You're 125 XP from Level 4 — Taste Expert 🦊", body: 'Post a verified check-in to get there faster', time: '1d ago', unread: true },
  { id: '3', type: 'spot',      icon: 'location',         color: Colors.green,   title: 'New hidden gem added in Flushing', body: 'White Bear #6 wontons — no sign, no menu, no English. Just go.', time: '2d ago', unread: false },
  { id: '4', type: 'helpful',   icon: 'thumbs-up',        color: '#7B9EFF',      title: 'Your check-in got 12 helpful votes', body: "People are finding your Xi'an Foods review useful", time: '3d ago', unread: false },
  { id: '5', type: 'social',    icon: 'people',           color: Colors.accent,  title: 'Jiwon Kim has similar taste to you', body: "89% Taste Match — see what they've been eating", time: '5d ago', unread: false },
  { id: '6', type: 'weekly',    icon: 'bar-chart',        color: Colors.green,   title: '10 new check-ins this week in NYC', body: "The scout community is shaping the map — see what's new", time: '1w ago', unread: false },
  { id: '7', type: 'milestone', icon: 'shield-checkmark', color: Colors.primary, title: '3 check-ins milestone unlocked! +75 XP', body: 'Your Dango is growing — keep going to Level 3', time: '2w ago', unread: false },
  { id: '8', type: 'spot',      icon: 'location',         color: Colors.green,   title: 'New late-night ramen spot scouted in K-Town', body: 'Open until 3am. Locals-only pricing. 94% match for you.', time: '2w ago', unread: false },
];

function NotificationRow({ item, isLast }: { item: Notification; isLast: boolean }) {
  return (
    <View style={[styles.notifRow, isLast && styles.notifRowLast]}>
      {/* Unread dot */}
      <View style={styles.unreadDotWrap}>
        {item.unread ? <View style={styles.unreadDot} /> : <View style={styles.unreadDotPlaceholder} />}
      </View>

      {/* Icon circle */}
      <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon as any} size={20} color="#fff" />
      </View>

      {/* Content */}
      <View style={styles.notifContent}>
        <Text style={[styles.notifTitle, item.unread && styles.notifTitleUnread]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
      </View>

      {/* Time */}
      <Text style={styles.notifTime}>{item.time}</Text>
    </View>
  );
}

export default function Notifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const newNotifs = notifications.filter((n) => n.unread);
  const earlierNotifs = notifications.filter((n) => !n.unread);

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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* New / Unread */}
        {newNotifs.length > 0 && (
          <View style={styles.group}>
            <Text style={styles.groupLabel}>NEW</Text>
            <View style={styles.groupCard}>
              {newNotifs.map((item, idx) => (
                <NotificationRow key={item.id} item={item} isLast={idx === newNotifs.length - 1} />
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
                <NotificationRow key={item.id} item={item} isLast={idx === earlierNotifs.length - 1} />
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
  },
  bottomPad: {
    height: Spacing.xl,
  },
});
