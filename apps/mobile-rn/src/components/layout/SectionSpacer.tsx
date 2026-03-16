import React from 'react';
import { View, ViewStyle } from 'react-native';
import { spacing } from '../../theme/spacing';

interface SectionSpacerProps {
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export function SectionSpacer({ size = 'lg', style }: SectionSpacerProps) {
  const height =
    size === 'sm' ? spacing.sm : size === 'md' ? spacing.md : spacing.lg;
  return <View style={[{ height }, style]} />;
}

