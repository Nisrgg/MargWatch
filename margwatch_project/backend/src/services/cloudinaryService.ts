import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config';
require("dotenv").config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class CloudinaryService {
  /**
   * Upload image to Cloudinary
   */
  static async uploadImage(imageBuffer: Buffer, publicId?: string): Promise<{
    url: string;
    public_id: string;
    secure_url: string;
    asset_id: string;
  }> {
    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'road-issues',
            public_id: publicId,
            resource_type: 'image',
            transformation: [
              { width: 800, height: 600, crop: 'limit' }, // Resize without cropping
              { quality: 'auto', fetch_format: 'auto' }, // Optimize quality and format
            ],
            use_filename: true,
            unique_filename: true,
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(error);
            } else if (result) {
              resolve({
                url: result.url,
                public_id: result.public_id,
                secure_url: result.secure_url,
                asset_id: result.asset_id,
              });
            } else {
              reject(new Error('No result returned from Cloudinary'));
            }
          }
        );

        uploadStream.end(imageBuffer);
      });
    } catch (error) {
      console.error('Cloudinary upload service error:', error);
      throw new Error('Failed to upload image to Cloudinary');
    }
  }

  /**
   * Upload multiple images to Cloudinary
   */
  static async uploadMultipleImages(imageBuffers: Buffer[]): Promise<Array<{
    url: string;
    public_id: string;
    secure_url: string;
    asset_id: string;
  }>> {
    try {
      const uploadPromises = imageBuffers.map((buffer, index) => {
        const publicId = `complaint-${Date.now()}-${index}`;
        return this.uploadImage(buffer, publicId);
      });

      const results = await Promise.allSettled(uploadPromises);
      
      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.error(`Failed to upload image ${index}:`, result.reason);
          throw new Error(`Failed to upload image ${index}`);
        }
      });
    } catch (error) {
      console.error('Multiple upload error:', error);
      throw new Error('Failed to upload multiple images');
    }
  }

  /**
   * Delete image from Cloudinary
   */
  static async deleteImage(publicId: string): Promise<any> {
    try {
      return await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw new Error('Failed to delete image from Cloudinary');
    }
  }

  /**
   * Generate optimized image URL
   */
  static getOptimizedUrl(publicId: string, options?: {
    width?: number;
    height?: number;
    quality?: string;
    format?: string;
  }): string {
    try {
      const defaultOptions = {
        width: 400,
        height: 300,
        crop: 'limit',
        quality: 'auto',
        fetch_format: 'auto',
        ...options,
      };

      return cloudinary.url(publicId, {
        ...defaultOptions,
        secure: true,
      });
    } catch (error) {
      console.error('URL generation error:', error);
      return '';
    }
  }

  /**
   * Test Cloudinary connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      // Test with a simple ping or resource listing
      const result = await cloudinary.api.resources({ max_results: 1 });
      console.log('✅ Cloudinary connection successful');
      return true;
    } catch (error) {
      console.error('❌ Cloudinary connection test failed:', error);
      return false;
    }
  }
}

export default CloudinaryService;
