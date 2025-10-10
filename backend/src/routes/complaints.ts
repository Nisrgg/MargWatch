import { Router } from 'express';
import { ComplaintController, submitComplaintValidation, updateStatusValidation } from '../controllers/complaintController';
import { authenticateToken, requireAdmin, requireUser } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/errorHandler';
import { uploadMultipleImages, uploadToCloudinary } from '../middleware/upload';

const router = Router();

// Public routes
router.get('/heatmap', ComplaintController.getHeatMapData);

// Protected routes
router.use(authenticateToken);

// User routes
router.post('/submit', requireUser, uploadMultipleImages, uploadToCloudinary, submitComplaintValidation, handleValidationErrors, ComplaintController.submitComplaint);
router.get('/my-complaints', requireUser, ComplaintController.getUserComplaints);
router.get('/:id', ComplaintController.getComplaintById);

// Admin routes
router.get('/', requireAdmin, ComplaintController.getAllComplaints);
router.put('/:id/status', requireAdmin, updateStatusValidation, handleValidationErrors, ComplaintController.updateComplaintStatus);

export default router;
