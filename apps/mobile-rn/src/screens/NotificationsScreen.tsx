import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/MainNavigator';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { SectionHeader } from '../components/layout/SectionHeader';
import { MWList } from '../components/lists/MWList';
import { MWButton } from '../components/buttons/MWButton';
import { NotificationItem as NotificationItemCard } from '../components/cards/NotificationItem';
import { EmptyState } from '../components/feedback/EmptyState';
import {
  useNotificationsList,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../hooks/useNotifications';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<MainStackParamList, 'Notifications'>;

export default function NotificationsScreen({ navigation }: Props) {
  const { data, isLoading, error } = useNotificationsList();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const notifications = data?.notifications ?? [];

  return (
    <ScreenContainer>
      <SectionHeader
        title="Notifications"
        right={
          notifications.length > 0 ? (
            <MWButton
              title="Mark all read"
              variant="outline"
              onPress={() => markAllRead.mutate()}
              loading={markAllRead.isPending}
            />
          ) : undefined
        }
      />
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : error ? (
        <EmptyState title="Failed to load notifications." />
      ) : notifications.length === 0 ? (
        <EmptyState title="No notifications." />
      ) : (
        <MWList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItemCard
              notification={item}
              onPress={() => {
                if (!item.isRead) markRead.mutate(item.id);
              }}
            />
          )}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: spacing.lg },
});
