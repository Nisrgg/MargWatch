export const ROLES = {
  USER: 'USER',
  WORKER: 'WORKER',
  ADMIN: 'ADMIN',
} as const;

export type RoleValue = (typeof ROLES)[keyof typeof ROLES];

