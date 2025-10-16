"""
ML Service Configuration
"""
import os
from typing import List

# ML Model Configuration
MODEL_CATEGORIES: List[str] = [
    'pothole', 
    'road_instability', 
    'streetlight_damage', 
    'tree_damage', 
    'other'
]

MODEL_CONFIDENCE_THRESHOLD: float = 0.6

# Service Configuration
SERVICE_CONFIG = {
    'host': os.getenv('ML_SERVICE_HOST', '0.0.0.0'),
    'port': int(os.getenv('ML_SERVICE_PORT', 8000)),
    'debug': os.getenv('ML_SERVICE_DEBUG', 'false').lower() == 'true',
    'model_path': os.getenv('MODEL_PATH', None),
    'max_batch_size': int(os.getenv('MAX_BATCH_SIZE', 10)),
    'max_image_size_mb': int(os.getenv('MAX_IMAGE_SIZE_MB', 10)),
    'min_image_size': int(os.getenv('MIN_IMAGE_SIZE', 50)),
    'recommended_image_size': int(os.getenv('RECOMMENDED_IMAGE_SIZE', 224))
}

# Supported image formats
SUPPORTED_FORMATS = ['JPEG', 'PNG', 'WEBP']

# Logging configuration
LOGGING_CONFIG = {
    'level': os.getenv('LOG_LEVEL', 'INFO'),
    'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
}
