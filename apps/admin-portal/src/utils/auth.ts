import Cookies from 'js-cookie';
import { AuthUser } from '@/types';

// Helper function to check if we're on the client side
const isClient = typeof window !== 'undefined';

export const authUtils = {
  // Token management
  setToken(token: string): void {
    Cookies.set('admin_token', token, { expires: 7, secure: true, sameSite: 'strict' });
  },

  getToken(): string | undefined {
    return Cookies.get('admin_token');
  },

  removeToken(): void {
    Cookies.remove('admin_token');
  },

  // User data management
  setUser(user: AuthUser): void {
    if (isClient) {
      localStorage.setItem('admin_user', JSON.stringify(user));
    }
  },

  getUser(): AuthUser | null {
    if (!isClient) return null;
    try {
      const user = localStorage.getItem('admin_user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
      return null;
    }
  },

  removeUser(): void {
    if (isClient) {
      localStorage.removeItem('admin_user');
    }
  },

  // Auth state
  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getUser();
  },

  isAdmin(): boolean {
    const user = this.getUser();
    return user?.role === 'ADMIN';
  },

  // Logout
  logout(): void {
    this.removeToken();
    this.removeUser();
  },

  // Format user name
  getUserDisplayName(user?: AuthUser): string {
    if (!user) {
      const currentUser = this.getUser();
      if (!currentUser) return 'Admin';
      user = currentUser;
    }
    return `${user.firstName} ${user.lastName}`;
  },

  // Format user initials
  getUserInitials(user?: AuthUser): string {
    if (!user) {
      const currentUser = this.getUser();
      if (!currentUser) return 'A';
      user = currentUser;
    }
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  },
};

export default authUtils;
