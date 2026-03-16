import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface TopBarProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
}

export function TopBar({ title, onBack, rightAction, style }: TopBarProps) {
  return (
    <View style={[styles.container, style]}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.backButton} hitSlop={8}>
          <Text style={styles.backLabel}>{'‹'}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.backPlaceholder} />
      )}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.right}>{rightAction}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButton: {
    paddingRight: spacing.sm,
    paddingVertical: spacing.xs,
  },
  backPlaceholder: {
    width: 24,
  },
  backLabel: {
    ...typography.titleMedium,
    color: colors.primary,
  },
  title: {
    ...typography.titleLarge,
    color: colors.onSurface,
    flex: 1,
    textAlign: 'center',
  },
  right: {
    minWidth: 24,
    alignItems: 'flex-end',
  },
});

