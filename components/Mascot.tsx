import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

const MASCOT_SOURCES: Record<string, ReturnType<typeof require>> = {
  'Spicy Adventurer': require('../assets/mascots/spicy-adventurer.png'),
  'Comfort Seeker': require('../assets/mascots/comfort-food-soul.png'),
  'Healthy Foodie': require('../assets/mascots/healthy-foodie.png'),
  'Authentic Explorer': require('../assets/mascots/hidden-gem-hunter.png'),
};

interface MascotProps {
  persona: string;
  size?: number;
  style?: StyleProp<ImageStyle>;
}

export default function Mascot({ persona, size = 120, style }: MascotProps) {
  const source = MASCOT_SOURCES[persona] ?? MASCOT_SOURCES['Authentic Explorer'];
  return (
    <Image
      source={source}
      style={[{ width: size, height: size, resizeMode: 'contain' }, style]}
    />
  );
}
