import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SectionCard } from './SectionCard';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import type { User } from '@margwatch/shared-types';

interface ProfileHeaderProps {
  user: User | null;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  if (!user) return null;
  return (
    <SectionCard>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitials}>
            {(user.firstName?.[0] ?? '').toUpperCase()}
            {(user.lastName?.[0] ?? '').toUpperCase()}
          </Text>
        </View>
        <View style={styles.texts}>
          <Text style={styles.name}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={styles.email}>{user.email}</Text>
          <Text style={styles.role}>Role: {user.role}</Text>
        </View>
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarInitials: {
    ...typography.titleSmall,
    color: colors.onPrimaryContainer,
  },
  texts: {
    flex: 1,
  },
  name: {
    ...typography.titleMedium,
    color: colors.onSurface,
  },
  email: {
    ...typography.bodySmall,
    color: colors.onSurfaceVariant,
  },
  role: {
    ...typography.labelSmall,
    color: colors.primary,
    marginTop: 2,
  },
});

