import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { spacing } from '../../theme/spacing';

interface FormActionsProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function FormActions({ children, style }: FormActionsProps) {
  return <View style={[styles.container, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
  },
});

