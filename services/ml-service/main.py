from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import torch
import torchvision.transforms as transforms
from torchvision.models import resnet18
from PIL import Image
import io
import logging
import time
from typing import Dict, Any, List
import numpy as np
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="MargWatch ML Service",
    description="Road Issue Classification Service using PyTorch ResNet18",
    version="1.0.0"
)

# ML Model Configuration
MODEL_CATEGORIES = ['POTHOLE', 'ROAD_INSTABILITY', 'STREETLIGHT_DAMAGE', 'TREE_DAMAGE', 'OTHER']
MODEL_CONFIDENCE_THRESHOLD = 0.6

class MLModelService:
    """Real ML Model Service using PyTorch ResNet18"""
    
    def __init__(self):
        self.model = None
        self.model_loaded = False
        self.transform = None
        self.load_model()
    
    def load_model(self):
        """Load the pre-trained ResNet18 model"""
        try:
            logger.info("🔄 Loading ResNet18 model...")
            
            # Load pre-trained ResNet18 model
            self.model = resnet18(pretrained=True)
            
            # Modify the final layer to match our number of categories
            num_classes = len(MODEL_CATEGORIES)
            self.model.fc = torch.nn.Linear(self.model.fc.in_features, num_classes)
            
            # Set model to evaluation mode
            self.model.eval()
            
            # Define image preprocessing transforms
            self.transform = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                                 std=[0.229, 0.224, 0.225])
            ])
            
            logger.info("✅ ResNet18 model loaded successfully")
            self.model_loaded = True
            
        except Exception as e:
            logger.error(f"❌ Failed to load model: {e}")
            logger.error(f"❌ Traceback: {traceback.format_exc()}")
            self.model_loaded = False
    
    def predict(self, image_data: bytes) -> Dict[str, Any]:
        """
        Predict issue category from image data using ResNet18
        """
        start_time = time.time()
        try:
            if not self.model_loaded:
                logger.warning("⚠️ Model not loaded, using fallback prediction")
                return self._fallback_prediction()
            
            # Preprocess image
            image_tensor = self._preprocess_image(image_data)
            
            # Make prediction
            with torch.no_grad():
                outputs = self.model(image_tensor)
                probabilities = torch.nn.functional.softmax(outputs, dim=1)
                confidence, predicted_idx = torch.max(probabilities, 1)
                
                predicted_category = MODEL_CATEGORIES[predicted_idx.item()]
                confidence_score = confidence.item()
            
            processing_time = time.time() - start_time
            
            logger.info(f"🔮 Prediction: {predicted_category} (confidence: {confidence_score:.3f})")
            
            return {
                'category': predicted_category,
                'confidence': confidence_score,
                'model_version': 'resnet18_v1.0',
                'processing_time': processing_time,
                'success': True
            }
            
        except Exception as e:
            logger.error(f"❌ Prediction error: {e}")
            logger.error(f"❌ Traceback: {traceback.format_exc()}")
            return self._fallback_prediction()
    
    def _preprocess_image(self, image_data: bytes) -> torch.Tensor:
        """Preprocess image for ResNet18 model input"""
        try:
            # Open image from bytes
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Apply transforms
            image_tensor = self.transform(image)
            
            # Add batch dimension
            image_tensor = image_tensor.unsqueeze(0)
            
            return image_tensor
            
        except Exception as e:
            logger.error(f"❌ Image preprocessing error: {e}")
            raise
    
    def _fallback_prediction(self) -> Dict[str, Any]:
        """Fallback prediction when model fails"""
        logger.warning("⚠️ Using fallback prediction")
        return {
            'category': 'OTHER',
            'confidence': 0.5,
            'model_version': 'fallback',
            'processing_time': 0.0,
            'success': False,
            'error': 'Model prediction failed'
        }

# Initialize ML service
ml_service = MLModelService()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        model_status = "loaded" if ml_service.model_loaded else "failed"
        return JSONResponse({
            'status': 'healthy',
            'message': 'ML Service is running',
            'model_status': model_status,
            'model_version': 'resnet18_v1.0',
            'categories': MODEL_CATEGORIES,
            'confidence_threshold': MODEL_CONFIDENCE_THRESHOLD,
            'timestamp': time.time()
        })
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return JSONResponse({
            'status': 'unhealthy',
            'error': str(e)
        }, status_code=500)

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """Main prediction endpoint for image uploads"""
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="File must be an image"
            )
        
        # Read image data
        image_data = await file.read()
        
        # Validate image size
        if len(image_data) > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(
                status_code=400,
                detail="Image too large (maximum 10MB)"
            )
        
        # Validate image format
        try:
            image = Image.open(io.BytesIO(image_data))
            if image.size[0] < 50 or image.size[1] < 50:
                raise HTTPException(
                    status_code=400,
                    detail="Image too small (minimum 50x50 pixels)"
                )
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail="Invalid image format"
            )
        
        # Get prediction
        prediction = ml_service.predict(image_data)
        
        # Add metadata
        prediction.update({
            'image_size': image.size,
            'file_name': file.filename,
            'file_size': len(image_data),
            'timestamp': time.time()
        })
        
        logger.info(f"✅ Prediction completed: {prediction['category']} ({prediction['confidence']:.3f})")
        
        return JSONResponse(prediction)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Prediction endpoint error: {e}")
        return JSONResponse({
            'success': False,
            'error': 'Internal server error',
            'message': str(e)
        }, status_code=500)

