import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { AuthenticatedRequest, WorkOrderRequest, ApiResponse } from '../types';
import { ComplaintStatus } from '@prisma/client';
import { FirebaseNotificationService } from '../services/firebaseNotificationService';
import { ControllerUtils } from '../utils/controllerUtils';

export class WorkOrderController {
  /**
   * Create a new work order (Admin)
   */
  static async createWorkOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json(ControllerUtils.createResponse(
          false,
          'Validation failed',
          undefined,
          errors.array().map(err => err.msg).join(', ')
        ));
        return;
      }

      const { complaintId, workerId, priority = 1 }: WorkOrderRequest = req.body;

      // Check if complaint exists and is approved
      const complaint = await prisma.complaint.findUnique({
        where: { id: complaintId },
      });

      if (!complaint) {
        res.status(404).json(ControllerUtils.createResponse(
          false,
          'Complaint not found'
        ));
        return;
      }

      if (complaint.status !== ComplaintStatus.APPROVED) {
        res.status(400).json(ControllerUtils.createResponse(
          false,
          'Complaint must be approved before creating work order'
        ));
        return;
      }

      // Check if worker exists
      const worker = await prisma.user.findUnique({
        where: { id: workerId },
      });

      if (!worker || worker.role !== 'WORKER') {
        res.status(400).json(ControllerUtils.createResponse(
          false,
          'Invalid worker selected'
        ));
        return;
      }

      // Create work order
      const workOrder = await prisma.workOrder.create({
        data: {
          complaintId,
          workerId,
          priority,
          status: ComplaintStatus.APPROVED,
        },
        include: {
          complaint: {
            select: {
              id: true,
              title: true,
              description: true,
              latitude: true,
              longitude: true,
              address: true,
            },
          },
          worker: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Update complaint status to processing
      await prisma.complaint.update({
        where: { id: complaintId },
        data: { status: ComplaintStatus.PROCESSING },
      });

      // Send notification to worker
      await FirebaseNotificationService.getInstance().createAndSendNotification(
        workerId,
        'New Work Order Assigned',
        `You have been assigned a new work order for complaint: ${workOrder.complaint.title}`,
        'work_assignment',
        {
          workOrderId: workOrder.id,
          complaintId: complaintId,
          priority: priority
        }
      );

      // Send notification to complaint owner
      await FirebaseNotificationService.getInstance().createAndSendNotification(
        complaint.userId,
        'Work Order Created',
        `A work order has been created for your complaint: ${workOrder.complaint.title}`,
        'complaint_status',
        {
          complaintId: complaintId,
          status: 'PROCESSING',
          workOrderId: workOrder.id
        }
      );

      const response: ApiResponse = ControllerUtils.createResponse(
        true,
        'Work order created successfully',
        { workOrder }
      );

      res.status(201).json(response);
    } catch (error) {
      const { message, error: errorMessage } = ControllerUtils.handleError(error, 'create work order');
      res.status(500).json(ControllerUtils.createResponse(false, message, undefined, errorMessage));
    }
  }

  /**
   * Get work orders for a worker
   */
  static async getWorkerOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const workerId = req.user!.id;
      const { page = 1, limit = 10, status } = req.query as any;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const where: any = { workerId };

      if (status) {
        where.status = status;
      }

      const [workOrders, total] = await Promise.all([
        prisma.workOrder.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { assignedAt: 'desc' },
          include: {
            complaint: {
              select: {
                id: true,
                title: true,
                description: true,
                latitude: true,
                longitude: true,
                address: true,
                imageUrl: true,
                category: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    phone: true,
                  },
                },
              },
            },
            updates: {
              orderBy: { createdAt: 'desc' },
            },
          },
        }),
        prisma.workOrder.count({ where }),
      ]);

      // Parse image URLs for each work order
      const workOrdersWithParsedImages = ControllerUtils.parseWorkOrdersImages(workOrders);

      const response: ApiResponse = ControllerUtils.createResponse(
        true,
        'Work orders retrieved successfully',
        {
          workOrders: workOrdersWithParsedImages,
          pagination: ControllerUtils.createPagination(parseInt(page), parseInt(limit), total),
        }
      );

      res.json(response);
    } catch (error) {
      const { message, error: errorMessage } = ControllerUtils.handleError(error, 'retrieve work orders');
      res.status(500).json(ControllerUtils.createResponse(false, message, undefined, errorMessage));
    }
  }

  /**
   * Update work order status (Worker)
   */
  static async updateWorkOrderStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, description, progress } = req.body;
      const imageUrl = req.body.imageUrl; // From Cloudinary middleware
      const workerId = req.user!.id;

      // Check if work order exists and belongs to the worker
      const workOrder = await prisma.workOrder.findFirst({
        where: {
          id,
          workerId,
        },
      });

      if (!workOrder) {
        res.status(404).json(ControllerUtils.createResponse(
          false,
          'Work order not found or access denied'
        ));
        return;
      }

      // Update work order
      const updateData: any = { status };
      
      if (status === ComplaintStatus.PROCESSING && !workOrder.startedAt) {
        updateData.startedAt = new Date();
      }
      
      if (status === ComplaintStatus.COMPLETED) {
        updateData.completedAt = new Date();
      }

      const updatedWorkOrder = await prisma.workOrder.update({
        where: { id },
        data: updateData,
      });

      // Create work order update record
      await prisma.workOrderUpdate.create({
        data: {
          workOrderId: id,
          status,
          description,
          progress,
          imageUrl,
        },
      });

      // Update complaint status if work order is completed
      if (status === ComplaintStatus.COMPLETED) {
        await prisma.complaint.update({
          where: { id: workOrder.complaintId },
          data: { status: ComplaintStatus.COMPLETED },
        });
      }

      const response: ApiResponse = ControllerUtils.createResponse(
        true,
        'Work order status updated successfully',
        { workOrder: updatedWorkOrder }
      );

      res.json(response);
    } catch (error) {
      const { message, error: errorMessage } = ControllerUtils.handleError(error, 'update work order status');
      res.status(500).json(ControllerUtils.createResponse(false, message, undefined, errorMessage));
    }
  }

  /**
   * Complete work order (Worker)
   */
  static async completeWorkOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { description, cost } = req.body;
      const workerId = req.user!.id;

      // Check if work order exists and belongs to the worker
      const workOrder = await prisma.workOrder.findFirst({
        where: {
          id,
          workerId,
        },
      });

      if (!workOrder) {
        res.status(404).json(ControllerUtils.createResponse(
          false,
          'Work order not found or access denied'
        ));
        return;
      }

      // Update work order with completion details
      const updatedWorkOrder = await prisma.workOrder.update({
        where: { id },
        data: {
          status: ComplaintStatus.COMPLETED,
          completedAt: new Date(),
          workDescription: description,
          cost: cost ? parseFloat(cost) : null,
        },
        include: {
          complaint: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      // Update complaint status
      await prisma.complaint.update({
        where: { id: workOrder.complaintId },
        data: { status: ComplaintStatus.COMPLETED },
      });

      // Create final work order update
      await prisma.workOrderUpdate.create({
        data: {
          workOrderId: id,
          status: ComplaintStatus.COMPLETED,
          description: description,
          progress: 100,
        },
      });

      const response: ApiResponse = ControllerUtils.createResponse(
        true,
        'Work order completed successfully',
        { workOrder: updatedWorkOrder }
      );

      res.json(response);
    } catch (error) {
      const { message, error: errorMessage } = ControllerUtils.handleError(error, 'complete work order');
      res.status(500).json(ControllerUtils.createResponse(false, message, undefined, errorMessage));
    }
  }

  /**
   * Get all work orders (Admin)
   */
  static async getAllWorkOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, status, workerId } = req.query as any;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const where: any = {};

      if (status) where.status = status;
      if (workerId) where.workerId = workerId;

      const [workOrders, total] = await Promise.all([
        prisma.workOrder.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { assignedAt: 'desc' },
          include: {
            complaint: {
              select: {
                id: true,
                title: true,
                description: true,
                latitude: true,
                longitude: true,
                address: true,
                category: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
            worker: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            updates: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        }),
        prisma.workOrder.count({ where }),
      ]);

      const response: ApiResponse = ControllerUtils.createResponse(
        true,
        'Work orders retrieved successfully',
        {
          workOrders,
          pagination: ControllerUtils.createPagination(parseInt(page), parseInt(limit), total),
        }
      );

      res.json(response);
    } catch (error) {
      const { message, error: errorMessage } = ControllerUtils.handleError(error, 'retrieve work orders');
      res.status(500).json(ControllerUtils.createResponse(false, message, undefined, errorMessage));
    }
  }

  /**
   * Get work order details for worker
   */
  static async getWorkOrderDetails(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const workerId = req.user!.id;

      const workOrder = await prisma.workOrder.findFirst({
        where: {
          id,
          workerId,
        },
        include: {
          complaint: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
          updates: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!workOrder) {
        res.status(404).json(ControllerUtils.createResponse(
          false,
          'Work order not found or access denied'
        ));
        return;
      }

      // Parse image URLs
      const workOrderWithParsedImages = ControllerUtils.parseWorkOrderImages(workOrder);

      const response: ApiResponse = ControllerUtils.createResponse(
        true,
        'Work order details retrieved successfully',
        { workOrder: workOrderWithParsedImages }
      );

      res.json(response);
    } catch (error) {
      const { message, error: errorMessage } = ControllerUtils.handleError(error, 'retrieve work order details');
      res.status(500).json(ControllerUtils.createResponse(false, message, undefined, errorMessage));
    }
  }

  /**
   * Update work status with enhanced validation (Worker)
   */
  static async updateWorkStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json(ControllerUtils.createResponse(
          false,
          'Validation failed',
          undefined,
          errors.array().map(err => err.msg).join(', ')
        ));
        return;
      }

      const { id } = req.params;
      const { status, description, progress, imageUrl } = req.body;
      const workerId = req.user!.id;

      // Convert progress to integer if provided
      let progressInt: number | null = null;
      if (progress !== undefined && progress !== null && progress !== '') {
        const parsed = parseInt(progress.toString());
        if (isNaN(parsed) || parsed < 0 || parsed > 100) {
          res.status(400).json(ControllerUtils.createResponse(
            false,
            'Progress must be a number between 0 and 100'
          ));
          return;
        }
        progressInt = parsed;
      }

      // Check if work order exists and belongs to the worker
      const workOrder = await prisma.workOrder.findFirst({
        where: {
          id,
          workerId,
        },
        include: {
          complaint: {
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
          },
        },
      });

      if (!workOrder) {
        res.status(404).json(ControllerUtils.createResponse(
          false,
          'Work order not found or access denied'
        ));
        return;
      }

      // Validate status transition
      const validTransitions: { [key in ComplaintStatus]?: ComplaintStatus[] } = {
        [ComplaintStatus.APPROVED]: [ComplaintStatus.PROCESSING],
        [ComplaintStatus.PROCESSING]: [ComplaintStatus.PROCESSING, ComplaintStatus.COMPLETED],
        [ComplaintStatus.COMPLETED]: [ComplaintStatus.COMPLETED],
      };

      if (!validTransitions[workOrder.status]?.includes(status)) {
        res.status(400).json(ControllerUtils.createResponse(
          false,
          `Invalid status transition from ${workOrder.status} to ${status}`
        ));
        return;
      }

      // Update work order
      const updateData: any = { status };
      
      if (status === ComplaintStatus.PROCESSING && workOrder.status !== ComplaintStatus.PROCESSING && !workOrder.startedAt) {
        updateData.startedAt = new Date();
      }
      
      if (status === ComplaintStatus.COMPLETED && workOrder.status !== ComplaintStatus.COMPLETED) {
        updateData.completedAt = new Date();
      }

      const updatedWorkOrder = await prisma.workOrder.update({
        where: { id },
        data: updateData,
      });

      // Create work order update record
      await prisma.workOrderUpdate.create({
        data: {
          workOrderId: id,
          status,
          description,
          progress: progressInt,
          imageUrl,
        },
      });

      // Update complaint status if work order is completed
      if (status === ComplaintStatus.COMPLETED) {
        await prisma.complaint.update({
          where: { id: workOrder.complaintId },
          data: { status: ComplaintStatus.COMPLETED },
        });

        // Notify all admins about completed work
        const admins = await prisma.user.findMany({
          where: { role: 'ADMIN' },
          select: { id: true }
        });

        if (admins.length > 0) {
          await FirebaseNotificationService.getInstance().sendToMultipleUsersByIds(
            admins.map(admin => admin.id),
            'Work Completed - Awaiting Approval',
            `Work on "${workOrder.complaint.title}" has been completed and is awaiting admin approval`,
            'work_completed',
            {
              workOrderId: id,
              complaintId: workOrder.complaintId,
              status: 'COMPLETED'
            }
          );
        }
      } else if (status === ComplaintStatus.PROCESSING && workOrder.status !== ComplaintStatus.PROCESSING) {
        // Only send notification if transitioning TO PROCESSING for the first time
        await FirebaseNotificationService.getInstance().createAndSendNotification(
          workOrder.complaint.userId,
          'Work Started',
          `Work on your complaint "${workOrder.complaint.title}" has started`,
          'work_progress',
          {
            workOrderId: id,
            complaintId: workOrder.complaintId,
            status: 'PROCESSING'
          }
        );
      } else if (status === ComplaintStatus.PROCESSING && workOrder.status === ComplaintStatus.PROCESSING) {
        // Send notification for progress updates within PROCESSING status
        await FirebaseNotificationService.getInstance().createAndSendNotification(
          workOrder.complaint.userId,
          'Work Progress Update',
          `Work on your complaint "${workOrder.complaint.title}" has been updated: ${description || 'Progress updated'}`,
          'work_progress',
          {
            workOrderId: id,
            complaintId: workOrder.complaintId,
            status: 'PROCESSING',
            progress: progressInt
          }
        );
      }

      const response: ApiResponse = ControllerUtils.createResponse(
        true,
        'Work status updated successfully',
        { workOrder: updatedWorkOrder }
      );

      res.json(response);
    } catch (error) {
      const { message, error: errorMessage } = ControllerUtils.handleError(error, 'update work status');
      res.status(500).json(ControllerUtils.createResponse(false, message, undefined, errorMessage));
    }
  }

  /**
   * Complete work order with proof images (Worker) - Enhanced version
   */
  static async completeWorkOrderEnhanced(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json(ControllerUtils.createResponse(
          false,
          'Validation failed',
          undefined,
          errors.array().map(err => err.msg).join(', ')
        ));
        return;
      }

      const { id } = req.params;
      const { description, workProofImages } = req.body;
      const workerId = req.user!.id;

      // Check if work order exists and belongs to the worker
      const workOrder = await prisma.workOrder.findFirst({
        where: {
          id,
          workerId,
        },
        include: {
          complaint: {
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
          },
        },
      });

      if (!workOrder) {
        res.status(404).json(ControllerUtils.createResponse(
          false,
          'Work order not found or access denied'
        ));
        return;
      }

      if (workOrder.status !== ComplaintStatus.PROCESSING) {
        res.status(400).json(ControllerUtils.createResponse(
          false,
          'Work order must be in processing status to complete'
        ));
        return;
      }

      // Update work order status to completed (awaiting admin approval)
      const updatedWorkOrder = await prisma.workOrder.update({
        where: { id },
        data: {
          status: ComplaintStatus.COMPLETED,
          completedAt: new Date(),
        },
        include: {
          complaint: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      // Update complaint status to completed (awaiting admin approval)
      await prisma.complaint.update({
        where: { id: workOrder.complaintId },
        data: { status: ComplaintStatus.COMPLETED },
      });

      // Create final work order update with proof images
      await prisma.workOrderUpdate.create({
        data: {
          workOrderId: id,
          status: ComplaintStatus.COMPLETED,
          description: description || 'Work completed successfully',
          progress: 100,
          imageUrl: workProofImages ? JSON.stringify(workProofImages) : req.body.imageUrl || null,
        },
      });

      // Notify all admins about completed work
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true }
      });

      if (admins.length > 0) {
        await FirebaseNotificationService.getInstance().sendToMultipleUsersByIds(
          admins.map(admin => admin.id),
          'Work Completed - Awaiting Final Approval',
          `Work on "${workOrder.complaint.title}" has been completed and is awaiting final admin approval`,
          'work_completed',
          {
            workOrderId: id,
            complaintId: workOrder.complaintId,
            status: 'COMPLETED'
          }
        );
      }

      const response: ApiResponse = ControllerUtils.createResponse(
        true,
        'Work order completed successfully',
        { workOrder: updatedWorkOrder }
      );

      res.json(response);
    } catch (error) {
      const { message, error: errorMessage } = ControllerUtils.handleError(error, 'complete work order');
      res.status(500).json(ControllerUtils.createResponse(false, message, undefined, errorMessage));
    }
  }
}

