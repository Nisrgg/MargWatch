/**
 * User role enumeration
 * Defines the different types of users in the MargWatch system
 */
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  WORKER = 'WORKER'
}

export type UserRoleType = keyof typeof UserRole;
