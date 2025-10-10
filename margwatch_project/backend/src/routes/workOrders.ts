import { Router } from 'express';
import { WorkOrderController, createWorkOrderValidation, updateWorkOrderValidation, completeWorkOrderValidation, updateWorkStatusValidation, completeWorkValidation } from '../controllers/workOrderController';
import { authenticateToken, requireAdmin, requireWorker } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/errorHandler';
import { uploadSingleImage, uploadSingleToCloudinary } from '../middleware/upload';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Admin routes
router.post('/', requireAdmin, createWorkOrderValidation, handleValidationErrors, WorkOrderController.createWorkOrder);
router.get('/all', requireAdmin, WorkOrderController.getAllWorkOrders);

// Worker routes
router.get('/my-orders', requireWorker, WorkOrderController.getWorkerOrders);
router.get('/:id/details', requireWorker, WorkOrderController.getWorkOrderDetails);
router.put('/:id/status', requireWorker, uploadSingleImage, uploadSingleToCloudinary, updateWorkStatusValidation, handleValidationErrors, WorkOrderController.updateWorkStatus);
router.put('/:id/complete', requireWorker, uploadSingleImage, uploadSingleToCloudinary, completeWorkValidation, handleValidationErrors, WorkOrderController.completeWorkOrderEnhanced);

export default router;
