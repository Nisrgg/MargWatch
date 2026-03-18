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
  return (
    <SectionCard>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitials}>
            N
            G
          </Text>
        </View>
        <View style={styles.texts}>
          <Text style={styles.name}>
            Nisarg Gajjar
          </Text>
          <Text style={styles.email}>nisarg@roadportal.com</Text>
          {user?.role ? <Text style={styles.role}>Role: {user.role}</Text> : null}
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
    ...typography.headlineSmall,
    color: colors.onSurface,
  },
  email: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  role: {
    ...typography.labelSmall,
    color: colors.primary,
    marginTop: 2,
  },
});