// Validation rules
export const createWorkOrderValidation = [
  body('complaintId').notEmpty().withMessage('Complaint ID is required'),
  body('workerId').notEmpty().withMessage('Worker ID is required'),
  body('priority').optional().isInt({ min: 1, max: 3 }).withMessage('Priority must be between 1 and 3'),
];

export const updateWorkOrderValidation = [
  body('status').isIn(Object.values(ComplaintStatus)).withMessage('Valid status is required'),
  body('description').optional().trim(),
  body('progress').optional().isInt({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100'),
  body('imageUrl').optional().trim(),
];

export const completeWorkOrderValidation = [
  body('description').optional().trim(),
  body('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be a positive number'),
];

export const updateWorkStatusValidation = [
  body('status').isIn(Object.values(ComplaintStatus)).withMessage('Valid status is required'),
  body('description').optional().trim(),
  body('progress').optional().custom((value) => {
    if (value === undefined || value === null || value === '') return true;
    const num = parseInt(value.toString());
    return !isNaN(num) && num >= 0 && num <= 100;
  }).withMessage('Progress must be a number between 0 and 100'),
  body('imageUrl').optional().trim(),
];

export const completeWorkValidation = [
  body('description').optional().trim(),
  body('workProofImages').optional().isArray().withMessage('Work proof images must be an array'),
];