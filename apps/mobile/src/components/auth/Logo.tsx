import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize } from '../../constants';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
}

export function Logo({ size = 'large' }: LogoProps) {
  const sizeStyles = {
    small: { container: 40, text: fontSize.xl },
    medium: { container: 60, text: fontSize.xxl },
    large: { container: 100, text: 48 },
  };

  const { container: containerSize, text: textSize } = sizeStyles[size];

  return (
    <View style={[styles.container, { width: containerSize, height: containerSize }]}>
      <Text style={[styles.logo, { fontSize: textSize }]}>Q</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    color: colors.background,
    fontWeight: 'bold',
  },
});
