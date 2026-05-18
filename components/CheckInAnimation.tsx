import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, StyleProp, ViewStyle, Easing } from 'react-native';

/**
 * Lightweight micro-animations used around the Check-in feed. All effects use
 * the RN Animated API with `useNativeDriver: true` so they're cheap on
 * iOS/Android and degrade gracefully on web (no native deps).
 *
 * Two pieces are exported:
 *   - `<CheckInEntrance>`  Wraps a feed item and fades + slides + scales it in
 *                          on mount. Set `highlight` to give "new" items a
 *                          slightly bouncier reveal.
 *   - `<CheckInStickers>`  Absolute-fill sticker burst (sparkles + glow halo)
 *                          for marking a freshly-posted or milestone card.
 *                          Mount-gated; renders nothing when `active=false`.
 */

interface CheckInEntranceProps {
  children: React.ReactNode;
  /** Stagger delay in ms so adjacent cards reveal sequentially. */
  delay?: number;
  /** When true, use a springier, more attention-grabbing reveal. */
  highlight?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function CheckInEntrance({
  children,
  delay = 0,
  highlight = false,
  style,
}: CheckInEntranceProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  const scale = useRef(new Animated.Value(highlight ? 0.94 : 0.98)).current;

  useEffect(() => {
    const reveal = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 380,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      highlight
        ? Animated.spring(scale, {
            toValue: 1,
            delay,
            tension: 110,
            friction: 7,
            useNativeDriver: true,
          })
        : Animated.timing(scale, {
            toValue: 1,
            duration: 380,
            delay,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
    ]);
    reveal.start();
    return () => reveal.stop();
  }, [delay, highlight, opacity, scale, translateY]);

  return (
    <Animated.View
      style={[
        style,
        { opacity, transform: [{ translateY }, { scale }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}

interface CheckInStickersProps {
  /** Mount-gate. Renders nothing when false (no animation, no cost). */
  active?: boolean;
  /** Optional override for the sparkle emoji. */
  emoji?: string;
  style?: StyleProp<ViewStyle>;
}

interface StickerSpec {
  top: string;
  left: string;
  size: number;
  delay: number;
}

const STICKERS: StickerSpec[] = [
  { top: '6%',  left: '6%',  size: 16, delay: 0 },
  { top: '14%', left: '88%', size: 18, delay: 220 },
  { top: '72%', left: '4%',  size: 14, delay: 440 },
];

function Sticker({ delay, size, emoji }: { delay: number; size: number; emoji: string }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;
  const translateY = useRef(new Animated.Value(4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 360, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 360, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -2, duration: 360, useNativeDriver: true }),
        ]),
        Animated.delay(420),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 460, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.6, duration: 460, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 6, duration: 460, useNativeDriver: true }),
        ]),
        Animated.delay(900),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, opacity, scale, translateY]);

  return (
    <Animated.Text
      style={{
        opacity,
        fontSize: size,
        transform: [{ scale }, { translateY }],
      }}
    >
      {emoji}
    </Animated.Text>
  );
}

export function CheckInStickers({ active = true, emoji = '✨', style }: CheckInStickersProps) {
  // Pulsing glow halo — sits behind the stickers.
  const glow = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 0.55, duration: 900, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.25, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, glow]);

  if (!active) return null;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Animated.View style={[styles.glow, { opacity: glow }]} />
      {STICKERS.map((s, i) => (
        <View key={i} style={[styles.position, { top: s.top as any, left: s.left as any }]}>
          <Sticker delay={s.delay} size={s.size} emoji={emoji} />
        </View>
      ))}
    </View>
  );
}

interface BounceOnChangeProps {
  /** Any value that, when it changes, triggers a one-shot bounce. */
  trigger: unknown;
  /** If true, the very first render is skipped (only changes bounce). */
  skipInitial?: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Plays a tiny pop+settle every time `trigger` changes. Used to give the
 * helpful thumbs-up icon a satisfying response when a user taps it.
 */
export function BounceOnChange({
  trigger,
  skipInitial = true,
  children,
  style,
}: BounceOnChangeProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const isFirstRef = useRef(true);

  useEffect(() => {
    if (isFirstRef.current) {
      isFirstRef.current = false;
      if (skipInitial) return;
    }
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.25, useNativeDriver: true, tension: 220, friction: 4 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 180, friction: 6 }),
    ]).start();
  }, [scale, skipInitial, trigger]);

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
  );
}

const styles = StyleSheet.create({
  position: {
    position: 'absolute',
  },
  glow: {
    position: 'absolute',
    top: '20%',
    left: '20%',
    right: '20%',
    bottom: '20%',
    backgroundColor: '#FFE9B0',
    borderRadius: 999,
  },
});
