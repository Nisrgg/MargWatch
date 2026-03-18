import { Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { AuthenticatedRequest, ApiResponse, PaginationParams, FilterParams } from '../types';
import { FirebaseNotificationService } from '../services/firebaseNotificationService';
import { ComplaintStatus, IssueCategory } from '@margwatch/shared-types';
import mlService from '../services/mlService';
import geolocationService from '../services/geolocationService';
import complaintGenerationService from '../services/complaintGenerationService';
import { ControllerUtils } from '../utils/controllerUtils';

export class ComplaintController {
  /**
   * Submit a new complaint (simplified: images + location only)
   */
  static async submitComplaint(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: errors.array().map(err => err.msg).join(', '),
        });
        return;
      }

      const { latitude, longitude, imageUrls } = req.body;
      const userId = req.user!.id;

      // Convert coordinates to numbers
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);

      // Validate coordinates (basic validation only - no service area restriction for Pan India)
      const basicValidation = geolocationService.validateCoordinates(lat, lon);
      if (!basicValidation) {
        res.status(400).json({
          success: false,
          message: 'Invalid coordinates provided. Latitude must be between -90 and 90, longitude between -180 and 180.',
        });
        return;
      }
      
      // Log if coordinates are outside India bounds (warning only, not blocking)
      const isInIndiaBounds = geolocationService.validateServiceArea(lat, lon);
      if (!isInIndiaBounds) {
        console.log(`⚠️ Warning: Complaint submitted from outside India bounds: ${lat}, ${lon}`);
      }

      // Check if images were uploaded
      if (!imageUrls || imageUrls.length === 0) {
        res.status(400).json({
          success: false,
          message: 'At least one image is required',
        });
        return;
      }

      // Auto-detect address from coordinates
      let address: string | null = null;
      try {
        const locationData = await geolocationService.reverseGeocode(lat, lon);
        address = locationData.address || null;
        console.log('✅ Auto-detected address:', address);
      } catch (geoError) {
        console.warn('Address detection failed, continuing without address:', geoError);
        address = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
      }

      // Default category (will be updated by ML)
      let predictedCategory: IssueCategory = IssueCategory.OTHER;
      let mlConfidence = 0.5;
      let mlModelVersion = 'fallback';
      let mlProcessingTime = 0;

      // ML processing with Cloudinary images
      try {
        console.log(`🔮 Starting ML processing for ${imageUrls.length} images`);
        
        // Check if ML service is available
        const mlAvailable = await mlService.isAvailable();
        
        if (mlAvailable && imageUrls.length > 0) {
          // Use the first image for ML prediction (can be enhanced to use multiple images)
          const mlPrediction = await mlService.predictIssueCategory(imageUrls[0]);
          predictedCategory = mlPrediction.category;
          mlConfidence = mlPrediction.confidence;
          mlModelVersion = mlPrediction.modelVersion || 'unknown';
          mlProcessingTime = mlPrediction.processingTime || 0;
          
          console.log(`✅ ML prediction: ${predictedCategory} (confidence: ${mlConfidence})`);
        } else {
          console.warn('⚠️ ML service unavailable or no images, using default category');
        }
      } catch (mlError) {
        console.error('❌ ML processing error:', mlError);
        // Continue with default category
      }

      // Auto-generate title and description
      const { title, description } = await complaintGenerationService.generateComplaintData(
        predictedCategory,
        lat,
        lon,
        imageUrls.length,
        address || undefined
      );

      // Store images as JSON array of URLs
      const imageUrlsJson = JSON.stringify(imageUrls);

      // Check for duplicate complaints within 50 meters and 24 hours
      const duplicateCheck = await ComplaintController.checkForDuplicateComplaint(
        lat,
        lon,
        predictedCategory,
        userId
      );

      if (duplicateCheck.isDuplicate) {
        res.status(409).json({
          success: false,
          message: 'A similar issue has already been reported in this area recently.',
        });
        return;
      }

      // Create complaint
      const complaint = await prisma.complaint.create({
        data: {
          title,
          description,
          latitude: lat,
          longitude: lon,
          address: address,
          imageUrl: imageUrlsJson, // Store as JSON array
          imageCount: imageUrls.length,
          category: predictedCategory,
          mlCategory: predictedCategory,
          mlConfidence,
          mlModelVersion,
          mlProcessingTime,
          userId,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Prepare response data
      const responseData = {
        complaint: {
          ...complaint,
          imageUrls: JSON.parse(complaint.imageUrl || '[]'), // Parse JSON for response
        }
      };

      // Send notifications BEFORE sending response to ensure proper timing
      try {
        // Notify the user who submitted
        await FirebaseNotificationService.getInstance().createAndSendNotification(
          complaint.userId,
          'Complaint Submitted Successfully',
          `Your complaint "${complaint.title}" has been submitted and is under review.`,
          'complaint_status',
          {
            complaintId: complaint.id,
            status: 'REGISTERED'
          }
        );

        // Notify all admins about new complaint
        const admins = await prisma.user.findMany({
          where: { role: 'ADMIN' },
          select: { id: true, firstName: true, lastName: true }
        });

        if (admins.length > 0) {
          await FirebaseNotificationService.getInstance().sendToMultipleUsersByIds(
            admins.map(admin => admin.id),
            'New Complaint Submitted',
            `A new complaint "${complaint.title}" has been submitted and requires review.`,
            'complaint_status',
            {
              complaintId: complaint.id,
              status: 'REGISTERED',
              priority: 'HIGH'
            }
          );
          console.log(`📢 Published notifications for ${admins.length} admins`);
        } else {
          console.warn('No admins found to notify');
        }

        // Notify all workers about new complaint via topic subscription
        // Workers subscribe to 'complaint_created' topic to receive notifications
        try {
          await FirebaseNotificationService.getInstance().sendToTopic(
            'complaint_created',
            'New Complaint Available',
            `A new complaint "${complaint.title}" has been submitted and is available for assignment.`,
            {
              complaintId: complaint.id,
              status: 'REGISTERED',
              category: complaint.category,
              priority: 'HIGH',
              type: 'complaint_created'
            }
          );
          console.log(`📢 Topic notification sent to 'complaint_created' topic for workers`);
        } catch (topicError) {
          console.error('Failed to send topic notification to workers:', topicError);
        }
      } catch (notificationError) {
        console.error('Failed to create notifications:', notificationError);
        // Continue with response even if notifications fail
      }

      // Send response after notifications are sent
      const response: ApiResponse = {
        success: true,
        message: 'Complaint submitted successfully',
        data: responseData,
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Submit complaint error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit complaint',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
      });
    }
  }

  /**
   * Get user's complaints
   */
  static async getUserComplaints(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { page, limit, status, category } = req.query as { 
        page?: string; 
        limit?: string; 
        status?: string; 
        category?: string; 
      };

      // Validate and sanitize pagination parameters
      const { page: validatedPage, limit: validatedLimit, skip } = ControllerUtils.validatePaginationParams(page, limit);
      
      const where: any = { userId };

      if (status) {
        where.status = status;
      }
      if (category) {
        where.category = category;
      }

      const [complaints, total] = await Promise.all([
        prisma.complaint.findMany({
          where,
          skip,
          take: validatedLimit,
          orderBy: { createdAt: 'desc' },
          include: {
            workOrders: {
              include: {
                worker: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
                updates: {
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
        }),
        prisma.complaint.count({ where }),
      ]);

      // Parse image URLs and filter user data for each complaint
      const complaintsWithParsedImages = complaints.map(complaint => ({
        ...complaint,
        imageUrls: JSON.parse(complaint.imageUrl || '[]'),
        workOrders: complaint.workOrders.map(workOrder => ({
          ...workOrder,
          worker: ControllerUtils.filterUserForResponse(workOrder.worker, req.user!.role),
        })),
      }));

      const response: ApiResponse = {
        success: true,
        message: 'Complaints retrieved successfully',
        data: {
          complaints: complaintsWithParsedImages,
          pagination: {
            page: validatedPage,
            limit: validatedLimit,
            total,
            pages: Math.ceil(total / validatedLimit),
          },
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Get user complaints error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve complaints',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
      });
    }
  }

  /**
   * Get complaint by ID
   */
  static async getComplaintById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Build where clause based on user role and ownership
      const whereClause: any = { id };
      
      // If user is not ADMIN, they can only access their own complaints
      if (userRole !== 'ADMIN') {
        whereClause.userId = userId;
      }

      const complaint = await prisma.complaint.findFirst({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          workOrders: {
            include: {
              worker: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
              updates: {
                orderBy: { createdAt: 'desc' },
              },
            },
          },
          updates: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!complaint) {
        res.status(404).json({
          success: false,
          message: 'Complaint not found',
        });
        return;
      }

      // Parse image URLs and filter user data
      const complaintWithParsedImages = {
        ...complaint,
        imageUrls: JSON.parse(complaint.imageUrl || '[]'),
        user: ControllerUtils.filterUserForResponse(complaint.user, userRole),
        workOrders: complaint.workOrders.map(workOrder => ({
          ...workOrder,
          worker: ControllerUtils.filterUserForResponse(workOrder.worker, userRole),
        })),
      };

      const response: ApiResponse = {
        success: true,
        message: 'Complaint retrieved successfully',
        data: { complaint: complaintWithParsedImages },
      };

      res.json(response);
    } catch (error) {
      console.error('Get complaint error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve complaint',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
      });
    }
  }

  /**
   * Get all complaints (Admin/Worker)
   */
  static async getAllComplaints(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page, limit, status, category, userId, workerId } = req.query as { 
        page?: string; 
        limit?: string; 
        status?: string; 
        category?: string; 
        userId?: string; 
        workerId?: string; 
      };

      // Validate and sanitize pagination parameters
      const { page: validatedPage, limit: validatedLimit, skip } = ControllerUtils.validatePaginationParams(page, limit);
      
      const where: any = {};

      if (status) where.status = status;
      if (category) where.category = category;
      if (userId) where.userId = userId;
      if (workerId) {
        where.workOrders = {
          some: { workerId },
        };
      }

      const [complaints, total] = await Promise.all([
        prisma.complaint.findMany({
          where,
          skip,
          take: validatedLimit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            workOrders: {
              include: {
                worker: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        }),
        prisma.complaint.count({ where }),
      ]);

      // Parse image URLs and filter user data for each complaint
      const complaintsWithParsedImages = complaints.map(complaint => ({
        ...complaint,
        imageUrls: JSON.parse(complaint.imageUrl || '[]'),
        user: ControllerUtils.filterUserForResponse(complaint.user, req.user!.role),
        workOrders: complaint.workOrders.map(workOrder => ({
          ...workOrder,
          worker: ControllerUtils.filterUserForResponse(workOrder.worker, req.user!.role),
        })),
      }));

      const response: ApiResponse = {
          success: true,
          message: 'Complaints retrieved successfully',
        data: {
          complaints: complaintsWithParsedImages,
          pagination: {
            page: validatedPage,
            limit: validatedLimit,
            total,
            pages: Math.ceil(total / validatedLimit),
          },
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Get all complaints error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve complaints',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
      });
    }
  }

  /**
   * Update complaint status (Admin)
   */
  static async updateComplaintStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, description } = req.body;
      const adminId = req.user!.id;

      const complaint = await prisma.complaint.findUnique({
        where: { id },
      });

      if (!complaint) {
        res.status(404).json({
          success: false,
          message: 'Complaint not found',
        });
        return;
      }

      // Update complaint status
      const updatedComplaint = await prisma.complaint.update({
        where: { id },
        data: {
          status,
          approvedBy: adminId,
          approvedAt: new Date(),
        },
      });

      // Create complaint update record
      await prisma.complaintUpdate.create({
        data: {
          complaintId: id,
          status,
          description,
        },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Complaint status updated successfully',
        data: { complaint: updatedComplaint },
      };

      res.json(response);
    } catch (error) {
      console.error('Update complaint status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update complaint status',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
      });
    }
  }

  /**
   * Get heat map data
   */
  static async getHeatMapData(req: Request, res: Response): Promise<void> {
    try {
      const { category, dateFrom, dateTo } = req.query as { 
        category?: string; 
        dateFrom?: string; 
        dateTo?: string; 
      };

      const where: any = {};
      if (category) where.category = category;
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo);
      }

      const complaints = await prisma.complaint.findMany({
        where,
        select: {
          latitude: true,
          longitude: true,
          category: true,
        },
      });

      const heatMapData = geolocationService.generateHeatMapData(
        complaints.map(c => ({
          latitude: Number(c.latitude),
          longitude: Number(c.longitude),
          category: c.category,
        }))
      );

      const response: ApiResponse = {
        success: true,
        message: 'Heat map data retrieved successfully',
        data: { heatMapData },
      };

      res.json(response);
    } catch (error) {
      console.error('Get heat map data error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve heat map data',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
      });
    }
  }

  /**
   * Check for duplicate complaints within a radius and time frame
   */
  private static async checkForDuplicateComplaint(
    latitude: number,
    longitude: number,
    category: string,
    userId: string,
    radiusMeters: number = 50,
    timeHours: number = 24
  ): Promise<{ isDuplicate: boolean; duplicateComplaint?: any }> {
    try {
      // Calculate bounding box for the radius (approximate)
      // 1 degree latitude ≈ 111 km, so 50 meters ≈ 0.00045 degrees
      const latDelta = radiusMeters / 111000; // Convert meters to degrees
      const lonDelta = radiusMeters / (111000 * Math.cos(latitude * Math.PI / 180)); // Adjust for longitude

      const timeThreshold = new Date();
      timeThreshold.setHours(timeThreshold.getHours() - timeHours);

      // Find complaints within the bounding box, same category, and time frame
      const nearbyComplaints = await prisma.complaint.findMany({
        where: {
          category: category as any,
          createdAt: {
            gte: timeThreshold,
          },
          latitude: {
            gte: latitude - latDelta,
            lte: latitude + latDelta,
          },
          longitude: {
            gte: longitude - lonDelta,
            lte: longitude + lonDelta,
          },
          // Exclude complaints from the same user
          userId: {
            not: userId,
          },
        },
        select: {
          id: true,
          latitude: true,
          longitude: true,
          category: true,
          createdAt: true,
          userId: true,
        },
      });

      // Calculate exact distances and check if any are within the radius
      for (const complaint of nearbyComplaints) {
        const distance = geolocationService.calculateDistance(
          latitude,
          longitude,
          Number(complaint.latitude),
          Number(complaint.longitude)
        );

        // Convert distance from km to meters
        const distanceMeters = distance * 1000;

        if (distanceMeters <= radiusMeters) {
          return {
            isDuplicate: true,
            duplicateComplaint: complaint,
          };
        }
      }

      return { isDuplicate: false };
    } catch (error) {
      console.error('Error checking for duplicate complaints:', error);
      // If there's an error, allow the complaint to proceed
      return { isDuplicate: false };
    }
  }
}

// Validation rules for simplified complaint submission (no address required)
export const submitComplaintValidation = [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
];

export const updateStatusValidation = [
  body('status').isIn(Object.values(ComplaintStatus)).withMessage('Valid status is required'),
  body('description').optional().trim(),
];