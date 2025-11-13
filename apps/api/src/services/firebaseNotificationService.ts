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
    } catch (error: any) {
      console.error('❌ Failed to send FCM notification:', error);
      
      // If token is invalid/not registered, we should remove it from database
      if (error?.code === 'messaging/registration-token-not-registered' || 
          error?.code === 'messaging/invalid-registration-token') {
        console.log(`⚠️ Invalid FCM token detected, removing from database...`);
        // Find and remove this token from all users
        try {
          await prisma.user.updateMany({
            where: { fcmToken: fcmToken },
            data: { fcmToken: null },
          });
          console.log(`✅ Removed invalid FCM token from database`);
        } catch (dbError) {
          console.error('Failed to remove invalid token from database:', dbError);
        }
      }
      
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
      
      // Handle invalid tokens - remove them from database
      if (response.responses) {
        const invalidTokens: string[] = [];
        response.responses.forEach((resp, index) => {
          if (!resp.success && resp.error) {
            const errorCode = (resp.error as any)?.code;
            if (errorCode === 'messaging/registration-token-not-registered' || 
                errorCode === 'messaging/invalid-registration-token') {
              invalidTokens.push(fcmTokens[index]);
            }
          }
        });
        
        if (invalidTokens.length > 0) {
          console.log(`⚠️ Found ${invalidTokens.length} invalid FCM tokens, removing from database...`);
          try {
            await prisma.user.updateMany({
              where: { fcmToken: { in: invalidTokens } },
              data: { fcmToken: null },
            });
            console.log(`✅ Removed ${invalidTokens.length} invalid FCM tokens from database`);
          } catch (dbError) {
            console.error('Failed to remove invalid tokens from database:', dbError);
          }
        }
      }
      
      return { successCount, failureCount };
    } catch (error: any) {
      console.error('❌ Failed to send FCM batch notifications:', error);
      
      // If it's a network/proxy error (like the /batch 404), log it but don't fail completely
      if (error?.code === 'messaging/unknown-error' && error?.message?.includes('404')) {
        console.error('⚠️ Firebase Admin SDK network error - this might be a proxy/network issue');
        console.error('   The /batch endpoint error suggests a network configuration problem');
      }
      
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
        select: { fcmToken: true, role: true, email: true },
      });

      if (!user) {
        console.error(`❌ User ${userId} not found, cannot send notification`);
        return;
      }

      if (!user.fcmToken) {
        console.log(`⚠️ User ${userId} (${user.role}, ${user.email}) has no FCM token, notification saved to database only`);
        console.log(`   Notification: "${title}" - "${message}"`);
        console.log(`   💡 User needs to open the mobile app to register FCM token`);
        return;
      }

      console.log(`📤 Sending notification to user ${userId} (${user.role}, ${user.email}): "${title}"`);
      console.log(`   FCM Token: ${user.fcmToken.substring(0, 20)}...`);

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
        select: { id: true, fcmToken: true, role: true, email: true },
      });

      const usersWithTokens = users.filter(user => user.fcmToken);
      const usersWithoutTokens = users.filter(user => !user.fcmToken);

      if (usersWithoutTokens.length > 0) {
        console.log(`⚠️ ${usersWithoutTokens.length} user(s) without FCM tokens: ${usersWithoutTokens.map(u => `${u.email} (${u.role})`).join(', ')}`);
      }

      const fcmTokens = usersWithTokens.map(user => user.fcmToken!);

      if (fcmTokens.length === 0) {
        console.log(`⚠️ No FCM tokens found for ${userIds.length} specified user(s), notification saved to database only`);
        console.log(`   Notification: "${title}" - "${message}"`);
        return;
      }

      console.log(`📤 Sending batch notification to ${fcmTokens.length} user(s): "${title}"`);

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

