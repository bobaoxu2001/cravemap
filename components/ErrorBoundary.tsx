import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../constants/theme';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional override for the fallback UI. Receives the captured error and a reset callback. */
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Top-level safety net for unexpected render errors. Without this, any thrown
 * error in a child component crashes to a blank white screen — particularly
 * bad in TestFlight where testers can't read the dev red box.
 *
 * Class component because React's error-boundary API still requires it.
 * The reset button clears the captured error so React can re-mount the tree.
 *
 * In __DEV__ we surface the message + stack for fast triage; in production
 * we keep the screen friendly and ask the user to retry.
 */
export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Surface to the dev console; no remote reporting wired up for beta.
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary] caught:', error, info.componentStack);
    }
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback(error, this.reset);
    }

    return (
      <View style={styles.root}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="alert-circle" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>
            CraveMap hit an unexpected snag. Try again — and if it sticks around, send the details below to ax2183@nyu.edu.
          </Text>
          {__DEV__ && (
            <ScrollView style={styles.devBox} contentContainerStyle={{ padding: Spacing.sm }}>
              <Text style={styles.devText} selectable>
                {error.name}: {error.message}
              </Text>
              {error.stack ? (
                <Text style={styles.devStack} selectable>
                  {error.stack}
                </Text>
              ) : null}
            </ScrollView>
          )}
          <Pressable
            onPress={this.reset}
            accessibilityRole="button"
            accessibilityLabel="Try again"
            accessibilityHint="Resets the app from the error screen"
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.md,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  devBox: {
    maxHeight: 220,
    width: '100%',
    backgroundColor: '#0A0A0A',
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  devText: {
    color: '#FF8A65',
    fontFamily: 'Courier',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  devStack: {
    color: '#E5E5E5',
    fontFamily: 'Courier',
    fontSize: 11,
    lineHeight: 16,
  },
  button: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 160,
  },
  buttonPressed: {
    backgroundColor: Colors.primaryLight,
  },
  buttonText: {
    ...Typography.label,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
