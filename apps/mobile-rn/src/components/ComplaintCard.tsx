import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Complaint } from '@margwatch/shared-types';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

interface ComplaintCardProps {
  complaint: Complaint;
  onPress?: () => void;
}

export function ComplaintCard({ complaint, onPress }: ComplaintCardProps) {
  const content = (
    <View style={styles.card}>
      <Text style={styles.title} numberOfLines={2}>{complaint.title}</Text>
      <Text style={styles.status}>{complaint.status}</Text>
      <Text style={styles.category}>{complaint.category}</Text>
      {complaint.address ? (
        <Text style={styles.address} numberOfLines={1}>{complaint.address}</Text>
      ) : null}
    </View>
  );

  if (onPress) {
    return <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{content}</TouchableOpacity>;
  }
  return content;
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  title: { ...typography.titleMedium, color: colors.onSurface },
  status: { ...typography.labelMedium, color: colors.primary, marginTop: spacing.xs },
  category: { ...typography.bodySmall, color: colors.onSurfaceVariant, marginTop: spacing.xxs },
  address: { ...typography.bodySmall, color: colors.outline, marginTop: spacing.xxs },
});
