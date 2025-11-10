import { Complaint, WorkOrder, ApiResponse } from '@margwatch/shared-types';

/**
 * Utility functions for common operations across controllers
 */
export class ControllerUtils {
  /**
   * Parse image URLs from JSON string
   */
  static parseImageUrls(imageUrl: string | null | undefined): string[] {
    try {
      return imageUrl ? JSON.parse(imageUrl) : [];
    } catch (error) {
      console.warn('Failed to parse image URLs:', error);
      return [];
    }
  }

  /**
   * Parse complaint with image URLs
   */
  static parseComplaintImages(complaint: Complaint): Complaint & { imageUrls: string[] } {
    return {
      ...complaint,
      imageUrls: this.parseImageUrls(complaint.imageUrl),
    };
  }

  /**
   * Parse work order with complaint images
   */
  static parseWorkOrderImages(workOrder: any): any {
    return {
      ...workOrder,
      complaint: this.parseComplaintImages(workOrder.complaint),
    };
  }

  /**
   * Parse multiple complaints with images
   */
  static parseComplaintsImages(complaints: Complaint[]): Array<Complaint & { imageUrls: string[] }> {
    return complaints.map(complaint => this.parseComplaintImages(complaint));
  }

  /**
   * Parse multiple work orders with images
   */
  static parseWorkOrdersImages(workOrders: Array<any>): Array<any> {
    return workOrders.map(workOrder => {
      if (workOrder.complaint) {
        return {
          ...workOrder,
          complaint: {
            ...workOrder.complaint,
            imageUrls: this.parseImageUrls(workOrder.complaint.imageUrl),
          },
        };
      }
      return workOrder;
    });
  }

  /**
   * Create standardized API response
   */
  static createResponse<T = unknown>(success: boolean, message: string, data?: T, error?: string): ApiResponse<T> {
    const response: ApiResponse<T> = {
      success,
      message,
    };

    if (data !== undefined) response.data = data;
    if (error) response.error = error;

    return response;
  }

  /**
   * Create pagination object
   */
  static createPagination(page: number, limit: number, total: number) {
    return {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Handle controller errors consistently
   */
  static handleError(error: unknown, operation: string): { message: string; error?: string } {
    console.error(`${operation} error:`, error);
    
    const message = `Failed to ${operation.toLowerCase()}`;
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? (error instanceof Error ? error.message : String(error))
      : undefined;

    return { message, error: errorMessage };
  }

  /**
   * Filter user data for safe API responses
   * Removes sensitive fields based on requesting user's role
   */
  static filterUserForResponse(user: any, requestingUserRole?: string): any {
    if (!user) return null;

    // Base safe fields that can be shown to anyone
    const safeFields = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    // Only admins can see email addresses
    if (requestingUserRole === 'ADMIN') {
      return {
        ...safeFields,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    }

    // Regular users and workers only see basic info
    return safeFields;
  }

  /**
   * Filter multiple users for safe API responses
   */
  static filterUsersForResponse(users: any[], requestingUserRole?: string): any[] {
    return users.map(user => this.filterUserForResponse(user, requestingUserRole));
  }

  /**
   * Validate and sanitize pagination parameters
   */
  static validatePaginationParams(page?: string, limit?: string): { 
    page: number; 
    limit: number; 
    skip: number 
  } {
    const MAX_LIMIT = 100;
    const DEFAULT_PAGE = 1;
    const DEFAULT_LIMIT = 10;

    // Parse page parameter
    let parsedPage = DEFAULT_PAGE;
    if (page !== undefined && page !== null && page !== '') {
      const pageNum = parseInt(page.toString(), 10);
      if (!isNaN(pageNum) && pageNum > 0) {
        parsedPage = pageNum;
      }
    }

    // Parse limit parameter
    let parsedLimit = DEFAULT_LIMIT;
    if (limit !== undefined && limit !== null && limit !== '') {
      const limitNum = parseInt(limit.toString(), 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        // Clamp limit to maximum allowed value
        parsedLimit = Math.min(limitNum, MAX_LIMIT);
      }
    }

    const skip = (parsedPage - 1) * parsedLimit;

    return {
      page: parsedPage,
      limit: parsedLimit,
      skip,
    };
  }
}
