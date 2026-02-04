import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Image } from 'react-native';
import { colors, borderRadius, fontSize, spacing, shadowStyle } from '../../constants';

interface GoogleSignInButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

export function GoogleSignInButton({ onPress, disabled }: GoogleSignInButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.googleIcon}>G</Text>
      </View>
      <Text style={styles.text}>Continue with Google</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
    ...shadowStyle,
  },
  disabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 24,
    height: 24,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  text: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
});
