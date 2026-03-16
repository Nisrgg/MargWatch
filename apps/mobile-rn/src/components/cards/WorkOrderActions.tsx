import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MWButton } from '../buttons/MWButton';
import { spacing } from '../../theme/spacing';

interface WorkOrderActionsProps {
  onUpdateStatus: () => void;
  onComplete: () => void;
  isUpdating?: boolean;
  isCompleting?: boolean;
}

export function WorkOrderActions({
  onUpdateStatus,
  onComplete,
  isUpdating,
  isCompleting,
}: WorkOrderActionsProps) {
  return (
    <View style={styles.container}>
      <MWButton
        title={isUpdating ? 'Updating…' : 'Update status'}
        onPress={onUpdateStatus}
        loading={isUpdating}
      />
      <MWButton
        title={isCompleting ? 'Completing…' : 'Complete work'}
        onPress={onComplete}
        loading={isCompleting}
        variant="outline"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});

