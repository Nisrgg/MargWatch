import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest, ApiResponse } from '../types';

export class FCMController {
  /**
   * Update user's FCM token
   */
  static async updateFCMToken(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { fcmToken } = req.body;

      if (!fcmToken) {
        res.status(400).json({
          success: false,
          message: 'FCM token is required',
        });
        return;
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: { fcmToken },
        select: { id: true, email: true, fcmToken: true },
      });

      const response: ApiResponse = {
        success: true,
        message: 'FCM token updated successfully',
        data: { user },
      };

      res.json(response);
    } catch (error) {
      console.error('Update FCM token error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update FCM token',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
      });
    }
  }

  /**
   * Remove user's FCM token (for logout)
   */
  static async removeFCMToken(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      await prisma.user.update({
        where: { id: userId },
        data: { fcmToken: null },
      });

      const response: ApiResponse = {
        success: true,
        message: 'FCM token removed successfully',
      };

      res.json(response);
    } catch (error) {
      console.error('Remove FCM token error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove FCM token',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
      });
    }
  }

  /**
   * Test FCM notification (admin only)
   */
  static async testNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { title, message, type } = req.body;

      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (user?.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Admin access required',
        });
        return;
      }

      // Import Firebase service
      const { FirebaseNotificationService } = await import('../services/firebaseNotificationService');
      const fcmService = FirebaseNotificationService.getInstance();

      // Send test notification
      await fcmService.createAndSendNotification(
        userId,
        title || 'Test Notification',
        message || 'This is a test notification from MargWatch',
        type || 'general',
        { test: true }
      );

      const response: ApiResponse = {
        success: true,
        message: 'Test notification sent successfully',
      };

      res.json(response);
    } catch (error) {
      console.error('Test notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send test notification',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
      });
    }
  }
}



