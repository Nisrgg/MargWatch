# ML Service Development Guide

## 🤖 **FOR ML DEVELOPER ONLY**

### **Your Responsibilities**
You are responsible for developing and enhancing the machine learning service that classifies road issues from images using PyTorch ResNet18 model.

### **What You Need to Work With**

#### **✅ ML Service Directory**
```
services/ml-service/
├── src/
│   ├── app.py                       # Main Flask application
│   ├── config/                      # Configuration
│   │   └── settings.py              # Service settings
│   ├── routes/                      # API routes
│   │   └── ml_routes.py             # ML API endpoints
│   ├── services/                    # ML service implementations
│   │   ├── ml_model_service.py      # Main ML service
│   │   └── image_processor.py       # Image processing
│   ├── utils/                       # ML utilities
│   │   ├── model_loader.py          # Model loading utilities
│   │   └── preprocessor.py          # Data preprocessing
│   └── __init__.py                  # Package initialization
├── models/                          # ML model files
├── requirements.txt                 # Python dependencies
├── Dockerfile                       # ML service container
├── docker-compose.yml               # ML service containerization
├── test_ml_service.py               # Test suite
└── README.md                        # ML service documentation
```

#### **✅ Backend Integration Files**
```
apps/api/src/services/mlService.ts          # ML service integration
apps/api/src/controllers/complaintController.ts  # ML API endpoints
```

#### **✅ Database Schema (ML-related)**
- Complaint table with ML prediction fields:
  - `mlCategory`: ML predicted category
  - `mlConfidence`: ML confidence score
  - `mlModelVersion`: ML model version used
  - `mlProcessingTime`: ML processing time in seconds

### **What You DON'T Need**
- ❌ Android app files (`apps/mobile/` directory)
- ❌ Admin portal files (handled by Team Member 1)
- ❌ Mobile-specific configurations
- ❌ Frontend code

### **Your Development Workflow**

#### **1. Local Development**
```bash
cd services/ml-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python src/app.py
```

#### **2. Docker Development**
```bash
cd services/ml-service
docker-compose up --build
```

#### **3. Testing**
```bash
python test_ml_service.py
```

### **Key Technologies**
- **Language:** Python 3.9+
- **ML Framework:** PyTorch 2.1.0, TorchVision 0.16.0
- **API Framework:** Flask with CORS support
- **Model:** Pre-trained ResNet18 (customized for 5 road issue categories)
- **Image Processing:** Pillow (PIL), OpenCV-compatible preprocessing
- **Containerization:** Docker

### **ML Service Architecture**

#### **Main Components**
1. **Flask Application** (`src/app.py`): Main API server
2. **ML Routes** (`src/routes/ml_routes.py`): API endpoints
3. **ML Model Service** (`src/services/ml_model_service.py`): Core ML logic
4. **Image Processor** (`src/services/image_processor.py`): Image preprocessing
5. **Model Loader** (`src/utils/model_loader.py`): Model loading utilities
6. **Preprocessor** (`src/utils/preprocessor.py`): Data preprocessing

#### **API Endpoints**
```python
# Health check
GET /health
GET /api/ml/health

# Single image prediction
POST /api/ml/predict
{
  "image": "base64_encoded_image_data"
}

# Batch prediction
POST /api/ml/predict/batch
{
  "images": ["base64_image1", "base64_image2"]
}

# Model information
GET /api/ml/model/info
```

### **Model Implementation**

#### **ResNet18 Configuration**
```python
import torch
import torchvision.models as models
from torchvision import transforms

class MLModelService:
    def __init__(self):
        self.model = models.resnet18(pretrained=True)
        # Modify final layer for 5 categories
        self.model.fc = torch.nn.Linear(self.model.fc.in_features, 5)
        
        # Load custom weights if available
        self.load_model()
        
        # Image preprocessing
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                               std=[0.229, 0.224, 0.225])
        ])
    
    def predict(self, image_data):
        # Process image and return prediction
        pass
```

#### **Categories**
```python
CATEGORIES = [
    "POTHOLE",
    "ROAD_INSTABILITY", 
    "STREETLIGHT_DAMAGE",
    "TREE_DAMAGE",
    "OTHER"
]
```

### **Image Processing Pipeline**

#### **Preprocessing Steps**
1. **Base64 Decoding:** Convert base64 string to image
2. **Format Validation:** Check image format and size
3. **Resize:** Resize to 224x224 pixels
4. **Normalization:** Apply ImageNet normalization
5. **Tensor Conversion:** Convert to PyTorch tensor

#### **Image Validation**
```python
def validate_image(image_data, min_size=224):
    """Validate image data and format"""
    try:
        image = Image.open(io.BytesIO(image_data))
        if image.size[0] < min_size or image.size[1] < min_size:
            raise ValueError(f"Image too small (minimum {min_size}x{min_size} pixels)")
        return True
    except Exception as e:
        raise ValueError(f"Invalid image format: {e}")
```

### **API Response Format**

