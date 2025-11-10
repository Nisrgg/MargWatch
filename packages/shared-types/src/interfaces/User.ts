import { UserRole } from '../enums/UserRole';

/**
 * User interface
 * Represents a user in the MargWatch system
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  fcmToken?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  _count?: {
    complaints: number;
    workOrders: number;
  };
}

/**
 * User creation request interface
 */
export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

/**
 * User update request interface
 */
export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  isActive?: boolean;
}

/**
 * User filters interface
 */
export interface UserFilters {
  page?: number;
  limit?: number;
  role?: UserRole | string;
  search?: string;
  status?: string;
}
