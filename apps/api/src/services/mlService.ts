import axios from 'axios';
import fs from 'fs';
import { config } from '../config';
import { MLPredictionResponse } from '../types';
import { IssueCategory } from '@margwatch/shared-types';

export class MLService {
  private static instance: MLService;
  private modelUrl: string;
  private healthUrl: string;

  private constructor() {
    this.modelUrl = config.mlModelUrl;
    this.healthUrl = config.mlServiceUrl + '/health';
  }

  public static getInstance(): MLService {
    if (!MLService.instance) {
      MLService.instance = new MLService();
    }
    return MLService.instance;
  }

  /**
   * Predict issue category from Cloudinary image URL
   */
  async predictIssueCategory(imageUrl: string): Promise<MLPredictionResponse> {
    try {
      console.log(`🔮 Starting ML prediction for image: ${imageUrl}`);
      
      // Download image from Cloudinary
      const imageBuffer = await this.downloadImageFromUrl(imageUrl);
      
      // Use FormData for file upload (more efficient than base64)
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('file', imageBuffer, {
        filename: 'image.jpg',
        contentType: 'image/jpeg'
      });
      
      // Make request to ML model using file upload
      const response = await axios.post(this.modelUrl.replace('/predict', '/predict'), formData, {
        timeout: 30000, // 30 seconds timeout
        headers: {
          ...formData.getHeaders(),
        },
      });

      const prediction = response.data;

      if (!prediction.success && !prediction.category) {
        throw new Error(prediction.error || 'ML prediction failed');
      }

      // Map ML model output to our categories
      const category = this.mapCategory(prediction.category);
      const confidence = Math.round(prediction.confidence * 100) / 100;

      console.log(`✅ ML prediction completed: ${category} (confidence: ${confidence})`);

      return {
        category,
        confidence,
        modelVersion: prediction.model_version || 'resnet18_v1.0',
        processingTime: prediction.processing_time || 0,
        imageSize: prediction.image_size || null,
      };
    } catch (error) {
      console.error('❌ ML prediction error:', error instanceof Error ? error.message : String(error));
      
      // Fallback to manual classification
      return {
        category: IssueCategory.OTHER,
        confidence: 0.5,
        modelVersion: 'fallback',
        processingTime: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Download image from URL (Cloudinary or any other URL)
   */
  private async downloadImageFromUrl(imageUrl: string): Promise<Buffer> {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 15000, // 15 seconds timeout
        headers: {
          'User-Agent': 'MargWatch-ML-Service/1.0',
        },
      });

      return Buffer.from(response.data);
    } catch (error) {
      console.error(`❌ Failed to download image from ${imageUrl}:`, error instanceof Error ? error.message : String(error));
      throw new Error(`Failed to download image: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Predict issue category from local file path
   */
  async predictIssueCategoryFromFile(imagePath: string): Promise<MLPredictionResponse> {
    try {
      // Check if image file exists
      if (!fs.existsSync(imagePath)) {
        throw new Error('Image file not found');
      }

      // Read image file
      const imageBuffer = fs.readFileSync(imagePath);
      
      // Use FormData for file upload (more efficient than base64)
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('file', imageBuffer, {
        filename: 'image.jpg',
        contentType: 'image/jpeg'
      });

      // Make request to ML model using file upload
      const response = await axios.post(this.modelUrl.replace('/predict', '/predict'), formData, {
        timeout: 30000, // 30 seconds timeout
        headers: {
          ...formData.getHeaders(),
        },
      });

      const prediction = response.data;

      if (!prediction.success && !prediction.category) {
        throw new Error(prediction.error || 'ML prediction failed');
      }

      // Map ML model output to our categories
      const category = this.mapCategory(prediction.category);
      const confidence = Math.round(prediction.confidence * 100) / 100;

      return {
        category,
        confidence,
        modelVersion: prediction.model_version || 'resnet18_v1.0',
        processingTime: prediction.processing_time || 0,
        imageSize: prediction.image_size || null,
      };
    } catch (error) {
      console.error('❌ ML prediction error:', error instanceof Error ? error.message : String(error));
      
      // Fallback to manual classification
      return {
        category: IssueCategory.OTHER,
        confidence: 0.5,
        modelVersion: 'fallback',
        processingTime: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Batch predict multiple images
   */
  async batchPredict(imageUrls: string[]): Promise<MLPredictionResponse[]> {
    console.log(`📦 Starting batch prediction for ${imageUrls.length} images`);
    
    const predictions = await Promise.allSettled(
      imageUrls.map(url => this.predictIssueCategory(url))
    );

    const results = predictions.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`❌ Prediction failed for image ${imageUrls[index]}:`, result.reason instanceof Error ? result.reason.message : String(result.reason));
        return {
          category: IssueCategory.OTHER,
          confidence: 0.5,
          modelVersion: 'fallback',
          processingTime: 0,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        };
      }
    });

    console.log(`✅ Batch prediction completed: ${results.length} predictions`);
    return results;
  }

  /**
   * Map ML model categories to our database categories
   */
  private mapCategory(mlCategory: string): IssueCategory {
    const categoryMap: { [key: string]: IssueCategory } = {
      'pothole': IssueCategory.POTHOLE,
      'road_instability': IssueCategory.ROAD_INSTABILITY,
      'streetlight_damage': IssueCategory.STREETLIGHT_DAMAGE,
      'tree_damage': IssueCategory.TREE_DAMAGE,
      'other': IssueCategory.OTHER,
    };

    return categoryMap[mlCategory.toLowerCase()] || IssueCategory.OTHER;
  }

  /**
   * Health check for ML service
   */
  async healthCheck(): Promise<{ healthy: boolean; status?: any }> {
    try {
      const response = await axios.get(this.healthUrl, {
        timeout: 5000,
      });
      
      return {
        healthy: response.status === 200,
        status: response.data,
      };
    } catch (error) {
      console.error('❌ ML service health check failed:', error instanceof Error ? error.message : String(error));
      return {
        healthy: false,
        status: { error: error instanceof Error ? error.message : String(error) },
      };
    }
  }

  /**
   * Get model information
   */
  async getModelInfo(): Promise<any> {
    try {
      const infoUrl = this.modelUrl.replace('/predict', '/model/info');
      const response = await axios.get(infoUrl, {
        timeout: 5000,
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get model info:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  /**
   * Check if ML service is available
   */
  async isAvailable(): Promise<boolean> {
    const health = await this.healthCheck();
    return health.healthy;
  }
}

export default MLService.getInstance();
