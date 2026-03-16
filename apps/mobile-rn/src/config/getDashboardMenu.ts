import { DASHBOARD_MENU } from './dashboardMenu';
import { isWorker } from '../utils/roles';

export function getDashboardMenu(role?: string) {
  return DASHBOARD_MENU.filter((item) => {
    if (!item.role) return true;
    if (item.role === 'WORKER') {
      return isWorker(role);
    }
    return true;
  });
}

