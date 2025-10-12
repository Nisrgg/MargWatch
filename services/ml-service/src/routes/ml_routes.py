"""
ML Service Routes - API endpoints
"""
import base64
import io
import logging
import numpy as np
from flask import Blueprint, request, jsonify
from PIL import Image

from ..services.ml_model_service import MLModelService
from ..config.settings import SERVICE_CONFIG

logger = logging.getLogger(__name__)

# Create blueprint for ML routes
ml_bp = Blueprint('ml', __name__, url_prefix='/api/ml')

# Initialize ML service
ml_service = MLModelService()

@ml_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        model_status = "loaded" if ml_service.model_loaded else "mock"
        return jsonify({
            'status': 'healthy',
            'message': 'ML Service is running',
            'model_status': model_status,
            'model_version': 'mock_v1.0',
            'categories': ml_service.get_model_info()['categories'],
            'timestamp': str(np.datetime64('now'))
        })
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500

@ml_bp.route('/predict', methods=['POST'])
def predict():
    """Main prediction endpoint"""
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({
                'success': False,
                'error': 'No image data provided'
            }), 400
        
        # Validate image data
        try:
            image_data = base64.b64decode(data['image'])
        except Exception as e:
            return jsonify({
                'success': False,
                'error': 'Invalid base64 image data'
            }), 400
        
        # Validate image format
        try:
            image = Image.open(io.BytesIO(image_data))
            min_size = SERVICE_CONFIG['min_image_size']
            if image.size[0] < min_size or image.size[1] < min_size:
                return jsonify({
                    'success': False,
                    'error': f'Image too small (minimum {min_size}x{min_size} pixels)'
                }), 400
        except Exception as e:
            return jsonify({
                'success': False,
                'error': 'Invalid image format'
            }), 400
        
        # Get prediction
        prediction = ml_service.predict(image_data)
        
        # Add metadata
        prediction.update({
            'success': True,
            'image_size': image.size,
            'timestamp': str(np.datetime64('now'))
        })
        
        logger.info(f"✅ Prediction completed: {prediction['category']} ({prediction['confidence']:.2f})")
        
        return jsonify(prediction)
        
    except Exception as e:
        logger.error(f"❌ Prediction endpoint error: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@ml_bp.route('/predict/batch', methods=['POST'])
def predict_batch():
    """Batch prediction endpoint for multiple images"""
    try:
        data = request.get_json()
        
        if not data or 'images' not in data or not isinstance(data['images'], list):
            return jsonify({
                'success': False,
                'error': 'No images array provided'
            }), 400
        
        max_batch_size = SERVICE_CONFIG['max_batch_size']
        if len(data['images']) > max_batch_size:
            return jsonify({
                'success': False,
                'error': f'Too many images (maximum {max_batch_size} per batch)'
            }), 400
        
        predictions = []
        for i, image_b64 in enumerate(data['images']):
            try:
                image_data = base64.b64decode(image_b64)
                prediction = ml_service.predict(image_data)
                prediction['image_index'] = i
                predictions.append(prediction)
            except Exception as e:
                logger.error(f"Error processing image {i}: {e}")
                predictions.append({
                    'success': False,
                    'error': str(e),
                    'image_index': i
                })
        
        return jsonify({
            'success': True,
            'predictions': predictions,
            'total_images': len(data['images']),
            'timestamp': str(np.datetime64('now'))
        })
        
    except Exception as e:
        logger.error(f"❌ Batch prediction error: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@ml_bp.route('/model/info', methods=['GET'])
def model_info():
    """Get model information"""
    return jsonify(ml_service.get_model_info())
