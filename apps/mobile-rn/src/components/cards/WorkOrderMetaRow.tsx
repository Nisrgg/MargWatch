import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface WorkOrderMetaRowProps {
  label: string;
  value: string;
}

export function WorkOrderMetaRow({ label, value }: WorkOrderMetaRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  label: {
    ...typography.labelSmall,
    color: colors.onSurfaceVariant,
    marginRight: spacing.sm,
  },
  value: {
    ...typography.bodySmall,
    color: colors.onSurface,
    flex: 1,
    textAlign: 'right',
  },
});

