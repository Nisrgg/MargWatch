import { Router } from 'express';
import { AdminApprovalController, approveRejectValidation, finalApprovalValidation } from '../controllers/adminApprovalController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/errorHandler';

const router = Router();

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireAdmin);

// Admin approval routes
router.get('/pending-complaints', AdminApprovalController.getPendingComplaints);
router.get('/available-workers', AdminApprovalController.getAvailableWorkers);
router.put('/complaints/:id/approve-reject', approveRejectValidation, handleValidationErrors, AdminApprovalController.approveRejectComplaint);
router.put('/work-orders/:workOrderId/final-approve', finalApprovalValidation, handleValidationErrors, AdminApprovalController.finalApproveWork);

export default router;
