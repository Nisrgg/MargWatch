import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ApiResponse } from '../types';
import { ControllerUtils } from '../utils/controllerUtils';

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const response = ControllerUtils.createResponse(
      false,
      'Validation failed',
      undefined,
      errors.array().map(err => err.msg).join(', ')
    );
    
    res.status(400).json(response);
    return;
  }
  
  next();
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', error);
  
  const { message, error: errorMessage } = ControllerUtils.handleError(error, 'process request');
  const response = ControllerUtils.createResponse(false, message, undefined, errorMessage);
  
  res.status(500).json(response);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  const response = ControllerUtils.createResponse(false, 'Route not found');
  res.status(404).json(response);
};
