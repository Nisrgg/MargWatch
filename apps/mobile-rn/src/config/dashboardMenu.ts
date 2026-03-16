import type { MainStackParamList } from '../navigation/MainNavigator';
import { ROLES } from '../constants/roles';

type MainRouteKey = keyof MainStackParamList;

export interface DashboardMenuItem {
  key: MainRouteKey;
  label: string;
  subtitle: string;
  role?: typeof ROLES[keyof typeof ROLES];
}

export const DASHBOARD_MENU: DashboardMenuItem[] = [
  { key: 'ComplaintSubmission', label: 'Submit complaint', subtitle: 'Report a road issue with photos' },
  { key: 'ComplaintsList', label: 'My complaints', subtitle: 'View your submitted complaints' },
  { key: 'HeatMap', label: 'Heat map', subtitle: 'See issues on the map' },
  { key: 'Profile', label: 'Profile', subtitle: 'Account and settings' },
  { key: 'WorkerDashboard', label: 'Work orders', subtitle: 'Assigned tasks (workers)', role: ROLES.WORKER },
  { key: 'Notifications', label: 'Notifications', subtitle: 'Updates and alerts' },
];

