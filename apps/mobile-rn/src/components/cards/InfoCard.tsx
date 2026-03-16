import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { SectionCard } from './SectionCard';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface InfoCardProps {
  title: string;
  message: string;
}

export function InfoCard({ title, message }: InfoCardProps) {
  return (
    <SectionCard>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.titleSmall,
    color: colors.onSurface,
    marginBottom: 4,
  },
  message: {
    ...typography.bodySmall,
    color: colors.onSurfaceVariant,
  },
});

