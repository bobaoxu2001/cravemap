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

interface SectionProps { title: string; children: React.ReactNode }
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

export default function TermsScreen() {
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
        <Text style={styles.headerTitle} accessibilityRole="header">Terms of Service</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.meta}>Last updated: {LAST_UPDATED}</Text>
        <P>
          Please read these Terms of Service ("Terms") carefully before using
          CraveMap / 好吃GO ("the App"). By creating an account or using the App,
          you agree to be bound by these Terms.
        </P>

        <Section title="1. Eligibility">
          <P>
            You must be at least 13 years old to use the App. By using the App,
            you represent that you meet this age requirement.
          </P>
        </Section>

        <Section title="2. Your Account">
          <Li>You are responsible for maintaining the security of your account and password.</Li>
          <Li>You must provide accurate information when creating your account.</Li>
          <Li>You may not share your account with others or create accounts for others.</Li>
          <Li>
            You may delete your account at any time from Profile → Delete Account.
            Deletion permanently removes your profile, check-ins, and associated data.
          </Li>
        </Section>

        <Section title="3. User-Generated Content">
          <P>
            You are solely responsible for the content you post, including
            check-in reviews, photos, ratings, and tags.
          </P>
          <P>By posting content, you represent that:</P>
          <Li>You own or have the right to share the content.</Li>
          <Li>The content is accurate to the best of your knowledge.</Li>
          <Li>The content does not violate anyone else's rights.</Li>
          <P>
            You grant CraveMap a non-exclusive, worldwide, royalty-free licence
            to display and distribute your content within the App and for the
            purpose of operating and promoting the service.
          </P>
        </Section>

        <Section title="4. Prohibited Content">
          <P>You agree NOT to post content that:</P>
          <Li>Is false, misleading, or fabricated</Li>
          <Li>Harasses, threatens, or demeans other users</Li>
          <Li>Contains nudity, graphic violence, or adult content</Li>
          <Li>Promotes illegal activity</Li>
          <Li>Is spam, commercial solicitation, or fake reviews</Li>
          <Li>Infringes any copyright, trademark, or other intellectual property</Li>
          <P>
            Violations may result in content removal, account suspension, or
            permanent ban. We reserve the right to remove any content at our
            discretion.
          </P>
        </Section>

        <Section title="5. Content Moderation">
          <P>
            We provide mechanisms for users to report objectionable content and
            block other users. We review all reports and take action within
            24 hours for clear violations. For questions about a moderation
            decision, email {CONTACT_EMAIL}.
          </P>
        </Section>

        <Section title="6. Intellectual Property">
          <P>
            The App's design, code, branding, and non-user content are owned by
            CraveMap and protected by copyright. You may not copy, modify, or
            redistribute the App without our permission.
          </P>
        </Section>

        <Section title="7. Disclaimers">
          <P>
            Restaurant information, hours, and availability may be inaccurate
            or out of date. We do not guarantee the quality or safety of any
            establishment listed. Always verify information independently before
            visiting.
          </P>
          <P>
            The App is provided "as is" without warranties of any kind. We do
            not warrant that the App will be uninterrupted, error-free, or
            free of viruses.
          </P>
        </Section>

        <Section title="8. Limitation of Liability">
          <P>
            To the maximum extent permitted by law, CraveMap shall not be liable
            for any indirect, incidental, special, consequential, or punitive
            damages arising from your use of the App.
          </P>
        </Section>

        <Section title="9. Changes to These Terms">
          <P>
            We may update these Terms from time to time. We will notify you of
            material changes in the App. Continued use after changes constitutes
            acceptance.
          </P>
        </Section>

        <Section title="10. Governing Law">
          <P>
            These Terms are governed by the laws of the State of New York,
            United States, without regard to conflict of law principles.
          </P>
        </Section>

        <Section title="11. Contact">
          <P>
            For questions about these Terms:{'\n'}
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
  },
  bottomPad: {
    height: Spacing.xxl,
  },
});
