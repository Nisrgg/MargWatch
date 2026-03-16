import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SectionCard } from './SectionCard';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import type { WorkOrder } from '@margwatch/shared-types';

interface WorkOrderSummaryCardProps {
  workOrders: WorkOrder[];
}

export function WorkOrderSummaryCard({ workOrders }: WorkOrderSummaryCardProps) {
  const total = workOrders.length;
  const inProgress = workOrders.filter((w) => w.status === 'IN_PROGRESS').length;
  const completed = workOrders.filter((w) => w.status === 'COMPLETED').length;

  return (
    <SectionCard>
      <Text style={styles.title}>Summary</Text>
      <View style={styles.row}>
        <View style={styles.item}>
          <Text style={styles.label}>Total</Text>
          <Text style={styles.value}>{total}</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.label}>In progress</Text>
          <Text style={styles.value}>{inProgress}</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.label}>Completed</Text>
          <Text style={styles.value}>{completed}</Text>
        </View>
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.titleSmall,
    color: colors.onSurface,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  item: {
    alignItems: 'center',
    minWidth: 80,
  },
  label: {
    ...typography.labelSmall,
    color: colors.onSurfaceVariant,
  },
  value: {
    ...typography.titleMedium,
    color: colors.primary,
    marginTop: 4,
  },
});

