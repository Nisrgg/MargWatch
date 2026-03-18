import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { SectionCard } from './SectionCard';
import { typography } from '../../theme/typography';
import { colors } from '../../theme/colors';

interface SubmissionSummaryCardProps {
  imageCount: number;
  hasLocation: boolean;
  hasDescription?: boolean;
  addressLabel?: string;
}

export function SubmissionSummaryCard({
  imageCount,
  hasLocation,
  hasDescription,
  addressLabel,
}: SubmissionSummaryCardProps) {
  return (
    <SectionCard>
      <Text style={styles.title}>Summary</Text>
      <Text style={styles.item}>
        Photos: {imageCount > 0 ? `${imageCount} attached` : 'None'}
      </Text>
      <Text style={styles.item}>
        Location:{' '}
        {addressLabel
          ? addressLabel
          : hasLocation
          ? 'Selected'
          : 'Not selected'}
      </Text>
      {hasDescription !== undefined && (
        <Text style={styles.item}>
          Description: {hasDescription ? 'Entered' : 'Not entered'}
        </Text>
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.titleSmall,
    color: colors.onSurface,
    marginBottom: 4,
  },
  item: {
    ...typography.bodySmall,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
});