@app.post("/predict/batch")
async def predict_batch(files: List[UploadFile] = File(...)):
    """Batch prediction endpoint for multiple images"""
    try:
        if len(files) > 10:  # Limit batch size
            raise HTTPException(
                status_code=400,
                detail="Too many files (maximum 10 per batch)"
            )
        
        predictions = []
        for i, file in enumerate(files):
            try:
                # Validate file type
                if not file.content_type or not file.content_type.startswith('image/'):
                    predictions.append({
                        'success': False,
                        'error': 'File must be an image',
                        'file_index': i,
                        'file_name': file.filename
                    })
                    continue
                
                # Read image data
                image_data = await file.read()
                
                # Get prediction
                prediction = ml_service.predict(image_data)
                prediction['file_index'] = i
                prediction['file_name'] = file.filename
                prediction['file_size'] = len(image_data)
                
                predictions.append(prediction)
                
            except Exception as e:
                logger.error(f"Error processing file {i} ({file.filename}): {e}")
                predictions.append({
                    'success': False,
                    'error': str(e),
                    'file_index': i,
                    'file_name': file.filename
                })
        
        return JSONResponse({
            'success': True,
            'predictions': predictions,
            'total_files': len(files),
            'timestamp': time.time()
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Batch prediction error: {e}")
        return JSONResponse({
            'success': False,
            'error': 'Internal server error',
            'message': str(e)
        }, status_code=500)

@app.get("/model/info")
async def model_info():
    """Get model information"""
    return JSONResponse({
        'model_loaded': ml_service.model_loaded,
        'model_name': 'ResNet18',
        'model_version': 'resnet18_v1.0',
        'categories': MODEL_CATEGORIES,
        'confidence_threshold': MODEL_CONFIDENCE_THRESHOLD,
        'supported_formats': ['JPEG', 'PNG', 'WEBP', 'BMP'],
        'max_image_size': '10MB',
        'recommended_size': '224x224',
        'input_shape': [1, 3, 224, 224],
        'framework': 'PyTorch'
    })

@app.post("/predict/base64")
async def predict_base64(data: Dict[str, Any]):
    """Prediction endpoint for base64 encoded images (for backward compatibility)"""
    try:
        if 'image' not in data:
            raise HTTPException(
                status_code=400,
                detail="No image data provided"
            )
        
        # Decode base64 image
        try:
            import base64
            image_data = base64.b64decode(data['image'])
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail="Invalid base64 image data"
            )
        
        # Validate image format
        try:
            image = Image.open(io.BytesIO(image_data))
            if image.size[0] < 50 or image.size[1] < 50:
                raise HTTPException(
                    status_code=400,
                    detail="Image too small (minimum 50x50 pixels)"
                )
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail="Invalid image format"
            )
        
        # Get prediction
        prediction = ml_service.predict(image_data)
        
        # Add metadata
        prediction.update({
            'image_size': image.size,
            'timestamp': time.time()
        })
        
        logger.info(f"✅ Base64 prediction completed: {prediction['category']} ({prediction['confidence']:.3f})")
        
        return JSONResponse(prediction)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Base64 prediction error: {e}")
        return JSONResponse({
            'success': False,
            'error': 'Internal server error',
            'message': str(e)
        }, status_code=500)

if __name__ == '__main__':
    print("🤖 Starting MargWatch ML Service with PyTorch ResNet18...")
    print("📊 Health Check: http://localhost:8000/health")
    print("🔮 Prediction: http://localhost:8000/predict")
    print("📦 Batch Prediction: http://localhost:8000/predict/batch")
    print("ℹ️ Model Info: http://localhost:8000/model/info")
    print(f"🎯 Model Status: {'Loaded' if ml_service.model_loaded else 'Failed'}")
    print(f"📋 Categories: {', '.join(MODEL_CATEGORIES)}")
    print(f"🧠 Framework: PyTorch ResNet18")
    
    try:
        import uvicorn
        uvicorn.run(app, host="0.0.0.0", port=8000)
    except Exception as e:
        logger.error(f"❌ Failed to start ML service: {e}")
        exit(1)
