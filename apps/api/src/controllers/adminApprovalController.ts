import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { ComplaintStatus, UserRole } from '@prisma/client';
import { FirebaseNotificationService } from '../services/firebaseNotificationService';

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

      if (complaint.status !== ComplaintStatus.REGISTERED) {
        res.status(400).json({
          success: false,
          message: 'Complaint has already been processed',
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

        // Update complaint status to approved
        updatedComplaint = await prisma.complaint.update({
          where: { id },
          data: {
            status: ComplaintStatus.APPROVED,
            approvedBy: adminId,
            approvedAt: new Date(),
          },
        });

        // Create work order
        workOrder = await prisma.workOrder.create({
          data: {
            complaintId: id,
            workerId: assignedWorkerId,
            priority: priority || 1,
            status: ComplaintStatus.APPROVED,
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

        // Create complaint update record
        await prisma.complaintUpdate.create({
          data: {
            complaintId: id,
            status: ComplaintStatus.APPROVED,
            description: reason || 'Complaint approved and assigned to worker',
          },
        });

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
        // Update complaint status to rejected
        updatedComplaint = await prisma.complaint.update({
          where: { id },
          data: {
            status: ComplaintStatus.REJECTED,
            approvedBy: adminId,
            approvedAt: new Date(),
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
      const { page = 1, limit = 10 } = req.query as any;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [complaints, total] = await Promise.all([
        prisma.complaint.findMany({
          where: { status: ComplaintStatus.REGISTERED },
          skip,
          take: parseInt(limit),
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
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
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
                    in: [ComplaintStatus.APPROVED, ComplaintStatus.PROCESSING],
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

      if (workOrder.status !== ComplaintStatus.COMPLETED) {
        res.status(400).json({
          success: false,
          message: 'Work order must be completed by worker before final approval',
        });
        return;
      }

      let updatedWorkOrder;
      let updatedComplaint;

      if (action === 'approve') {
        // Update work order admin approval status
        updatedWorkOrder = await prisma.workOrder.update({
          where: { id: workOrderId },
          data: {
            adminApprovalStatus: 'APPROVED',
            adminApprovedBy: adminId,
            adminApprovedAt: new Date(),
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
            status: ComplaintStatus.COMPLETED,
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
        // Update work order admin approval status
        updatedWorkOrder = await prisma.workOrder.update({
          where: { id: workOrderId },
          data: {
            adminApprovalStatus: 'REJECTED',
            adminApprovedBy: adminId,
            adminApprovedAt: new Date(),
            adminRejectionReason: adminNotes,
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
            status: ComplaintStatus.PROCESSING,
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
              status: 'PROCESSING'
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
