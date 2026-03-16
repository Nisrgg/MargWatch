import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { WorkOrder } from '@margwatch/shared-types';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

interface WorkOrderCardProps {
  workOrder: WorkOrder;
  onPress?: () => void;
}

export function WorkOrderCard({ workOrder, onPress }: WorkOrderCardProps) {
  const title = workOrder.complaint?.title ?? workOrder.complaintId?.slice(-8) ?? workOrder.id.slice(-8);
  const content = (
    <View style={styles.card}>
      <Text style={styles.title} numberOfLines={2}>{title}</Text>
      <Text style={styles.status}>{workOrder.status}</Text>
      <Text style={styles.id}>#{workOrder.id.slice(-6)}</Text>
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
  id: { ...typography.bodySmall, color: colors.outline, marginTop: spacing.xxs },
});
