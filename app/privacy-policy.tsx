import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

const LAST_UPDATED = 'May 2026';
const CONTACT_EMAIL = 'ax2183@nyu.edu';
const APP_NAME = 'CraveMap / 好吃GO';

interface SectionProps {
  title: string;
  children: React.ReactNode;
}
function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.listItem}>
      <Text style={styles.bullet}>•</Text>
      <Text style={[styles.body, { flex: 1 }]}>{children}</Text>
    </View>
  );
}

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} accessibilityRole="header">Privacy Policy</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.meta}>Last updated: {LAST_UPDATED}</Text>
        <P>
          {APP_NAME} ("we", "us", "our") is committed to protecting your privacy.
          This Privacy Policy explains how we collect, use, and share information
          when you use our mobile application and related services.
        </P>
        <P>
          By using CraveMap, you agree to the collection and use of information in
          accordance with this policy.
        </P>

        <Section title="1. Information We Collect">
          <P><Text style={styles.bold}>Account information</Text></P>
          <P>
            When you create an account, we collect your email address and the
            display name you choose. We do not collect your real name unless you
            choose to enter it.
          </P>
          <P><Text style={styles.bold}>Profile information</Text></P>
          <P>
            Taste preferences, dietary needs, food-scene preferences, city
            selection, and persona — used to personalise your restaurant
            recommendations.
          </P>
          <P><Text style={styles.bold}>User-generated content</Text></P>
          <P>
            Check-in reviews, ratings, photos, and tags you post publicly to the
            app. This content is visible to other users.
          </P>
          <P><Text style={styles.bold}>Location information</Text></P>
          <P>
            With your permission, we access your device's approximate location
            to show restaurants near you on the map. We do not continuously track
            your location or store precise location history.
          </P>
          <P><Text style={styles.bold}>Usage information</Text></P>
          <P>
            Device type, operating system version, app version, and crash
            reports — used to diagnose bugs and improve the app.
          </P>
        </Section>

        <Section title="2. How We Use Your Information">
          <Li>Personalise restaurant recommendations based on your taste passport</Li>
          <Li>Display your check-ins and reviews to other users</Li>
          <Li>Show your location on the map (only when you have granted permission)</Li>
          <Li>Send you notifications about activity on your content (if enabled)</Li>
          <Li>Diagnose and fix app crashes and errors</Li>
          <Li>Prevent spam, fraud, and abuse</Li>
          <Li>Comply with legal obligations</Li>
        </Section>

        <Section title="3. Information We Share">
          <P>
            We do not sell your personal information. We may share information
            in the following limited circumstances:
          </P>
          <Li>
            <Text style={styles.bold}>With other users: </Text>
            Your display name, avatar, check-ins, and reviews are visible to all
            users. Your email address is never shown publicly.
          </Li>
          <Li>
            <Text style={styles.bold}>Service providers: </Text>
            We use Supabase (database and authentication), Expo (build and
            distribution), and AWS / Supabase Storage (photo storage). These
            providers process data on our behalf under appropriate agreements.
          </Li>
          <Li>
            <Text style={styles.bold}>Legal requirements: </Text>
            We may disclose information if required by law or in response to
            valid legal process.
          </Li>
        </Section>

        <Section title="4. Photos and Media">
          <P>
            Photos you upload with check-ins are stored on our servers and
            displayed publicly within the app. We access your photo library only
            when you actively use the check-in photo picker. We do not scan or
            analyse your photo library.
          </P>
          <P>
            Camera access is requested only when you choose to take a photo
            within the check-in flow.
          </P>
        </Section>

        <Section title="5. Data Retention">
          <P>
            We retain your account and associated content for as long as your
            account is active. When you delete your account (Profile → Delete
            Account), we permanently delete your profile, check-ins, saved
            restaurants, and all associated data within 30 days. Some information
            may be retained in backups for a short period before being purged.
          </P>
        </Section>

        <Section title="6. Your Rights">
          <P>You have the right to:</P>
          <Li>Access the personal information we hold about you</Li>
          <Li>Correct inaccurate information in your profile</Li>
          <Li>Delete your account and associated data in-app (Profile → Delete Account)</Li>
          <Li>Request a copy of your data by emailing us</Li>
          <Li>Object to or restrict certain processing</Li>
          <P>
            For any privacy requests, email us at{' '}
            <Text style={styles.link}>{CONTACT_EMAIL}</Text>. We will respond
            within 30 days.
          </P>
        </Section>

        <Section title="7. Children's Privacy">
          <P>
            CraveMap is not directed at children under 13 years of age. We do
            not knowingly collect personal information from children under 13.
            If you believe we have inadvertently collected such information,
            please contact us immediately.
          </P>
        </Section>

        <Section title="8. Security">
          <P>
            We use industry-standard practices to protect your information,
            including encrypted connections (HTTPS/TLS), row-level security on
            our database, and access controls. No method of electronic storage
            or transmission is 100% secure, so we cannot guarantee absolute
            security.
          </P>
        </Section>

        <Section title="9. Changes to This Policy">
          <P>
            We may update this Privacy Policy from time to time. We will notify
            you of material changes by posting the new policy in the app.
            Continued use of the app after changes constitutes acceptance.
          </P>
        </Section>

        <Section title="10. Contact Us">
          <P>
            If you have questions, requests, or concerns about this Privacy
            Policy, please contact:
          </P>
          <P>
            <Text style={styles.bold}>CraveMap / 好吃GO{'\n'}</Text>
            <Text style={styles.link}>{CONTACT_EMAIL}</Text>
          </P>
        </Section>

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
  headerRight: { width: 40 },
  content: {
    padding: Spacing.lg,
  },
  meta: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  body: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  bold: {
    fontWeight: '600',
    color: Colors.text,
  },
  link: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  listItem: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  bullet: {
    ...Typography.body,
    color: Colors.textMuted,
    lineHeight: 22,
    marginTop: 0,
  },
  bottomPad: {
    height: Spacing.xxl,
  },
});
