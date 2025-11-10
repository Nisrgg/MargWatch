import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { ComplaintStatus, WorkOrderStatus, UserRole } from '@margwatch/shared-types';
import { FirebaseNotificationService } from '../services/firebaseNotificationService';
import { WebSocketService } from '../services/websocketService';
import { StateMachineValidator } from '../utils/stateMachineValidator';

export class AdminApprovalController {
  /**
   * Approve or reject a complaint (Admin)
   */
  static async approveRejectComplaint(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { id } = req.params;
      const { action, reason, assignedWorkerId, priority } = req.body;
      const adminId = req.user!.id;

      // Find the complaint
      const complaint = await prisma.complaint.findUnique({
        where: { id },
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

      if (!complaint) {
        res.status(404).json({
          success: false,
          message: 'Complaint not found',
        });
        return;
      }

      // Validate state transition using StateMachineValidator
      if (!StateMachineValidator.validateComplaintTransition(
        complaint.status as ComplaintStatus,
        action === 'approve' ? ComplaintStatus.APPROVED : ComplaintStatus.REJECTED,
        req.user!.role as UserRole
      )) {
        res.status(409).json({
          success: false,
          message: `Invalid state transition from ${complaint.status} to ${action === 'approve' ? 'APPROVED' : 'REJECTED'}`,
        });
        return;
      }

      let updatedComplaint;
      let workOrder = null;

      if (action === 'approve') {
        // Validate worker assignment
        if (!assignedWorkerId) {
          res.status(400).json({
            success: false,
            message: 'Worker assignment is required for approval',
          });
          return;
        }

        // Check if worker exists and is active
        const worker = await prisma.user.findUnique({
          where: { id: assignedWorkerId },
        });

        if (!worker || worker.role !== UserRole.WORKER || !worker.isActive) {
          res.status(400).json({
            success: false,
            message: 'Invalid or inactive worker selected',
          });
          return;
        }

        // Use database transaction to prevent race conditions
        try {
          const result = await prisma.$transaction(async (tx) => {
            // 1. Find the complaint with FOR UPDATE lock to prevent concurrent modifications
            const lockedComplaint = await tx.complaint.findUnique({
              where: { id },
            });

            if (!lockedComplaint) {
              throw new Error('Complaint not found');
            }

            // 2. Check if complaint is still in REGISTERED status
            if (lockedComplaint.status !== ComplaintStatus.REGISTERED) {
              throw new Error('Complaint has already been processed');
            }

            // 3. Update complaint status to approved
            const updatedComplaint = await tx.complaint.update({
              where: { id },
              data: {
                status: ComplaintStatus.APPROVED,
                approvedBy: adminId,
                approvedAt: new Date(),
              },
            });

            // 4. Create work order with new WorkOrderStatus
            const workOrder = await tx.workOrder.create({
              data: {
                complaintId: id,
                workerId: assignedWorkerId,
                priority: priority || 1,
                status: WorkOrderStatus.ASSIGNED,
              },
              include: {
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

            // 5. Create complaint update record
            await tx.complaintUpdate.create({
              data: {
                complaintId: id,
                status: ComplaintStatus.APPROVED,
                description: reason || 'Complaint approved and assigned to worker',
              },
            });

            return { updatedComplaint, workOrder };
          });

          updatedComplaint = result.updatedComplaint;
          workOrder = result.workOrder;
        } catch (transactionError) {
          console.error('Transaction failed during complaint approval:', transactionError);
          res.status(409).json({
            success: false,
            message: transactionError instanceof Error ? transactionError.message : 'Failed to process complaint approval',
          });
          return;
        }

        // Create notification for worker
        await FirebaseNotificationService.getInstance().createAndSendNotification(
          assignedWorkerId,
          'New Work Order Assigned',
          `You have been assigned a new work order: ${complaint.title}`,
          'work_assignment',
          {
            workOrderId: workOrder.id,
            complaintId: id,
            priority: priority || 1
          }
        );

        // Create notification for user
        await FirebaseNotificationService.getInstance().createAndSendNotification(
          complaint.userId,
          'Complaint Approved',
          `Your complaint "${complaint.title}" has been approved and assigned to a worker`,
          'complaint_status',
          {
            complaintId: id,
            status: 'APPROVED',
            workOrderId: workOrder.id
          }
        );

      } else if (action === 'reject') {
        // Check if complaint already has an active work order
        const existingWorkOrder = await prisma.workOrder.findFirst({
          where: {
            complaintId: id,
            status: {
              in: [WorkOrderStatus.ASSIGNED, WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.PENDING_REVIEW]
            }
          }
        });

        if (existingWorkOrder) {
          res.status(409).json({
            success: false,
            message: 'Cannot reject a complaint that already has an active work order',
          });
          return;
        }

        // Update complaint status to rejected with rejection reason
        updatedComplaint = await prisma.complaint.update({
          where: { id },
          data: {
            status: ComplaintStatus.REJECTED,
            approvedBy: adminId,
            approvedAt: new Date(),
            rejectionReason: reason || 'No reason provided',
          },
        });

        // Create complaint update record
        await prisma.complaintUpdate.create({
          data: {
            complaintId: id,
            status: ComplaintStatus.REJECTED,
            description: reason || 'Complaint rejected by admin',
          },
        });

        // Create notification for user
        await FirebaseNotificationService.getInstance().createAndSendNotification(
          complaint.userId,
          'Complaint Rejected',
          `Your complaint "${complaint.title}" has been rejected. Reason: ${reason || 'No reason provided'}`,
          'complaint_status',
          {
            complaintId: id,
            status: 'REJECTED',
            reason: reason
          }
        );
      } else {
        res.status(400).json({
          success: false,
          message: 'Invalid action. Use "approve" or "reject"',
        });
        return;
      }

      // Send WebSocket notifications for real-time updates
      try {
        const wsService = WebSocketService.getInstance();
        
        // Broadcast complaint update to all connected users
        wsService.broadcast({
          type: 'complaint_update',
          data: {
            complaintId: updatedComplaint.id,
            status: updatedComplaint.status,
            action: action,
            workOrderId: workOrder?.id,
            updatedAt: updatedComplaint.updatedAt,
          },
          timestamp: new Date().toISOString(),
        });
        
        console.log(`📡 WebSocket notification sent for complaint ${action}`);
      } catch (wsError) {
        console.error('Failed to send WebSocket notification:', wsError);
        // Continue with response even if WebSocket fails
      }

      const response: ApiResponse = {
        success: true,
        message: `Complaint ${action}d successfully`,
        data: {
          complaint: updatedComplaint,
          workOrder: workOrder,
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Approve/reject complaint error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process complaint',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
      });
    }
  }

  /**
   * Get pending complaints for admin review
   */
  static async getPendingComplaints(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10 } = req.query as { page?: string; limit?: string };

      const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));

      const [complaints, total] = await Promise.all([
        prisma.complaint.findMany({
          where: { status: ComplaintStatus.REGISTERED },
          skip,
          take: parseInt(String(limit)),
          orderBy: { createdAt: 'desc' },
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
        }),
        prisma.complaint.count({ where: { status: ComplaintStatus.REGISTERED } }),
      ]);

      // Parse image URLs for each complaint
      const complaintsWithParsedImages = complaints.map(complaint => ({
        ...complaint,
        imageUrls: JSON.parse(complaint.imageUrl || '[]'),
      }));

      const response: ApiResponse = {
        success: true,
        message: 'Pending complaints retrieved successfully',
        data: {
          complaints: complaintsWithParsedImages,
          pagination: {
        page: parseInt(String(page)),
        limit: parseInt(String(limit)),
        total,
        pages: Math.ceil(total / parseInt(String(limit))),
          },
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Get pending complaints error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve pending complaints',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
      });
    }
  }

