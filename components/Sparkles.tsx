import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';

interface SparklesProps {
  /** Mount-gate. When false, renders nothing — preferred over toggling `active`. */
  active?: boolean;
  /** Emoji to render. Defaults to ✨. */
  emoji?: string;
  /** Style for the outer absolute-fill container. */
  style?: StyleProp<ViewStyle>;
}

interface SparkleSpec {
  top: string;
  left: string;
  size: number;
  delay: number;
}

// Five hand-tuned positions around a centered subject. Percentages mean the
// container can sit on top of any sized parent (mascot box, success modal,
// reward card) and the sparkles fan around it sensibly.
const POSITIONS: SparkleSpec[] = [
  { top: '4%',  left: '8%',  size: 18, delay: 0 },
  { top: '12%', left: '85%', size: 22, delay: 250 },
  { top: '62%', left: '4%',  size: 16, delay: 500 },
  { top: '70%', left: '88%', size: 20, delay: 150 },
  { top: '38%', left: '94%', size: 14, delay: 700 },
];

function Sparkle({ delay, size, emoji }: { delay: number; size: number; emoji: string }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]),
        Animated.delay(350),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.5, duration: 500, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, opacity, scale]);

  return (
    <Animated.Text style={{ opacity, transform: [{ scale }], fontSize: size }}>
      {emoji}
    </Animated.Text>
  );
}

/**
 * Minimalist pass: Sparkles is now a no-op. The decorative sparkle stickers
 * were dropped to lower visual noise on success states and the rewards screen.
 * The prop interface is preserved so call sites continue to compile —
 * remove the imports later as a cleanup pass.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function Sparkles(_props: SparklesProps) {
  return null;
}

// Sparkle / POSITIONS / styles above are intentionally unreferenced —
// kept for diff readability; can be deleted in a follow-up cleanup pass.

const styles = StyleSheet.create({
  position: {
    position: 'absolute',
  },
});
