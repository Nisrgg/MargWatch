import { Router } from 'express';
import { WorkOrderController, createWorkOrderValidation, updateWorkOrderValidation, completeWorkOrderValidation, updateWorkStatusValidation, approveWorkOrderValidation, reviewWorkOrderValidation } from '../controllers/workOrderController';
import { authenticateToken, requireAdmin, requireWorker, requireWorkerOrAdmin } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/errorHandler';
import { uploadSingleImage, uploadSingleToCloudinary, uploadMultipleImages, uploadToCloudinary, conditionalUploadMultipleImages } from '../middleware/upload';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Admin routes
router.post('/', requireAdmin, createWorkOrderValidation, handleValidationErrors, WorkOrderController.createWorkOrder);
router.get('/all', requireAdmin, WorkOrderController.getAllWorkOrders);
router.get('/pending-approvals', requireAdmin, WorkOrderController.getPendingApprovals);
router.post('/approve', requireAdmin, approveWorkOrderValidation, handleValidationErrors, WorkOrderController.approveWorkOrder);

// Worker routes
router.get('/my-orders', requireWorker, WorkOrderController.getWorkerOrders);
router.get('/:id/details', requireWorkerOrAdmin, WorkOrderController.getWorkOrderDetails);
router.put('/:id/status', requireWorker, conditionalUploadMultipleImages, uploadToCloudinary, updateWorkStatusValidation, handleValidationErrors, WorkOrderController.updateWorkStatus);
router.put('/:id/complete', requireWorker, conditionalUploadMultipleImages, uploadToCloudinary, completeWorkOrderValidation, handleValidationErrors, WorkOrderController.completeWorkOrderEnhanced);

export default router;
