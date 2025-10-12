import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest, ApiResponse } from '../types';

// Firebase Admin SDK
import * as admin from 'firebase-admin';

export class FirebaseNotificationService {
  private static instance: FirebaseNotificationService;
  private app: admin.app.App;

  private constructor() {
    // Initialize Firebase Admin SDK
    if (!admin.apps.length) {
      try {
        // Try to use service account key file first
        const serviceAccount = require('../../firebase-service-account.json');
        this.app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('✅ Firebase initialized with service account key file');
      } catch (fileError) {
        // Fallback to environment variables
        try {
          this.app = admin.initializeApp({
            credential: admin.credential.cert({
              projectId: process.env.FIREBASE_PROJECT_ID,
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
          });
          console.log('✅ Firebase initialized with environment variables');
        } catch (envError) {
          console.error('❌ Failed to initialize Firebase:', envError instanceof Error ? envError.message : String(envError));
          throw envError;
        }
      }
    } else {
      this.app = admin.app();
    }
  }

  static getInstance(): FirebaseNotificationService {
    if (!FirebaseNotificationService.instance) {
      FirebaseNotificationService.instance = new FirebaseNotificationService();
    }
    return FirebaseNotificationService.instance;
  }

  /**
   * Send notification to a specific user by FCM token
   */
  async sendToUser(
    fcmToken: string,
    title: string,
    message: string,
    data?: any
  ): Promise<boolean> {
    try {
      const payload: admin.messaging.Message = {
        token: fcmToken,
        notification: {
          title,
          body: message,
        },
        data: {
          type: data?.type || 'general',
          notificationType: data?.notificationType || 'general',
          ...Object.fromEntries(
            Object.entries(data || {}).map(([key, value]) => [key, String(value)])
          ),
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'margwatch_notifications',
          },
        },
      };

      const response = await admin.messaging().send(payload);
      console.log(`✅ FCM notification sent successfully: ${response}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send FCM notification:', error);
      return false;
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendToMultipleUsers(
    fcmTokens: string[],
    title: string,
    message: string,
    data?: any
  ): Promise<{ successCount: number; failureCount: number }> {
    try {
      const messages: admin.messaging.Message[] = fcmTokens.map(token => ({
        token,
        notification: {
          title,
          body: message,
        },
        data: {
          type: data?.type || 'general',
          notificationType: data?.notificationType || 'general',
          ...Object.fromEntries(
            Object.entries(data || {}).map(([key, value]) => [key, String(value)])
          ),
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'margwatch_notifications',
          },
        },
      }));

      const response = await admin.messaging().sendAll(messages);
      
      const successCount = response.successCount;
      const failureCount = response.failureCount;
      
      console.log(`📊 FCM batch send results: ${successCount} success, ${failureCount} failed`);
      
      return { successCount, failureCount };
    } catch (error) {
      console.error('❌ Failed to send FCM batch notifications:', error);
      return { successCount: 0, failureCount: fcmTokens.length };
    }
  }

  /**
   * Send notification to a topic (e.g., all users, admin users, etc.)
   */
  async sendToTopic(
    topic: string,
    title: string,
    message: string,
    data?: any
  ): Promise<boolean> {
    try {
      const payload: admin.messaging.Message = {
        topic,
        notification: {
          title,
          body: message,
        },
        data: {
          type: data?.type || 'general',
          notificationType: data?.notificationType || 'general',
          ...Object.fromEntries(
            Object.entries(data || {}).map(([key, value]) => [key, String(value)])
          ),
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'margwatch_notifications',
          },
        },
      };

      const response = await admin.messaging().send(payload);
      console.log(`✅ FCM topic notification sent successfully: ${response}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send FCM topic notification:', error);
      return false;
    }
  }

  /**
   * Create and send notification (replaces the old Redis/WebSocket method)
   */
  async createAndSendNotification(
    userId: string,
    title: string,
    message: string,
    type: string,
    data?: any
  ): Promise<void> {
    try {
      // Create notification in database
      const notification = await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          isRead: false,
        },
      });

      // Get user's FCM token
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { fcmToken: true, role: true },
      });

      if (!user?.fcmToken) {
        console.log(`⚠️ User ${userId} has no FCM token, notification saved to database only`);
        return;
      }

      // Send FCM notification
      const notificationData = {
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        createdAt: notification.createdAt.toISOString(),
        ...data,
      };

      const success = await this.sendToUser(
        user.fcmToken,
        title,
        message,
        notificationData
      );

      if (success) {
        console.log(`✅ Notification sent via FCM to user: ${userId}`);
      } else {
        console.log(`❌ Failed to send FCM notification to user: ${userId}`);
      }
    } catch (error) {
      console.error('Failed to create and send notification:', error);
    }
  }

  /**
   * Send notification to multiple users by user IDs (for broadcast)
   */
  async sendToMultipleUsersByIds(
    userIds: string[],
    title: string,
    message: string,
    type: string,
    data?: any
  ): Promise<void> {
    try {
      // Get FCM tokens for all users
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, fcmToken: true },
      });

      const fcmTokens = users
        .filter(user => user.fcmToken)
        .map(user => user.fcmToken!);

      if (fcmTokens.length === 0) {
        console.log('⚠️ No FCM tokens found for the specified users');
        return;
      }

      // Create notifications in database for all users
      const notifications = await Promise.all(
        userIds.map(userId =>
          prisma.notification.create({
            data: {
              userId,
              title,
              message,
              type,
              isRead: false,
            },
          })
        )
      );

      // Send FCM notifications
      const notificationData = {
        type,
        createdAt: new Date().toISOString(),
        ...data,
      };

      const result = await this.sendToMultipleUsers(
        fcmTokens,
        title,
        message,
        notificationData
      );

      console.log(`📊 Batch notification sent: ${result.successCount} success, ${result.failureCount} failed`);
    } catch (error) {
      console.error('Failed to send notifications to multiple users:', error);
    }
  }
}

