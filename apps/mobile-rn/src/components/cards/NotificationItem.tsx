import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SectionCard } from './SectionCard';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import type { Notification } from '@margwatch/shared-types';

interface NotificationItemProps {
  notification: Notification;
  onPress: () => void;
}

export function NotificationItem({ notification, onPress }: NotificationItemProps) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <SectionCard style={!notification.isRead ? styles.unread : undefined}>
        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.message}>{notification.message}</Text>
        <Text style={styles.meta}>
          {notification.type} • {new Date(notification.createdAt).toLocaleDateString()}
        </Text>
      </SectionCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  unread: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  title: {
    ...typography.titleSmall,
    color: colors.onSurface,
  },
  message: {
    ...typography.bodySmall,
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  meta: {
    ...typography.labelSmall,
    color: colors.outline,
    marginTop: 4,
  },
});

