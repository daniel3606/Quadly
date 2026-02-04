import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, cardShadow, borderRadius, spacing } from '../../constants';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export function Card({ children, style, padding = 'medium' }: CardProps) {
  return (
    <View style={[styles.card, styles[padding], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    ...cardShadow,
  },
  none: {
    padding: 0,
  },
  small: {
    padding: spacing.sm,
  },
  medium: {
    padding: spacing.md,
  },
  large: {
    padding: spacing.lg,
  },
});
