import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { SectionCard } from './SectionCard';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface ErrorCardProps {
  message: string;
}

export function ErrorCard({ message }: ErrorCardProps) {
  return (
    <SectionCard>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{message}</Text>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.titleSmall,
    color: colors.error,
    marginBottom: 4,
  },
  message: {
    ...typography.bodySmall,
    color: colors.onSurfaceVariant,
  },
});

