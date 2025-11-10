# MargWatch ML Service

A FastAPI-based machine learning service for road issue classification using PyTorch ResNet18.

## 🎯 Overview

This service provides real-time image classification for road issues including:
- **POTHOLE**: Road surface depressions
- **ROAD_INSTABILITY**: Cracks, uneven surfaces
- **STREETLIGHT_DAMAGE**: Damaged street lighting
- **TREE_DAMAGE**: Fallen trees, branches
- **OTHER**: Miscellaneous road issues

## 🚀 Features

- **Real-time Classification**: Fast image processing using PyTorch ResNet18
- **Multiple Input Formats**: File upload, base64 encoding, batch processing
- **RESTful API**: Clean FastAPI endpoints with automatic documentation
- **Docker Support**: Containerized deployment with health checks
- **Comprehensive Testing**: Built-in test suite for validation

## 🛠️ Technology Stack

- **Framework**: FastAPI 0.104.1
- **ML Library**: PyTorch 2.1.0 + TorchVision 0.16.0
- **Model**: Pre-trained ResNet18 (modified for 5 classes)
- **Image Processing**: Pillow (PIL)
- **Server**: Uvicorn ASGI server

## 📡 API Endpoints

### Health Check
```http
GET /health
```
Returns service status and model information.

### Single Image Prediction
```http
POST /predict
Content-Type: multipart/form-data

file: [image file]
```

### Base64 Image Prediction (Backward Compatibility)
```http
POST /predict/base64
Content-Type: application/json

{
  "image": "base64_encoded_image_data"
}
```

### Batch Prediction
```http
POST /predict/batch
Content-Type: multipart/form-data

file: [image1]
file: [image2]
...
```

### Model Information
```http
GET /model/info
```
Returns detailed model configuration and capabilities.

## 🔧 Installation & Setup

### Local Development

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the Service**:
   ```bash
   python main.py
   ```

3. **Test the Service**:
   ```bash
   python test_ml_service.py
   ```

### Docker Deployment

1. **Build the Image**:
   ```bash
   docker build -t margwatch-ml-service .
   ```

2. **Run the Container**:
   ```bash
   docker run -p 8000:8000 margwatch-ml-service
   ```

3. **Health Check**:
   ```bash
   curl http://localhost:8000/health
   ```

## 📊 Response Format

### Successful Prediction
```json
{
  "category": "POTHOLE",
  "confidence": 0.847,
  "model_version": "resnet18_v1.0",
  "processing_time": 0.156,
  "image_size": [224, 224],
  "file_name": "image.jpg",
  "file_size": 15432,
  "timestamp": 1703123456.789,
  "success": true
}
```

### Error Response
```json
{
  "success": false,
  "error": "Invalid image format",
  "message": "Image too small (minimum 50x50 pixels)"
}
```

## 🧠 Model Details

- **Architecture**: ResNet18 (18-layer residual network)
- **Input Size**: 224x224x3 (RGB images)
- **Classes**: 5 road issue categories
- **Preprocessing**: 
  - Resize to 224x224
  - Normalize with ImageNet statistics
  - Convert to tensor format
- **Inference**: Softmax activation for probability distribution

## 🔍 Testing

The service includes a comprehensive test suite (`test_ml_service.py`) that validates:

- ✅ Health endpoint functionality
- ✅ Model information retrieval
- ✅ File upload predictions
- ✅ Base64 image predictions
- ✅ Batch processing capabilities

Run tests with:
```bash
python test_ml_service.py
```

## 📈 Performance

- **Inference Time**: ~150ms per image (CPU)
- **Memory Usage**: ~200MB (model + dependencies)
- **Throughput**: ~6-7 images/second (CPU)
- **Accuracy**: Pre-trained ResNet18 baseline performance

## 🔧 Configuration

### Environment Variables
- `MODEL_PATH`: Path to custom model file (optional)
- `LOG_LEVEL`: Logging level (default: INFO)

### Model Customization
To use a custom trained model:

1. Save your PyTorch model:
   ```python
   torch.save(model.state_dict(), 'custom_model.pth')
   ```

2. Update the model loading code in `main.py`
3. Rebuild and deploy the service

## 🚨 Error Handling

The service includes comprehensive error handling for:

- Invalid image formats
- Corrupted image data
- Oversized images (>10MB)
- Undersized images (<50x50 pixels)
- Model loading failures
- Network timeouts

## 📝 Logging

Structured logging with different levels:
- **INFO**: Normal operations, predictions
- **WARNING**: Fallback predictions, model issues
- **ERROR**: Prediction failures, service errors

## 🔗 Integration

### Backend API Integration
The service integrates with the MargWatch backend API:

```typescript
// Example usage in Node.js/TypeScript
const FormData = require('form-data');
const formData = new FormData();
formData.append('file', imageBuffer, {
  filename: 'image.jpg',
  contentType: 'image/jpeg'
});

const response = await axios.post('http://ml-service:8000/predict', formData, {
  headers: formData.getHeaders(),
});
```

## 🐳 Docker Configuration

The Dockerfile includes:
- Python 3.9 slim base image
- System dependencies for image processing
- Non-root user for security
- Health check endpoint
- Optimized layer caching

## 📋 Requirements

- Python 3.9+
- PyTorch 2.1.0+
- FastAPI 0.104.1+
- Pillow 10.0.1+
- Docker (optional)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is part of the MargWatch road issue reporting system.

## 🆘 Support

For issues and questions:
1. Check the logs: `docker logs <container_id>`
2. Run the test suite: `python test_ml_service.py`
3. Verify health endpoint: `curl http://localhost:8000/health`
4. Check model info: `curl http://localhost:8000/model/info`