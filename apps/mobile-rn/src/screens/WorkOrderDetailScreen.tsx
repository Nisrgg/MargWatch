import React, { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/MainNavigator';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { SectionHeader } from '../components/layout/SectionHeader';
import { ScreenBody } from '../components/layout/ScreenBody';
import { ScreenState } from '../components/feedback/ScreenState';
import { FormSection } from '../components/forms/FormSection';
import { FormActions } from '../components/forms/FormActions';
import { TextField } from '../components/forms/TextField';
import { WorkOrderDetailCard } from '../components/cards/WorkOrderDetailCard';
import { WorkOrderMetaSection } from '../components/cards/WorkOrderMetaSection';
import { WorkOrderProgressCard } from '../components/cards/WorkOrderProgressCard';
import { WorkOrderActions } from '../components/cards/WorkOrderActions';
import { useWorkOrderDetail, useUpdateWorkOrderStatus, useCompleteWorkOrder } from '../hooks/useWorkOrders';
import { WorkOrderStatus } from '../types';

type Props = NativeStackScreenProps<MainStackParamList, 'WorkOrderDetail'>;

const STATUS_OPTIONS: WorkOrderStatus[] = [
  WorkOrderStatus.ASSIGNED,
  WorkOrderStatus.IN_PROGRESS,
  WorkOrderStatus.PENDING_REVIEW,
  WorkOrderStatus.COMPLETED,
  WorkOrderStatus.REJECTED,
];

export default function WorkOrderDetailScreen({ route, navigation }: Props) {
  const { workOrderId } = route.params;
  const { data: workOrder, isLoading, error } = useWorkOrderDetail(workOrderId);
  const updateStatus = useUpdateWorkOrderStatus();
  const completeOrder = useCompleteWorkOrder();

  const [status, setStatus] = useState('');
  const [description, setDescription] = useState('');
  const [progress, setProgress] = useState('');
  const [cost, setCost] = useState('');

  const handleUpdateStatus = useCallback(async () => {
    if (!status.trim()) {
      Alert.alert('Required', 'Select a status.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('status', status.trim());
      if (description.trim()) formData.append('description', description.trim());
      if (progress.trim()) formData.append('progress', progress.trim());
      await updateStatus.mutateAsync({ id: workOrderId, formData });
      Alert.alert('Updated', 'Status updated.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Update failed.');
    }
  }, [workOrderId, status, description, progress, updateStatus]);

  const handleComplete = useCallback(async () => {
    try {
      const formData = new FormData();
      if (description.trim()) formData.append('description', description.trim());
      if (cost.trim()) formData.append('cost', cost.trim());
      await completeOrder.mutateAsync({ id: workOrderId, formData });
      Alert.alert('Completed', 'Work order marked complete.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Completion failed.');
    }
  }, [workOrderId, description, cost, completeOrder, navigation]);

  if (isLoading || !workOrder) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Work order" onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Work order" onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <Text style={styles.errorText}>Could not load work order.</Text>
        </View>
      </View>
    );
  }

  const canComplete =
    workOrder.status === WorkOrderStatus.IN_PROGRESS ||
    workOrder.status === WorkOrderStatus.PENDING_REVIEW;

  return (
    <ScreenContainer>
      <SectionHeader title="Work order" />
      <ScreenState loading={isLoading} error={error}>
        <ScreenBody>
          <WorkOrderDetailCard workOrder={workOrder} />
          <WorkOrderMetaSection workOrder={workOrder} />
          <WorkOrderProgressCard workOrder={workOrder} />

          <FormSection title="Update status">
            <TextField
              label="Status"
              value={status}
              onChangeText={setStatus}
              placeholder="e.g. IN_PROGRESS"
            />
            <TextField
              label="Description (optional)"
              value={description}
              onChangeText={setDescription}
              placeholder="Description"
            />
            <TextField
              label="Progress % (optional)"
              value={progress}
              onChangeText={setProgress}
              placeholder="0-100"
              keyboardType="numeric"
            />
            <FormActions>
              <WorkOrderActions
                onUpdateStatus={handleUpdateStatus}
                onComplete={handleComplete}
                isUpdating={updateStatus.isPending}
                isCompleting={completeOrder.isPending}
              />
            </FormActions>
          </FormSection>

          {canComplete && (
            <FormSection title="Completion details">
              <TextField
                label="Cost (optional)"
                value={cost}
                onChangeText={setCost}
                placeholder="Cost"
                keyboardType="numeric"
              />
            </FormSection>
          )}
        </ScreenBody>
      </ScreenState>
    </ScreenContainer>
  );
}
