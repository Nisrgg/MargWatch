import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { WorkOrder } from '@margwatch/shared-types';
import { SectionCard } from './SectionCard';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface WorkOrderDetailCardProps {
  workOrder: WorkOrder;
}

export function WorkOrderDetailCard({ workOrder }: WorkOrderDetailCardProps) {
  const title =
    workOrder.complaint?.title ?? workOrder.complaintId ?? workOrder.id.slice(-8);

  return (
    <SectionCard>
      <Text style={styles.id}>#{workOrder.id.slice(-6)}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.status}>Status: {workOrder.status}</Text>
      {workOrder.description ? (
        <Text style={styles.description}>{workOrder.description}</Text>
      ) : null}
      {workOrder.assignedAt ? (
        <View style={styles.row}>
          <Text style={styles.label}>Assigned</Text>
          <Text style={styles.value}>
            {new Date(workOrder.assignedAt).toLocaleDateString()}
          </Text>
        </View>
      ) : null}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  id: {
    ...typography.labelLarge,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.titleMedium,
    color: colors.onSurface,
  },
  status: {
    ...typography.labelMedium,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  description: {
    ...typography.bodySmall,
    color: colors.onSurfaceVariant,
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  label: {
    ...typography.labelSmall,
    color: colors.onSurfaceVariant,
  },
  value: {
    ...typography.bodySmall,
    color: colors.onSurface,
  },
});

