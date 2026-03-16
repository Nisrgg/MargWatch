import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/MainNavigator';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { SectionHeader } from '../components/layout/SectionHeader';
import { ScreenBody } from '../components/layout/ScreenBody';
import { ScreenState } from '../components/feedback/ScreenState';
import { ActionList } from '../components/lists/ActionList';
import { WorkOrderSummaryCard } from '../components/cards/WorkOrderSummaryCard';
import { WorkOrderCard } from '../components/WorkOrderCard';
import { MWList } from '../components/lists/MWList';
import { EmptyState } from '../components/feedback/EmptyState';
import { useWorkOrdersList } from '../hooks/useWorkOrders';

type Props = NativeStackScreenProps<MainStackParamList, 'WorkerDashboard'>;

export default function WorkerDashboardScreen({ navigation }: Props) {
  const { data, isLoading, error } = useWorkOrdersList();
  const workOrders = data?.workOrders ?? [];

  return (
    <ScreenContainer>
      <SectionHeader title="Work orders" />
      <ScreenState
        loading={isLoading}
        error={error}
        empty={!workOrders.length}
        emptyComponent={<EmptyState title="No work orders assigned." />}
      >
        <ScreenBody>
          <ActionList>
            <WorkOrderSummaryCard workOrders={workOrders} />
          </ActionList>
          <MWList
            data={workOrders}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <WorkOrderCard
                workOrder={item}
                onPress={() =>
                  navigation.navigate('WorkOrderDetail', { workOrderId: item.id })
                }
              />
            )}
          />
        </ScreenBody>
      </ScreenState>
    </ScreenContainer>
  );
}
