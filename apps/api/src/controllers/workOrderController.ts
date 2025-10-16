import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { AuthenticatedRequest, WorkOrderRequest, WorkOrderApprovalRequest, ApiResponse } from '../types';
import { ComplaintStatus } from '@prisma/client';
import { FirebaseNotificationService } from '../services/firebaseNotificationService';
import { ControllerUtils } from '../utils/controllerUtils';

export class WorkOrderController {
  /**
   * Create a new work order (Admin)
   */
  static async createWorkOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('Creating work order with data:', req.body);
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        res.status(400).json(ControllerUtils.createResponse(
          false,
          'Validation failed',
          undefined,
          errors.array().map(err => err.msg).join(', ')
        ));
        return;
      }

      const { complaintId, workerId, priority = 1 }: WorkOrderRequest = req.body;
      console.log('Processing work order for complaint:', complaintId, 'worker:', workerId, 'priority:', priority);

      // Check if complaint exists and is approved
      console.log('Checking complaint:', complaintId);
      const complaint = await prisma.complaint.findUnique({
        where: { id: complaintId },
      });

      if (!complaint) {
        console.log('Complaint not found:', complaintId);
        res.status(404).json(ControllerUtils.createResponse(
          false,
          'Complaint not found'
        ));
        return;
      }

      console.log('Complaint found:', complaint.title, 'Status:', complaint.status);
      if (complaint.status !== ComplaintStatus.APPROVED) {
        console.log('Complaint not approved, status:', complaint.status);
        res.status(400).json(ControllerUtils.createResponse(
          false,
          'Complaint must be approved before creating work order'
        ));
        return;
      }

      // Check if worker exists
      console.log('Checking worker:', workerId);
      const worker = await prisma.user.findUnique({
        where: { id: workerId },
      });

      if (!worker || worker.role !== 'WORKER') {
        console.log('Invalid worker:', worker ? worker.role : 'not found');
        res.status(400).json(ControllerUtils.createResponse(
          false,
          'Invalid worker selected'
        ));
        return;
      }

      console.log('Worker found:', worker.firstName, worker.lastName);

      // Create work order
      console.log('Creating work order in database...');
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

      console.log('Work order created successfully:', workOrder.id);

      // Update complaint status to processing
      console.log('Updating complaint status to PROCESSING...');
      await prisma.complaint.update({
        where: { id: complaintId },
        data: { status: ComplaintStatus.PROCESSING },
      });
      console.log('Complaint status updated successfully');

      // Send notification to worker (with error handling)
      try {
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
      } catch (notificationError) {
        console.error('Failed to send notification to worker:', notificationError);
        // Continue execution - notification failure shouldn't break work order creation
      }

      // Send notification to complaint owner (with error handling)
      try {
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
      } catch (notificationError) {
        console.error('Failed to send notification to complaint owner:', notificationError);
        // Continue execution - notification failure shouldn't break work order creation
      }

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
      const { page = 1, limit = 10, status, workerId, adminApprovalStatus } = req.query as any;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const where: any = {};

      if (status) where.status = status;
      if (workerId) where.workerId = workerId;
      if (adminApprovalStatus) where.adminApprovalStatus = adminApprovalStatus;

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
          adminApprovalStatus: 'PENDING', // Set to pending admin approval
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

  /**
   * Get work orders pending admin approval
   */
  static async getPendingApprovals(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('Fetching work orders pending admin approval');

      const workOrders = await prisma.workOrder.findMany({
        where: {
          status: ComplaintStatus.COMPLETED,
          adminApprovalStatus: 'PENDING'
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
                  phone: true
                }
              }
            }
          },
          worker: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          updates: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 5
          }
        },
        orderBy: {
          completedAt: 'desc'
        }
      });

      console.log(`Found ${workOrders.length} work orders pending approval`);

      res.json(ControllerUtils.createResponse(
        true,
        'Pending approvals retrieved successfully',
        { workOrders }
      ));
    } catch (error) {
      const { message, error: errorMessage } = ControllerUtils.handleError(error, 'get pending approvals');
      res.status(500).json(ControllerUtils.createResponse(false, message, undefined, errorMessage));
    }
  }

  /**
   * Approve or reject work order completion (Admin)
   */
  static async approveWorkOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('Processing work order approval:', req.body);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        res.status(400).json(ControllerUtils.createResponse(
          false,
          'Validation failed',
          undefined,
          errors.array().map(err => err.msg).join(', ')
        ));
        return;
      }

      const { workOrderId, approvalStatus, rejectionReason }: WorkOrderApprovalRequest = req.body;
      const adminId = req.user?.id;

      if (!adminId) {
        res.status(401).json(ControllerUtils.createResponse(
          false,
          'Admin authentication required'
        ));
        return;
      }

      console.log(`Admin ${adminId} ${approvalStatus.toLowerCase()}ing work order ${workOrderId}`);

      // Check if work order exists and is pending approval
      const workOrder = await prisma.workOrder.findUnique({
        where: { id: workOrderId },
        include: {
          complaint: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  fcmToken: true
                }
              }
            }
          },
          worker: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              fcmToken: true
            }
          }
        }
      });

      if (!workOrder) {
        console.log('Work order not found:', workOrderId);
        res.status(404).json(ControllerUtils.createResponse(
          false,
          'Work order not found'
        ));
        return;
      }

      if (workOrder.adminApprovalStatus !== 'PENDING') {
        console.log('Work order not pending approval:', workOrder.adminApprovalStatus);
        res.status(400).json(ControllerUtils.createResponse(
          false,
          'Work order is not pending approval'
        ));
        return;
      }

      // Update work order with admin decision
      const updatedWorkOrder = await prisma.workOrder.update({
        where: { id: workOrderId },
        data: {
          adminApprovalStatus: approvalStatus,
          adminApprovedBy: adminId,
          adminApprovedAt: new Date(),
          adminRejectionReason: approvalStatus === 'REJECTED' ? rejectionReason : null,
          // If approved, update complaint status to COMPLETED
          ...(approvalStatus === 'APPROVED' && {
            complaint: {
              update: {
                status: ComplaintStatus.COMPLETED
              }
            }
          })
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
                  fcmToken: true
                }
              }
            }
          },
          worker: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              fcmToken: true
            }
          }
        }
      });

      console.log(`Work order ${workOrderId} ${approvalStatus.toLowerCase()}ed successfully`);

      // Send notifications
      try {
        const notificationService = FirebaseNotificationService.getInstance();

        if (approvalStatus === 'APPROVED') {
          // Notify user that their complaint is resolved
          if (workOrder.complaint.user.fcmToken) {
            await notificationService.sendToUser(
              workOrder.complaint.user.fcmToken,
              'Work Completed!',
              `Your complaint "${workOrder.complaint.title}" has been completed and approved by admin.`,
              {
                type: 'work_completed',
                complaintId: workOrder.complaintId,
                workOrderId: workOrderId
              }
            );
          }

          // Notify worker that their work was approved
          if (workOrder.worker.fcmToken) {
            await notificationService.sendToUser(
              workOrder.worker.fcmToken,
              'Work Approved!',
              `Your work on "${workOrder.complaint.title}" has been approved by admin.`,
              {
                type: 'work_approved',
                complaintId: workOrder.complaintId,
                workOrderId: workOrderId
              }
            );
          }
        } else {
          // Notify worker that their work was rejected
          if (workOrder.worker.fcmToken) {
            await notificationService.sendToUser(
              workOrder.worker.fcmToken,
              'Work Needs Revision',
              `Your work on "${workOrder.complaint.title}" was rejected. ${rejectionReason || 'Please review and resubmit.'}`,
              {
                type: 'work_rejected',
                complaintId: workOrder.complaintId,
                workOrderId: workOrderId
              }
            );
          }
        }
      } catch (notificationError) {
        console.error('Failed to send notifications:', notificationError);
        // Don't fail the request if notifications fail
      }

      res.json(ControllerUtils.createResponse(
        true,
        `Work order ${approvalStatus.toLowerCase()}ed successfully`,
        { workOrder: updatedWorkOrder }
      ));
    } catch (error) {
      const { message, error: errorMessage } = ControllerUtils.handleError(error, 'approve work order');
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

export const approveWorkOrderValidation = [
  body('workOrderId').notEmpty().withMessage('Work order ID is required'),
  body('approvalStatus').isIn(['APPROVED', 'REJECTED']).withMessage('Approval status must be APPROVED or REJECTED'),
  body('rejectionReason').optional().trim(),
];