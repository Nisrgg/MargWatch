import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { SectionCard } from '../cards/SectionCard';
import { typography } from '../../theme/typography';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface FormSectionProps {
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function FormSection({ title, children, style }: FormSectionProps) {
  return (
    <SectionCard style={style}>
      {title ? (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>
      ) : null}
      <View>{children}</View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.titleSmall,
    color: colors.onSurface,
  },
});

