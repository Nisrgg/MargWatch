import React from 'react';
import { Text, StyleSheet } from 'react-native';
import type { WorkOrder } from '@margwatch/shared-types';
import { SectionCard } from './SectionCard';
import { typography } from '../../theme/typography';
import { colors } from '../../theme/colors';

interface WorkOrderProgressCardProps {
  workOrder: WorkOrder;
}

export function WorkOrderProgressCard({ workOrder }: WorkOrderProgressCardProps) {
  const progressText =
    typeof workOrder.progress === 'number'
      ? `${workOrder.progress}%`
      : workOrder.progress ?? 'N/A';

  return (
    <SectionCard>
      <Text style={styles.title}>Progress</Text>
      <Text style={styles.value}>{progressText}</Text>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.titleSmall,
    color: colors.onSurface,
    marginBottom: 4,
  },
  value: {
    ...typography.titleMedium,
    color: colors.primary,
  },
});

