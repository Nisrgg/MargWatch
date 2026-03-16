import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainScreen from '../screens/MainScreen';
import ComplaintSubmissionScreen from '../screens/ComplaintSubmissionScreen';
import ComplaintsListScreen from '../screens/ComplaintsListScreen';
import ComplaintDetailScreen from '../screens/ComplaintDetailScreen';
import HeatMapScreen from '../screens/HeatMapScreen';
import ProfileScreen from '../screens/ProfileScreen';
import WorkerDashboardScreen from '../screens/WorkerDashboardScreen';
import WorkOrderDetailScreen from '../screens/WorkOrderDetailScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

export type MainStackParamList = {
  Main: undefined;
  ComplaintSubmission: undefined;
  ComplaintsList: undefined;
  ComplaintDetail: { complaintId: string };
  HeatMap: undefined;
  Profile: undefined;
  WorkerDashboard: undefined;
  WorkOrderDetail: { workOrderId: string };
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainScreen} />
      <Stack.Screen name="ComplaintSubmission" component={ComplaintSubmissionScreen} />
      <Stack.Screen name="ComplaintsList" component={ComplaintsListScreen} />
      <Stack.Screen name="ComplaintDetail" component={ComplaintDetailScreen} />
      <Stack.Screen name="HeatMap" component={HeatMapScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="WorkerDashboard" component={WorkerDashboardScreen} />
      <Stack.Screen name="WorkOrderDetail" component={WorkOrderDetailScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}
