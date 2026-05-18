import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import Mascot from './Mascot';

interface AnimatedMascotProps {
  /** Persona name — drives which PNG is shown. Falls back to hidden-gem-hunter if unknown. */
  persona: string;
  size?: number;
  /** When true (default), plays a spring bounce-in on mount. */
  animate?: boolean;
  /** When true, loops a gentle scale pulse after the entrance animation. */
  pulse?: boolean;
}

/**
 * Mascot with optional entrance (spring bounce) and milestone pulse animations.
 * Uses only React Native's built-in Animated API so it works in Expo Go
 * on both iOS/Android and is safely skipped on web via useNativeDriver fallback.
 *
 * To re-trigger the entrance animation from the parent, pass a different `key` prop.
 */
export default function AnimatedMascot({
  persona,
  size = 120,
  animate = true,
  pulse = false,
}: AnimatedMascotProps) {
  const scaleAnim = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Entrance spring — runs once on mount.
  useEffect(() => {
    if (!animate) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 55,
      friction: 6,
      useNativeDriver: true,
    }).start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sustained pulse — starts/stops when `pulse` changes.
  useEffect(() => {
    if (!pulse) {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Animated.View
      style={{ transform: [{ scale: scaleAnim }, { scale: pulseAnim }] }}
    >
      <Mascot persona={persona} size={size} />
    </Animated.View>
  );
}
