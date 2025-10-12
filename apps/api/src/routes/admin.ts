import { Router } from 'express';
import { AdminController, createWorkerValidation, updateUserStatusValidation } from '../controllers/adminController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/errorHandler';

const router = Router();

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard
router.get('/dashboard', AdminController.getDashboardStats);
router.get('/analytics', AdminController.getComplaintAnalytics);
router.get('/worker-performance', AdminController.getWorkerPerformance);

// User management
router.get('/users', AdminController.getAllUsers);
router.post('/workers', createWorkerValidation, handleValidationErrors, AdminController.createWorker);
router.put('/users/:id/status', updateUserStatusValidation, handleValidationErrors, AdminController.updateUserStatus);

export default router;
