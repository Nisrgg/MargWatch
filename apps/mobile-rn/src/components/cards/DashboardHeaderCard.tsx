import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import type { User } from '@margwatch/shared-types';

interface DashboardHeaderCardProps {
  user: User | null;
}

export function DashboardHeaderCard({ user }: DashboardHeaderCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>
        Monitor complaints, work orders, and field activity in one place.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  greeting: {
    ...typography.headlineSmall,
    color: colors.onSurface,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xxs,
  },
});