  /**
   * Get available workers for assignment
   */
  static async getAvailableWorkers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const workers = await prisma.user.findMany({
        where: {
          role: UserRole.WORKER,
          isActive: true,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          createdAt: true,
          _count: {
            select: {
              workOrders: {
                where: {
                  status: {
                    in: [WorkOrderStatus.ASSIGNED, WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.PENDING_REVIEW],
                  },
                },
              },
            },
          },
        },
        orderBy: {
          firstName: 'asc',
        },
      });

      // Add workload information
      const workersWithWorkload = workers.map(worker => ({
        ...worker,
        currentWorkload: worker._count.workOrders,
        isAvailable: worker._count.workOrders < 5, // Max 5 active work orders per worker
      }));

      const response: ApiResponse = {
        success: true,
        message: 'Available workers retrieved successfully',
        data: { workers: workersWithWorkload },
      };

      res.json(response);
    } catch (error) {
      console.error('Get available workers error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve workers',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
      });
    }
  }

  /**
   * Final approval of completed work (Admin)
   */
  static async finalApproveWork(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { workOrderId } = req.params;
      const { action = 'approve', adminNotes } = req.body; // Default action to 'approve'
      const adminId = req.user!.id;

      // Find the work order
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
        },
      });

      if (!workOrder) {
        res.status(404).json({
          success: false,
          message: 'Work order not found',
        });
        return;
      }

      if (workOrder.status !== WorkOrderStatus.PENDING_REVIEW) {
        res.status(400).json({
          success: false,
          message: 'Work order must be in PENDING_REVIEW status before final approval',
        });
        return;
      }

      let updatedWorkOrder;
      let updatedComplaint;

      if (action === 'approve') {
        // Update work order admin approval status and set completedAt
        updatedWorkOrder = await prisma.workOrder.update({
          where: { id: workOrderId },
          data: {
            status: WorkOrderStatus.COMPLETED,
            adminApprovalStatus: 'APPROVED',
            adminApprovedBy: adminId,
            adminApprovedAt: new Date(),
            completedAt: new Date(),
          },
        });

        // Update complaint status to completed (final approval)
        updatedComplaint = await prisma.complaint.update({
          where: { id: workOrder.complaintId },
          data: {
            status: ComplaintStatus.COMPLETED,
          },
        });

        // Create final work order update (admin approval)
        await prisma.workOrderUpdate.create({
          data: {
            workOrderId,
            status: WorkOrderStatus.COMPLETED,
            description: adminNotes || 'Work completed and approved by admin',
            progress: 100,
          },
        });

        // Create notification for user
        try {
          await FirebaseNotificationService.getInstance().createAndSendNotification(
            workOrder.complaint.userId,
            'Complaint Resolved',
            `Your complaint "${workOrder.complaint.title}" has been successfully resolved!`,
            'complaint_resolved',
            {
              workOrderId: workOrderId,
              complaintId: workOrder.complaintId,
              status: 'COMPLETED'
            }
          );
        } catch (notificationError) {
          console.error('Failed to send notification to user:', notificationError);
        }

        // Create notification for worker
        try {
          await FirebaseNotificationService.getInstance().createAndSendNotification(
            workOrder.workerId,
            'Work Approved',
            `Your work on "${workOrder.complaint.title}" has been approved by admin`,
            'work_approved',
            {
              workOrderId: workOrderId,
              complaintId: workOrder.complaintId,
              status: 'COMPLETED'
            }
          );
        } catch (notificationError) {
          console.error('Failed to send notification to worker:', notificationError);
        }

      } else if (action === 'reject') {
        // Update work order admin approval status and increment rework count
        updatedWorkOrder = await prisma.workOrder.update({
          where: { id: workOrderId },
          data: {
            status: WorkOrderStatus.IN_PROGRESS,
            adminApprovalStatus: 'REJECTED',
            adminApprovedBy: adminId,
            adminApprovedAt: new Date(),
            adminRejectionReason: adminNotes,
            reworkCount: { increment: 1 },
          },
        });

        // Update complaint status back to processing (rejection)
        updatedComplaint = await prisma.complaint.update({
          where: { id: workOrder.complaintId },
          data: {
            status: ComplaintStatus.PROCESSING,
          },
        });

        // Create work order update
        await prisma.workOrderUpdate.create({
          data: {
            workOrderId,
            status: WorkOrderStatus.IN_PROGRESS,
            description: adminNotes || 'Work rejected by admin, please revise',
            progress: 50,
          },
        });

        // Create notification for worker
        try {
          await FirebaseNotificationService.getInstance().createAndSendNotification(
            workOrder.workerId,
            'Work Needs Revision',
            `Your work on "${workOrder.complaint.title}" needs revision. Admin notes: ${adminNotes || 'Please check and resubmit'}`,
            'work_revision',
            {
              workOrderId: workOrderId,
              complaintId: workOrder.complaintId,
              status: 'IN_PROGRESS'
            }
          );
        } catch (notificationError) {
          console.error('Failed to send notification to worker:', notificationError);
        }
      } else {
        res.status(400).json({
          success: false,
          message: 'Invalid action. Use "approve" or "reject"',
        });
        return;
      }

      // Send WebSocket notifications for real-time updates
      try {
        const wsService = WebSocketService.getInstance();
        
        // Broadcast work order update to all connected users
        wsService.broadcast({
          type: 'work_order_update',
          data: {
            workOrderId: updatedWorkOrder.id,
            complaintId: updatedWorkOrder.complaintId,
            status: updatedWorkOrder.status,
            action: action,
            updatedAt: updatedWorkOrder.updatedAt,
          },
          timestamp: new Date().toISOString(),
        });
        
        console.log(`📡 WebSocket notification sent for work order ${action}`);
      } catch (wsError) {
        console.error('Failed to send WebSocket notification:', wsError);
        // Continue with response even if WebSocket fails
      }

      const response: ApiResponse = {
        success: true,
        message: `Work ${action}d successfully`,
        data: {
          workOrder: updatedWorkOrder,
          complaint: updatedComplaint,
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Final approve work error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process final approval',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
      });
    }
  }
}

// Validation rules
export const approveRejectValidation = [
  body('action').isIn(['approve', 'reject']).withMessage('Action must be "approve" or "reject"'),
  body('reason').optional().trim(),
  body('assignedWorkerId').optional().isString().withMessage('Worker ID must be a string'),
  body('priority').optional().isInt({ min: 1, max: 3 }).withMessage('Priority must be between 1 and 3'),
];

export const finalApprovalValidation = [
  body('action').optional().isIn(['approve', 'reject']).withMessage('Action must be "approve" or "reject"'),
  body('adminNotes').optional().trim(),
];
