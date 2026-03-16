import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { SectionCard } from './SectionCard';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import type { Complaint } from '@margwatch/shared-types';

interface ComplaintHeaderCardProps {
  complaint: Complaint;
}

export function ComplaintHeaderCard({ complaint }: ComplaintHeaderCardProps) {
  return (
    <SectionCard>
      <Text style={styles.title}>{complaint.title}</Text>
      <Text style={styles.status}>Status: {complaint.status}</Text>
      <Text style={styles.category}>Category: {complaint.category}</Text>
      <Text style={styles.body}>{complaint.description}</Text>
      {complaint.address ? <Text style={styles.address}>Address: {complaint.address}</Text> : null}
      <Text style={styles.coords}>
        {complaint.latitude}, {complaint.longitude}
      </Text>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.titleLarge,
    color: colors.onSurface,
  },
  status: {
    ...typography.labelMedium,
    color: colors.primary,
    marginTop: 4,
  },
  category: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  body: {
    ...typography.bodyMedium,
    color: colors.onSurface,
    marginTop: 8,
  },
  address: {
    ...typography.bodySmall,
    color: colors.outline,
    marginTop: 4,
  },
  coords: {
    ...typography.labelSmall,
    color: colors.outline,
    marginTop: 4,
  },
});

