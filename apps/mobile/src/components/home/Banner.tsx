import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, shadowStyle, borderRadius, fontSize, spacing } from '../../constants';

export function Banner() {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Advertisement</Text>
      <Text style={styles.subText}>Banner space for future ads</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    ...shadowStyle,
    marginBottom: spacing.md,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  placeholder: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  subText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
