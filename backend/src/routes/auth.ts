import { Router } from 'express';
import { AuthController, registerValidation, loginValidation, changePasswordValidation, updateProfileValidation } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/errorHandler';

const router = Router();

// Public routes
router.post('/register', registerValidation, handleValidationErrors, AuthController.register);
router.post('/login', loginValidation, handleValidationErrors, AuthController.login);

// Test notification endpoint (public for testing)
router.post('/test-notification', async (req, res) => {
  try {
    const { email, title, message } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Import Firebase service
    const { FirebaseNotificationService } = await import('../services/firebaseNotificationService');
    const fcmService = FirebaseNotificationService.getInstance();

    // Find user by email
    const { prisma } = await import('../config/database');
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, fcmToken: true, role: true, email: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'User has no FCM token registered'
      });
    }

    // Send test notification
    await fcmService.createAndSendNotification(
      user.id,
      title || 'Test Notification',
      message || 'This is a test notification from MargWatch backend!',
      'test',
      { test: true, timestamp: new Date().toISOString() }
    );

    return res.json({
      success: true,
      message: 'Test notification sent successfully',
      data: {
        userId: user.id,
        email: user.email,
        hasFCMToken: !!user.fcmToken
      }
    });
  } catch (error) {
    console.error('Test notification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

// Protected routes
router.use(authenticateToken);

router.get('/profile', AuthController.getProfile);
router.put('/profile', updateProfileValidation, handleValidationErrors, AuthController.updateProfile);
router.put('/change-password', changePasswordValidation, handleValidationErrors, AuthController.changePassword);

export default router;
