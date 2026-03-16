import React from 'react';
import { View, StyleSheet } from 'react-native';
import { spacing } from '../../theme/spacing';

interface ActionListProps {
  children: React.ReactNode;
}

export function ActionList({ children }: ActionListProps) {
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
});