#### **Single Prediction Response**
```json
{
  "success": true,
  "category": "POTHOLE",
  "confidence": 0.95,
  "model_version": "mock_v1.0",
  "processing_time": 0.234,
  "image_size": [1920, 1080],
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### **Batch Prediction Response**
```json
{
  "success": true,
  "predictions": [
    {
      "category": "POTHOLE",
      "confidence": 0.95,
      "image_index": 0
    },
    {
      "category": "ROAD_INSTABILITY",
      "confidence": 0.87,
      "image_index": 1
    }
  ],
  "total_images": 2,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### **Error Handling**

#### **Common Error Responses**
```json
{
  "success": false,
  "error": "No image data provided"
}

{
  "success": false,
  "error": "Invalid base64 image data"
}

{
  "success": false,
  "error": "Image too small (minimum 224x224 pixels)"
}

{
  "success": false,
  "error": "Internal server error",
  "message": "Detailed error information"
}
```

### **Performance Optimization**

#### **Model Loading**
- Load model once at startup
- Use GPU if available
- Implement model caching
- Monitor memory usage

#### **Batch Processing**
- Process multiple images efficiently
- Use vectorized operations
- Implement parallel processing
- Set reasonable batch size limits

#### **Response Time Targets**
- Single image: <150ms
- Batch processing: <500ms for 5 images
- Model loading: <5 seconds at startup

### **Testing Strategy**

#### **Unit Tests**
```python
def test_image_validation():
    """Test image validation logic"""
    pass

def test_model_prediction():
    """Test model prediction accuracy"""
    pass

def test_batch_processing():
    """Test batch processing functionality"""
    pass
```

#### **Integration Tests**
```python
def test_api_endpoints():
    """Test API endpoint functionality"""
    pass

def test_error_handling():
    """Test error handling scenarios"""
    pass
```

#### **Performance Tests**
```python
def test_response_times():
    """Test API response times"""
    pass

def test_concurrent_requests():
    """Test concurrent request handling"""
    pass
```

### **Model Training (Future Enhancement)**

#### **Training Pipeline**
1. **Data Collection:** Gather road issue images
2. **Data Preprocessing:** Clean and augment dataset
3. **Model Training:** Fine-tune ResNet18
4. **Model Evaluation:** Test accuracy and performance
5. **Model Deployment:** Deploy new model version

#### **Training Script Structure**
```python
# training/train_model.py
def train_model():
    """Train the road issue classification model"""
    # Data loading
    # Model training
    # Model evaluation
    # Model saving
    pass
```

### **Monitoring and Logging**

#### **Health Check Endpoint**
```python
@ml_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'ML Service is running',
        'model_status': 'loaded',
        'model_version': 'mock_v1.0',
        'categories': CATEGORIES,
        'timestamp': str(np.datetime64('now'))
    })
```

#### **Logging Configuration**
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)
```

### **Docker Configuration**

#### **Dockerfile**
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/
COPY models/ ./models/

EXPOSE 8000

CMD ["python", "src/app.py"]
```

#### **Docker Compose**
```yaml
ml-service:
  build:
    context: .
    dockerfile: Dockerfile
  ports:
    - "8000:8000"
  environment:
    - PYTHONUNBUFFERED=1
    - MODEL_PATH=/app/models
  volumes:
    - ./models:/app/models
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
    interval: 30s
    timeout: 10s
    retries: 3
```

### **Integration with Backend**

#### **Backend ML Service Integration**
```typescript
// apps/api/src/services/mlService.ts
export class MLService {
  private baseUrl: string;
  
  async predictImage(imageData: string): Promise<MLPrediction> {
    const response = await fetch(`${this.baseUrl}/api/ml/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageData })
    });
    
    return response.json();
  }
  
  async predictBatch(images: string[]): Promise<MLBatchPrediction> {
    const response = await fetch(`${this.baseUrl}/api/ml/predict/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images })
    });
    
    return response.json();
  }
}
```

### **Deployment**

#### **Development**
```bash
cd services/ml-service
docker-compose up --build
```

#### **Production**
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### **Best Practices**

#### **Code Organization**
- Separate concerns (API, ML logic, utilities)
- Use type hints for better code clarity
- Implement proper error handling
- Add comprehensive logging

#### **Performance**
- Optimize model loading and inference
- Implement caching for repeated requests
- Monitor memory usage and response times
- Use batch processing for multiple images

#### **Security**
- Validate all input data
- Implement rate limiting
- Use HTTPS in production
- Sanitize error messages

### **Troubleshooting**

#### **Common Issues**
1. **Model Loading:** Check model file paths and permissions
2. **Image Processing:** Validate image format and size
3. **Memory Usage:** Monitor memory consumption during inference
4. **API Errors:** Check Flask configuration and CORS settings
5. **Performance:** Profile model inference and optimize bottlenecks

#### **Debugging**
- Use logging for debugging information
- Test with sample images
- Monitor API response times
- Check Docker container logs

### **Resources**
- [PyTorch Documentation](https://pytorch.org/docs/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [TorchVision Documentation](https://pytorch.org/vision/)
- [Docker Documentation](https://docs.docker.com/)

---

*This guide provides everything you need to develop and enhance the ML service for MargWatch with PyTorch ResNet18 model and Flask API.*