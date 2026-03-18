/**
 * ML Service — calls the ml-model API (YOLOv8) over HTTP.
 * Uses ML_SERVICE_URL for base URL. Fetches images from URLs (e.g. Cloudinary) and sends to /predict, /predict/batch, etc.
 */
import axios, { AxiosError } from 'axios';
import FormData from 'form-data';
import { config } from '../config';
import { MLPredictionResponse } from '../types';
import { IssueCategory } from '@margwatch/shared-types';

const BASE_URL = (config.mlServiceUrl || 'http://localhost:8000').replace(/\/$/, '');
const TIMEOUT_MS = 30000;

/** Map API category string to IssueCategory enum */
function toIssueCategory(category: string): IssueCategory {
  const upper = (category || '').toUpperCase();
  if (Object.values(IssueCategory).includes(upper as IssueCategory)) {
    return upper as IssueCategory;
  }
  return IssueCategory.OTHER;
}

/** Normalize ml-model API response to MLPredictionResponse */
function toPredictionResponse(body: {
  category?: string;
  confidence?: number;
  model_version?: string;
  processing_time?: number;
  image_size?: [number, number] | null;
  success?: boolean;
  error?: string;
}): MLPredictionResponse {
  return {
    category: toIssueCategory(body.category || 'OTHER'),
    confidence: typeof body.confidence === 'number' ? body.confidence : 0,
    modelVersion: body.model_version ?? 'unknown',
    processingTime: typeof body.processing_time === 'number' ? body.processing_time : 0,
    imageSize: Array.isArray(body.image_size) && body.image_size.length >= 2
      ? [Number(body.image_size[0]), Number(body.image_size[1])]
      : null,
    ...(body.error ? { error: body.error } : {}),
  };
}

async function fetchImageBuffer(imageUrl: string): Promise<Buffer> {
  const res = await axios.get(imageUrl, {
    responseType: 'arraybuffer',
    timeout: 15000,
    maxContentLength: 10 * 1024 * 1024, // 10MB
    validateStatus: (status) => status === 200,
  });
  return Buffer.from(res.data);
}

export class MLService {
  private static instance: MLService;

  private constructor() {}

  public static getInstance(): MLService {
    if (!MLService.instance) {
      MLService.instance = new MLService();
    }
    return MLService.instance;
  }

  async predictIssueCategory(imageUrl: string): Promise<MLPredictionResponse> {
    try {
      const imageBuffer = await fetchImageBuffer(imageUrl);
      const form = new FormData();
      form.append('file', imageBuffer, { filename: 'image.jpg' });
      const res = await axios.post(`${BASE_URL}/predict`, form, {
        headers: form.getHeaders(),
        timeout: TIMEOUT_MS,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        validateStatus: (s) => s === 200,
      });
      return toPredictionResponse(res.data);
    } catch (err) {
      const ax = err as AxiosError;
      if (ax.response?.status === 400 && typeof ax.response?.data === 'object' && ax.response.data && 'detail' in ax.response.data) {
        return toPredictionResponse({
          category: 'OTHER',
          confidence: 0,
          model_version: 'error',
          processing_time: 0,
          image_size: null,
          success: false,
          error: String((ax.response.data as { detail?: unknown }).detail),
        });
      }
      throw err;
    }
  }

  async predictIssueCategoryFromFile(_imagePath: string): Promise<MLPredictionResponse> {
    // Backend typically uses image URLs from Cloudinary; file path not used. Delegate to ml-model by reading file and POSTing.
    const fs = await import('fs').then((m) => m.promises).catch(() => null);
    if (!fs) {
      return toPredictionResponse({ category: 'OTHER', confidence: 0, model_version: 'unavailable', processing_time: 0, image_size: null });
    }
    try {
      const imageBuffer = await fs.readFile(_imagePath);
      const form = new FormData();
      form.append('file', imageBuffer, { filename: 'image.jpg' });
      const res = await axios.post(`${BASE_URL}/predict`, form, {
        headers: form.getHeaders(),
        timeout: TIMEOUT_MS,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        validateStatus: (s) => s === 200,
      });
      return toPredictionResponse(res.data);
    } catch {
      return toPredictionResponse({ category: 'OTHER', confidence: 0, model_version: 'error', processing_time: 0, image_size: null });
    }
  }

  async batchPredict(imageUrls: string[]): Promise<MLPredictionResponse[]> {
    if (imageUrls.length === 0) return [];
    if (imageUrls.length > 10) {
      const results: MLPredictionResponse[] = [];
      for (let i = 0; i < imageUrls.length; i += 10) {
        const chunk = imageUrls.slice(i, i + 10);
        const chunkResults = await this.batchPredictChunk(chunk);
        results.push(...chunkResults);
      }
      return results;
    }
    return this.batchPredictChunk(imageUrls);
  }

  private async batchPredictChunk(imageUrls: string[]): Promise<MLPredictionResponse[]> {
    try {
      const form = new FormData();
      const buffers = await Promise.all(imageUrls.map((url) => fetchImageBuffer(url)));
      buffers.forEach((buf, i) => {
        form.append('files', buf, { filename: `image_${i}.jpg` } as { filename: string });
      });
      const res = await axios.post(`${BASE_URL}/predict/batch`, form, {
        headers: form.getHeaders(),
        timeout: TIMEOUT_MS,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        validateStatus: (s) => s === 200,
      });
      const data = res.data as { predictions?: Record<string, unknown>[] };
      const list = Array.isArray(data.predictions) ? data.predictions : [];
      return list.map((p) =>
        toPredictionResponse({
          category: p.category as string,
          confidence: p.confidence as number,
          model_version: p.model_version as string,
          processing_time: p.processing_time as number,
          image_size: p.image_size as [number, number] | null,
          success: p.success as boolean,
          error: p.error as string | undefined,
        })
      );
    } catch {
      return imageUrls.map(() =>
        toPredictionResponse({ category: 'OTHER', confidence: 0, model_version: 'error', processing_time: 0, image_size: null })
      );
    }
  }

  async healthCheck(): Promise<{ healthy: boolean; status?: unknown }> {
    try {
      const res = await axios.get(`${BASE_URL}/health`, { timeout: 5000, validateStatus: (s) => s < 500 });
      const data = res.data as { status?: string; model_loaded?: boolean };
      const healthy = res.status === 200 && (data.status === 'healthy' || data.model_loaded === true);
      return { healthy: !!healthy, status: res.data };
    } catch {
      return { healthy: false, status: { error: 'ML service unreachable' } };
    }
  }

  async getModelInfo(): Promise<Record<string, unknown>> {
    try {
      const res = await axios.get(`${BASE_URL}/model/info`, { timeout: 5000, validateStatus: (s) => s === 200 });
      return (res.data as Record<string, unknown>) || {};
    } catch {
      return { model_loaded: false, error: 'ML service unreachable' };
    }
  }

  async isAvailable(): Promise<boolean> {
    const { healthy } = await this.healthCheck();
    return healthy;
  }
}

export default MLService.getInstance();
