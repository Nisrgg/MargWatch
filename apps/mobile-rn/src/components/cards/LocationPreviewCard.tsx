import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { SectionCard } from './SectionCard';
import { typography } from '../../theme/typography';
import { colors } from '../../theme/colors';

interface LocationPreviewCardProps {
  latitude: number | null;
  longitude: number | null;
  address?: string;
}

export function LocationPreviewCard({
  latitude,
  longitude,
  address,
}: LocationPreviewCardProps) {
  if (latitude == null || longitude == null) {
    return (
      <SectionCard>
        <Text style={styles.title}>Location</Text>
        <Text style={styles.placeholder}>No location selected.</Text>
      </SectionCard>
    );
  }

  return (
    <SectionCard>
      <Text style={styles.title}>Location</Text>
      <Text style={styles.coords}>
        {latitude.toFixed(5)}, {longitude.toFixed(5)}
      </Text>
      {address ? <Text style={styles.address}>{address}</Text> : null}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.titleSmall,
    color: colors.onSurface,
    marginBottom: 4,
  },
  placeholder: {
    ...typography.bodySmall,
    color: colors.onSurfaceVariant,
  },
  coords: {
    ...typography.bodySmall,
    color: colors.onSurface,
  },
  address: {
    ...typography.bodySmall,
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
});

