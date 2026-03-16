import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useAuth } from '../../hooks/useAuth';

type RouteKey =
  | 'ComplaintsList'
  | 'ComplaintSubmission'
  | 'HeatMap'
  | 'Profile'
  | 'WorkerDashboard';

interface NavItem {
  key: RouteKey;
  label: string;
}

const userNav: NavItem[] = [
  { key: 'ComplaintsList', label: 'Complaints' },
  { key: 'ComplaintSubmission', label: 'Submit' },
  { key: 'HeatMap', label: 'Heatmap' },
  { key: 'Profile', label: 'Profile' },
];

const workerNav: NavItem[] = [
  { key: 'WorkerDashboard', label: 'Dashboard' },
  { key: 'HeatMap', label: 'Heatmap' },
  { key: 'Profile', label: 'Profile' },
];

export function BottomNavBar() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { user } = useAuth();

  const role = user?.role ?? 'user';
  const items = role === 'worker' ? workerNav : userNav;

  return (
    <View style={styles.container}>
      {items.map((item) => {
        const isActive = route.name === item.key;
        return (
          <TouchableOpacity
            key={item.key}
            style={styles.item}
            onPress={() => {
              if (!isActive) {
                navigation.navigate(item.key as never);
              }
            }}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>{item.label}</Text>
            {isActive ? <View style={styles.indicator} /> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
    backgroundColor: colors.surface,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  label: {
    ...typography.labelMedium,
    color: colors.onSurfaceVariant,
  },
  labelActive: {
    color: colors.primary,
  },
  indicator: {
    marginTop: spacing.xs / 2,
    width: 24,
    height: 3,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
});

