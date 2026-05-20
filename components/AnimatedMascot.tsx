import React, { useEffect, useRef } from 'react';
import { Animated, Pressable } from 'react-native';
import Mascot from './Mascot';

interface AnimatedMascotProps {
  /** Persona name — drives which PNG is shown. Falls back to hidden-gem-hunter if unknown. */
  persona: string;
  size?: number;
  /** When true (default), plays a quiet fade-in on mount (no spring bounce). */
  animate?: boolean;
  /** Kept for prop compatibility. No longer pulses — minimalist pass. */
  pulse?: boolean;
  /** Optional tap handler — fires the callback without a bounce animation. */
  onPress?: () => void;
}

/**
 * Mascot with a quiet fade-in on mount. The previous spring bounce, sustained
 * pulse, and tap bounce were dropped to align with the "subtle fades, minimal
 * scaling" guideline. Props are preserved so call sites continue to compile;
 * `pulse` is now a no-op.
 */
export default function AnimatedMascot({
  persona,
  size = 120,
  animate = true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  pulse: _pulse,
  onPress,
}: AnimatedMascotProps) {
  const opacity = useRef(new Animated.Value(animate ? 0 : 1)).current;

  useEffect(() => {
    if (!animate) return;
    Animated.timing(opacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const content = (
    <Animated.View style={{ opacity }}>
      <Mascot persona={persona} size={size} />
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`${persona} mascot`}
      >
        {content}
      </Pressable>
    );
  }
  return content;
}
