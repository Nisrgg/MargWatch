import { Complaint, WorkOrder } from '@prisma/client';

/**
 * Utility functions for common operations across controllers
 */
export class ControllerUtils {
  /**
   * Parse image URLs from JSON string
   */
  static parseImageUrls(imageUrl: string | null): string[] {
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
  static parseWorkOrderImages(workOrder: WorkOrder & { complaint: Complaint }): WorkOrder & { 
    complaint: Complaint & { imageUrls: string[] } 
  } {
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
  static parseWorkOrdersImages(workOrders: any[]): any[] {
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
  static createResponse(success: boolean, message: string, data?: any, error?: string) {
    const response: any = {
      success,
      message,
    };

    if (data) response.data = data;
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
}
