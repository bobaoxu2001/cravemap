import React from 'react';
import { TouchableOpacity, View, Text, ViewStyle, TextStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, Typography } from '../constants/theme';

type ChipVariant = 'primary' | 'green' | 'yellow' | 'red' | 'neutral';

interface TagChipProps {
  label: string;
  variant?: ChipVariant;
  size?: 'sm' | 'md';
  onPress?: () => void;
}

const variantStyles: Record<ChipVariant, { bg: string; text: string }> = {
  primary: { bg: Colors.secondary, text: Colors.primary },
  green: { bg: '#E8F5EE', text: Colors.green },
  yellow: { bg: '#FFF8E1', text: '#B8860B' },
  red: { bg: '#FDECEA', text: Colors.error },
  neutral: { bg: '#F5F5F5', text: Colors.textSecondary },
};

function TagChipInner({ label, variant = 'neutral', size = 'sm', onPress }: TagChipProps) {
  const colors = variantStyles[variant];
  const containerStyle: ViewStyle = {
    backgroundColor: colors.bg,
    paddingHorizontal: size === 'sm' ? Spacing.sm : Spacing.md,
    paddingVertical: size === 'sm' ? 3 : Spacing.xs,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  };
  const textStyle: TextStyle = {
    ...Typography.caption,
    color: colors.text,
    fontWeight: '500',
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text style={textStyle}>{label}</Text>
      </TouchableOpacity>
    );
  }
  // Non-interactive — render as plain View so VoiceOver / TalkBack don't
  // announce it as a button and so we don't get a "ghost" press feedback.
  return (
    <View style={containerStyle} accessible accessibilityRole="text">
      <Text style={textStyle}>{label}</Text>
    </View>
  );
}

// Memoized — appears in dense tag lists (Profile, RestaurantDetail, check-in
// review). Re-rendering all chips when a single tag toggles was the main
// observable cost here.
export default React.memo(TagChipInner);
