import { ROLES } from '../constants/roles';

export function isWorker(role?: string | null) {
  return role === ROLES.WORKER;
}

export function isAdmin(role?: string | null) {
  return role === ROLES.ADMIN;
}

