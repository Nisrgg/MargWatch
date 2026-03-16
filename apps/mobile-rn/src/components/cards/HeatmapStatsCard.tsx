import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { SectionCard } from './SectionCard';
import { typography } from '../../theme/typography';
import { colors } from '../../theme/colors';

interface HeatmapPointSummary {
  category?: string;
  count?: number;
}

interface HeatmapStatsCardProps {
  points: HeatmapPointSummary[];
}

export function HeatmapStatsCard({ points }: HeatmapStatsCardProps) {
  const total = points.reduce((sum, p) => sum + (p.count ?? 0), 0);
  const categories = Array.from(new Set(points.map((p) => p.category).filter(Boolean)));

  return (
    <SectionCard>
      <Text style={styles.title}>Overview</Text>
      <Text style={styles.item}>Total complaints: {total}</Text>
      <Text style={styles.item}>Categories: {categories.length}</Text>
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

