import multer from 'multer';
import path from 'path';
import { FileFilterCallback } from 'multer';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import CloudinaryService from '../services/cloudinaryService';

// In-memory storage for Cloudinary uploads
const storage = multer.memoryStorage();

// File filter for images
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
  }
};

// Multiple image upload for complaints (up to 5 images)
export const uploadMultipleImages = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSize, // 10MB per file
    files: 5, // Maximum 5 images per complaint
  },
}).array('images', 5);

// Cloudinary upload middleware for multiple images
export const uploadToCloudinary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    const files = req.files as Express.Multer.File[];
    
    // Convert files to buffers for Cloudinary
    const imageBuffers = files.map(file => file.buffer);
    
    // Upload to Cloudinary
    const uploadedImages = await CloudinaryService.uploadMultipleImages(imageBuffers);
    
    // Add Cloudinary URLs to request body
    req.body.imageUrls = uploadedImages.map(img => img.secure_url);
    req.body.uploadedImages = uploadedImages;
    
    console.log('✅ Images uploaded to Cloudinary:', req.body.imageUrls);
    
    next();
  } catch (error) {
    console.error('Cloudinary upload middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload images to Cloudinary',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
    });
  }
};

// Single image upload for work updates
export const uploadSingleImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSize,
  },
}).single('image');

// Cloudinary upload middleware for single image
export const uploadSingleToCloudinary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return next();
    }

    // Upload to Cloudinary
    const result = await CloudinaryService.uploadImage(req.file.buffer);
    
    // Add Cloudinary URL to request
    req.body.imageUrl = result.secure_url;
    req.body.imagePublicId = result.public_id;
    
    next();
  } catch (error) {
    console.error('Cloudinary single upload middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
    });
  }
};