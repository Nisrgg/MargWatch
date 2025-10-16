import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { UserRole, ComplaintStatus } from '@prisma/client';

export class AdminController {
  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const [
        totalComplaints,
        pendingComplaints,
        processingComplaints,
        completedComplaints,
        totalUsers,
        totalWorkers,
        activeWorkOrders,
        recentComplaints,
      ] = await Promise.all([
        prisma.complaint.count(),
        prisma.complaint.count({ where: { status: ComplaintStatus.REGISTERED } }),
        prisma.complaint.count({ where: { status: ComplaintStatus.PROCESSING } }),
        prisma.complaint.count({ where: { status: ComplaintStatus.COMPLETED } }),
        prisma.user.count({ where: { role: UserRole.USER } }),
        prisma.user.count({ where: { role: UserRole.WORKER } }),
        prisma.workOrder.count({ where: { status: ComplaintStatus.PROCESSING } }),
        prisma.complaint.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        }),
      ]);

      const stats = {
        complaints: {
          total: totalComplaints,
          pending: pendingComplaints,
          processing: processingComplaints,
          completed: completedComplaints,
        },
        users: {
          total: totalUsers,
          workers: totalWorkers,
        },
        workOrders: {
          active: activeWorkOrders,
        },
        recentComplaints,
      };

      const response: ApiResponse = {
        success: true,
        message: 'Dashboard statistics retrieved successfully',
        data: { stats },
      };

      res.json(response);
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve dashboard statistics',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
      });
    }
  }

  /**
   * Get all users
   */
  static async getAllUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, role, search } = req.query as any;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const where: any = {};

      if (role) {
        where.role = role;
      }

      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true,
            _count: {
              select: {
                complaints: true,
                workOrders: true,
              },
            },
          },
        }),
        prisma.user.count({ where }),
      ]);

      const response: ApiResponse = {
        success: true,
        message: 'Users retrieved successfully',
        data: {
          users,
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
      console.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve users',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
      });
    }
  }

  /**
   * Create a new worker
   */
  static async createWorker(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { email, password, firstName, lastName, phone } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'User with this email already exists',
        });
        return;
      }

      // Hash password
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create worker
      const worker = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          role: UserRole.WORKER,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Worker created successfully',
        data: { worker },
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Create worker error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create worker',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
      });
    }
  }

  /**
   * Update user status
   */
  static async updateUserStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      // Prevent admin from deactivating themselves
      if (user.id === req.user!.id) {
        res.status(400).json({
          success: false,
          message: 'Cannot deactivate your own account',
        });
        return;
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { isActive },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          updatedAt: true,
        },
      });

      const response: ApiResponse = {
        success: true,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: { user: updatedUser },
      };

      res.json(response);
    } catch (error) {
      console.error('Update user status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user status',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
      });
    }
  }

  /**
   * Get complaint analytics
   */
  static async getComplaintAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('Getting complaint analytics...');
      const { period = '30' } = req.query as any;
      const days = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      console.log('Analytics period:', days, 'days, start date:', startDate);

      // Get basic analytics using Prisma queries (SQLite compatible)
      const [
        complaintsByCategory,
        complaintsByStatus,
        totalComplaints,
        completedComplaints,
      ] = await Promise.all([
        prisma.complaint.groupBy({
          by: ['category'],
          _count: { category: true },
          where: {
            createdAt: { gte: startDate },
          },
        }),
        prisma.complaint.groupBy({
          by: ['status'],
          _count: { status: true },
          where: {
            createdAt: { gte: startDate },
          },
        }),
        prisma.complaint.count({
          where: {
            createdAt: { gte: startDate },
          },
        }),
        prisma.complaint.count({
          where: {
            createdAt: { gte: startDate },
            status: 'COMPLETED',
          },
        }),
      ]);

      console.log('Basic analytics retrieved:', {
        totalComplaints,
        completedComplaints,
        categories: complaintsByCategory.length,
        statuses: complaintsByStatus.length,
      });

      // Calculate average resolution time using Prisma (SQLite compatible)
      let avgResolutionTime = 0;
      try {
        const completedComplaintsWithTimes = await prisma.complaint.findMany({
          where: {
            createdAt: { gte: startDate },
            status: 'COMPLETED',
          },
          select: {
            createdAt: true,
            updatedAt: true,
          },
        });

        if (completedComplaintsWithTimes.length > 0) {
          const totalDays = completedComplaintsWithTimes.reduce((sum, complaint) => {
            const diffTime = complaint.updatedAt.getTime() - complaint.createdAt.getTime();
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            return sum + diffDays;
          }, 0);
          avgResolutionTime = totalDays / completedComplaintsWithTimes.length;
        }
      } catch (timeError) {
        console.error('Error calculating resolution time:', timeError);
        avgResolutionTime = 0;
      }

      // Generate daily data using Prisma (SQLite compatible)
      const complaintsByDay: { date: string; count: number }[] = [];
      try {
        const allComplaints = await prisma.complaint.findMany({
          where: {
            createdAt: { gte: startDate },
          },
          select: {
            createdAt: true,
          },
        });

        // Group by date
        const dailyCounts: { [key: string]: number } = {};
        allComplaints.forEach(complaint => {
          const date = complaint.createdAt.toISOString().split('T')[0];
          dailyCounts[date] = (dailyCounts[date] || 0) + 1;
        });

        // Convert to array format
        Object.entries(dailyCounts).forEach(([date, count]) => {
          complaintsByDay.push({ date, count });
        });

        // Sort by date
        complaintsByDay.sort((a, b) => a.date.localeCompare(b.date));
      } catch (dayError) {
        console.error('Error generating daily data:', dayError);
      }

      // Get worker performance data
      const workers = await prisma.user.findMany({
        where: {
          role: 'WORKER',
          isActive: true,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          workOrders: {
            where: {
              assignedAt: { gte: startDate },
            },
            select: {
              id: true,
              status: true,
              assignedAt: true,
              completedAt: true,
              cost: true,
            },
          },
        },
      });

      const workerPerformance = workers.map(worker => {
        const totalOrders = worker.workOrders.length;
        const completedOrders = worker.workOrders.filter(wo => wo.status === 'COMPLETED').length;
        const totalCost = worker.workOrders.reduce((sum, wo) => sum + (wo.cost || 0), 0);
        const avgCompletionTime = completedOrders > 0 
          ? worker.workOrders
              .filter(wo => wo.completedAt)
              .reduce((sum, wo) => {
                const completionTime = wo.completedAt!.getTime() - wo.assignedAt.getTime();
                return sum + completionTime;
              }, 0) / completedOrders / (1000 * 60 * 60 * 24) // Convert to days
          : 0;

        return {
          id: worker.id,
          name: `${worker.firstName} ${worker.lastName}`,
          email: worker.email,
          totalOrders,
          completedOrders,
          completionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0,
          avgCompletionTime: Math.round(avgCompletionTime * 100) / 100,
          totalCost: Math.round(totalCost * 100) / 100,
        };
      });

      // Get heat map data (simplified for now)
      const heatMapData = await prisma.complaint.findMany({
        where: {
          createdAt: { gte: startDate },
        },
        select: {
          latitude: true,
          longitude: true,
          category: true,
          status: true,
        },
      });

      const analytics = {
        complaintsOverTime: complaintsByDay.map(day => ({
          date: day.date,
          count: day.count,
        })),
        complaintsByCategory: complaintsByCategory.map(cat => ({
          category: cat.category,
          count: cat._count.category,
        })),
        complaintsByStatus: complaintsByStatus.map(status => ({
          status: status.status,
          count: status._count.status,
        })),
        workerPerformance,
        heatMapData: heatMapData.map(item => ({
          lat: item.latitude,
          lng: item.longitude,
          category: item.category,
          status: item.status,
        })),
        avgResolutionTime: Math.round(avgResolutionTime * 100) / 100,
        period: days,
        totalComplaints,
        completedComplaints,
      };

      console.log('Analytics generated successfully:', {
        categories: analytics.complaintsByCategory.length,
        statuses: analytics.complaintsByStatus.length,
        dailyData: analytics.complaintsOverTime.length,
        workers: analytics.workerPerformance.length,
        heatMapPoints: analytics.heatMapData.length,
        avgResolutionTime: analytics.avgResolutionTime,
      });

      const response: ApiResponse = {
        success: true,
        message: 'Complaint analytics retrieved successfully',
        data: { analytics },
      };

      res.json(response);
    } catch (error) {
      console.error('Get complaint analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve complaint analytics',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
      });
    }
  }

  /**
   * Get worker performance
   */
  static async getWorkerPerformance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { period = '30' } = req.query as any;
      const days = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

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
          workOrders: {
            where: {
              assignedAt: { gte: startDate },
            },
            select: {
              id: true,
              status: true,
              assignedAt: true,
              completedAt: true,
              cost: true,
            },
          },
        },
      });

      const performance = workers.map(worker => {
        const totalOrders = worker.workOrders.length;
        const completedOrders = worker.workOrders.filter(wo => wo.status === ComplaintStatus.COMPLETED).length;
        const totalCost = worker.workOrders.reduce((sum, wo) => sum + (wo.cost || 0), 0);
        const avgCompletionTime = completedOrders > 0 
          ? worker.workOrders
              .filter(wo => wo.completedAt)
              .reduce((sum, wo) => {
                const completionTime = wo.completedAt!.getTime() - wo.assignedAt.getTime();
                return sum + completionTime;
              }, 0) / completedOrders / (1000 * 60 * 60 * 24) // Convert to days
          : 0;

        return {
          ...worker,
          performance: {
            totalOrders,
            completedOrders,
            completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
            totalCost,
            avgCompletionTime: Math.round(avgCompletionTime * 100) / 100,
          },
        };
      });

      const response: ApiResponse = {
        success: true,
        message: 'Worker performance retrieved successfully',
        data: { performance },
      };

      res.json(response);
    } catch (error) {
      console.error('Get worker performance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve worker performance',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
      });
    }
  }
}

// Validation rules
export const createWorkerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('phone').optional().isMobilePhone(['en-US', 'en-GB']).withMessage('Valid phone number is required'),
];

export const updateUserStatusValidation = [
  body('isActive').isBoolean().withMessage('isActive must be a boolean'),
];
