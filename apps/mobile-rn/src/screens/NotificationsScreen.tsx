import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, Text, View } from 'react-native';
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

  const demoNotifications =
    notifications.length === 0
      ? [
          {
            id: 'demo-1',
            title: 'Work order updated',
            message: 'Pothole near E-4, Arera Colony has been assigned to a field worker.',
            type: 'WORK_ORDER',
            isRead: false,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'demo-2',
            title: 'Complaint acknowledged',
            message: 'Your complaint about the fallen tree on Marg-12 has been received.',
            type: 'COMPLAINT',
            isRead: false,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'demo-3',
            title: 'Resolution in progress',
            message: 'Road flooding near MP Nagar Zone-II is now under review by the team.',
            type: 'STATUS',
            isRead: true,
            createdAt: new Date().toISOString(),
          },
        ]
      : notifications;

  return (
    <ScreenContainer>
      <SectionHeader
        title="Notifications"
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={{ color: colors.primary, fontWeight: '600', marginRight: spacing.sm }}>
                {'\u2039'} Back
              </Text>
            </TouchableOpacity>
            {notifications.length > 0 ? (
              <MWButton
                title="Mark all read"
                variant="outline"
                onPress={() => markAllRead.mutate()}
                loading={markAllRead.isPending}
              />
            ) : null}
          </View>
        }
      />
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : error ? (
        <EmptyState title="Failed to load notifications." />
      ) : (
        <MWList
          data={demoNotifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItemCard
              notification={item}
              onPress={() => {
                if (!item.isRead && notifications.length > 0) {
                  markRead.mutate(item.id);
                }
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
