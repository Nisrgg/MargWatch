import { Router, Request, Response } from 'express';
import { configTexts } from '../config/uiTexts';
import { ApiResponse } from '../types';

const router = Router();

/**
 * GET /api/config
 * Returns UI text and display config (categories, statuses, roles, etc.)
 * so frontends can avoid hardcoding labels and colors.
 */
router.get('/', (_req: Request, res: Response): void => {
  const response: ApiResponse<typeof configTexts> = {
    success: true,
    message: 'Config retrieved successfully',
    data: configTexts,
  };
  res.json(response);
});

export default router;
