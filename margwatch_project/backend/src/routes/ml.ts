import { Router } from 'express';
import { Request, Response } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import mlService from '../services/mlService';
import { ApiResponse } from '../types';

const router = Router();

// All ML routes require authentication
router.use(authenticateToken);

/**
 * Get ML service health status
 */
router.get('/health', async (req: Request, res: Response): Promise<void> => {
  try {
    const health = await mlService.healthCheck();
    
    const response: ApiResponse = {
      success: true,
      message: 'ML service health check completed',
      data: {
        healthy: health.healthy,
        status: health.status,
      },
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check ML service health',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
    });
  }
});

/**
 * Get ML model information
 */
router.get('/model/info', async (req: Request, res: Response): Promise<void> => {
  try {
    const modelInfo = await mlService.getModelInfo();
    
    const response: ApiResponse = {
      success: true,
      message: 'Model information retrieved successfully',
      data: modelInfo,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get model information',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
    });
  }
});

/**
 * Test ML prediction with a sample image (Admin only)
 */
router.post('/test-prediction', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      res.status(400).json({
        success: false,
        message: 'Image URL is required',
      });
      return;
    }

    const prediction = await mlService.predictIssueCategory(imageUrl);
    
    const response: ApiResponse = {
      success: true,
      message: 'ML prediction test completed',
      data: {
        prediction,
        imageUrl,
      },
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to test ML prediction',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
    });
  }
});

/**
 * Batch test ML predictions (Admin only)
 */
router.post('/test-batch-prediction', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageUrls } = req.body;
    
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Image URLs array is required',
      });
      return;
    }

    if (imageUrls.length > 5) {
      res.status(400).json({
        success: false,
        message: 'Maximum 5 images allowed for batch testing',
      });
      return;
    }

    const predictions = await mlService.batchPredict(imageUrls);
    
    const response: ApiResponse = {
      success: true,
      message: 'Batch ML prediction test completed',
      data: {
        predictions,
        totalImages: imageUrls.length,
      },
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to test batch ML prediction',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
    });
  }
});

export default router;


