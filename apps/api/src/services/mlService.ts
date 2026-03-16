/**
 * ML Service — BYPASS MODE (no Docker / no external ML service)
 * All methods return hardcoded values. Re-enable the real ML service when you integrate it later.
 */
import { MLPredictionResponse } from '../types';
import { IssueCategory } from '@margwatch/shared-types';

const BYPASS_CATEGORY = IssueCategory.OTHER;
const BYPASS_CONFIDENCE = 1;
const BYPASS_MODEL_VERSION = 'testing';
const BYPASS_STATUS = { bypass: 'testing', message: 'ML service disabled (bypass mode)' };

export class MLService {
  private static instance: MLService;

  private constructor() {}

  public static getInstance(): MLService {
    if (!MLService.instance) {
      MLService.instance = new MLService();
    }
    return MLService.instance;
  }

  async predictIssueCategory(_imageUrl: string): Promise<MLPredictionResponse> {
    return {
      category: BYPASS_CATEGORY,
      confidence: BYPASS_CONFIDENCE,
      modelVersion: BYPASS_MODEL_VERSION,
      processingTime: 0,
      imageSize: null,
    };
  }

  async predictIssueCategoryFromFile(_imagePath: string): Promise<MLPredictionResponse> {
    return {
      category: BYPASS_CATEGORY,
      confidence: BYPASS_CONFIDENCE,
      modelVersion: BYPASS_MODEL_VERSION,
      processingTime: 0,
      imageSize: null,
    };
  }

  async batchPredict(imageUrls: string[]): Promise<MLPredictionResponse[]> {
    return imageUrls.map(() => ({
      category: BYPASS_CATEGORY,
      confidence: BYPASS_CONFIDENCE,
      modelVersion: BYPASS_MODEL_VERSION,
      processingTime: 0,
      imageSize: null as [number, number] | null,
    }));
  }

  async healthCheck(): Promise<{ healthy: boolean; status?: any }> {
    return {
      healthy: true,
      status: BYPASS_STATUS,
    };
  }

  async getModelInfo(): Promise<any> {
    return {
      bypass: 'testing',
      model: 'disabled',
      message: 'ML service disabled (bypass mode)',
    };
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}

export default MLService.getInstance();
