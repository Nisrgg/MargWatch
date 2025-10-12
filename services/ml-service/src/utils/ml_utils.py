"""
ML Service Utilities
"""
import logging
from typing import Dict, Any, List
from PIL import Image
import io

logger = logging.getLogger(__name__)

class ImageValidator:
    """Utility class for image validation"""
    
    @staticmethod
    def validate_image_size(image_data: bytes, min_size: int = 50) -> bool:
        """Validate image size"""
        try:
            image = Image.open(io.BytesIO(image_data))
            return image.size[0] >= min_size and image.size[1] >= min_size
        except Exception as e:
            logger.error(f"Image size validation error: {e}")
            return False
    
    @staticmethod
    def validate_image_format(image_data: bytes) -> bool:
        """Validate image format"""
        try:
            image = Image.open(io.BytesIO(image_data))
            return image.format in ['JPEG', 'PNG', 'WEBP']
        except Exception as e:
            logger.error(f"Image format validation error: {e}")
            return False
    
    @staticmethod
    def get_image_info(image_data: bytes) -> Dict[str, Any]:
        """Get image information"""
        try:
            image = Image.open(io.BytesIO(image_data))
            return {
                'size': image.size,
                'format': image.format,
                'mode': image.mode,
                'file_size': len(image_data)
            }
        except Exception as e:
            logger.error(f"Image info extraction error: {e}")
            return {}

class ResponseFormatter:
    """Utility class for formatting API responses"""
    
    @staticmethod
    def success_response(data: Dict[str, Any], message: str = "Success") -> Dict[str, Any]:
        """Format success response"""
        return {
            'success': True,
            'message': message,
            'data': data
        }
    
    @staticmethod
    def error_response(error: str, status_code: int = 400) -> Dict[str, Any]:
        """Format error response"""
        return {
            'success': False,
            'error': error,
            'status_code': status_code
        }
    
    @staticmethod
    def batch_response(predictions: List[Dict[str, Any]], total: int) -> Dict[str, Any]:
        """Format batch response"""
        return {
            'success': True,
            'predictions': predictions,
            'total_images': total,
            'successful_predictions': len([p for p in predictions if p.get('success', False)])
        }

class PerformanceMonitor:
    """Utility class for performance monitoring"""
    
    def __init__(self):
        self.metrics = {}
    
    def start_timer(self, operation: str) -> None:
        """Start timing an operation"""
        import time
        self.metrics[operation] = {'start_time': time.time()}
    
    def end_timer(self, operation: str) -> float:
        """End timing an operation and return duration"""
        import time
        if operation in self.metrics:
            duration = time.time() - self.metrics[operation]['start_time']
            self.metrics[operation]['duration'] = duration
            return duration
        return 0.0
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get performance metrics"""
        return self.metrics
