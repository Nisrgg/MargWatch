# ML Service Local Testing Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Starting the ML Service](#starting-the-ml-service)
3. [Testing Endpoints](#testing-endpoints)
4. [Using Different Tools](#using-different-tools)
5. [Testing with Real Images](#testing-with-real-images)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- Python 3.9 or higher
- pip (Python package manager)
- curl (for command-line testing)
- Optional: Postman, Insomnia, or similar API testing tool

### Install Dependencies

**Important**: Navigate to the ML service directory first!

```bash
# From project root (D:\code\VCS\MargWatch\)
cd services/ml-service

# Install dependencies
pip install -r requirements.txt
```

**Note**: The first installation may take several minutes as PyTorch and TorchVision are large packages (~500MB).

**Verify your location**: You should see `main.py` in the current directory.

---

## Starting the ML Service

### Option 1: Run Locally (Python)

**Navigate to ML service directory first:**

```bash
# From project root
cd services/ml-service

# Or use absolute path
cd D:\code\VCS\MargWatch\services\ml-service

# Start the service
python main.py
```

**Verify you're in the right directory**: You should see `main.py` file.

You should see output like:
```
🤖 Starting MargWatch ML Service with PyTorch ResNet18...
📊 Health Check: http://localhost:8000/health
🔮 Prediction: http://localhost:8000/predict
📦 Batch Prediction: http://localhost:8000/predict/batch
ℹ️ Model Info: http://localhost:8000/model/info
🎯 Model Status: Loaded
📋 Categories: POTHOLE, ROAD_INSTABILITY, STREETLIGHT_DAMAGE, TREE_DAMAGE, OTHER
🧠 Framework: PyTorch ResNet18
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Option 2: Run with Docker

**Navigate to ML service directory first:**

```bash
# From project root
cd services/ml-service

# Build the image
docker build -t margwatch-ml-service .

# Run the container
docker run -p 8000:8000 margwatch-ml-service
```

### Option 3: Run with Docker Compose

**Navigate to docker directory:**

```bash
# From project root
cd infrastructure/docker

# Or use absolute path
cd D:\code\VCS\MargWatch\infrastructure\docker

# Start ML service
docker-compose up ml-service
```

---

## Testing Endpoints

### 1. Health Check Endpoint

**Purpose**: Verify the service is running and model is loaded

#### Using curl

**You can run this from ANY directory** (service must be running):

```bash
curl http://localhost:8000/health
```

**Windows PowerShell alternative:**
```powershell
Invoke-WebRequest -Uri http://localhost:8000/health
```

#### Expected Response

```json
{
  "status": "healthy",
  "message": "ML Service is running",
  "model_status": "loaded",
  "model_version": "resnet18_v1.0",
  "categories": [
    "POTHOLE",
    "ROAD_INSTABILITY",
    "STREETLIGHT_DAMAGE",
    "TREE_DAMAGE",
    "OTHER"
  ],
  "confidence_threshold": 0.6,
  "timestamp": 1703123456.789
}
```

#### Using Python

```python
import requests

response = requests.get("http://localhost:8000/health")
print(response.json())
```

---

### 2. Model Information Endpoint

**Purpose**: Get detailed information about the ML model

#### Using curl

```bash
curl http://localhost:8000/model/info
```

#### Expected Response

```json
{
  "model_loaded": true,
  "model_name": "ResNet18",
  "model_version": "resnet18_v1.0",
  "categories": [
    "POTHOLE",
    "ROAD_INSTABILITY",
    "STREETLIGHT_DAMAGE",
    "TREE_DAMAGE",
    "OTHER"
  ],
  "confidence_threshold": 0.6,
  "supported_formats": ["JPEG", "PNG", "WEBP", "BMP"],
  "max_image_size": "10MB",
  "recommended_size": "224x224",
  "input_shape": [1, 3, 224, 224],
  "framework": "PyTorch"
}
```

---

### 3. Single Image Prediction (File Upload)

**Purpose**: Classify a single image file

#### Using curl

**You can run this from ANY directory** (use full path to image):

**Windows:**
```bash
curl -X POST http://localhost:8000/predict -F "file=@C:\path\to\your\image.jpg"
```

**Linux/Mac:**
```bash
curl -X POST http://localhost:8000/predict \
  -F "file=@/path/to/your/image.jpg"
```

**Example with image in ML service directory:**
```bash
# First navigate to ML service directory
cd D:\code\VCS\MargWatch\services\ml-service

# Then use relative path
curl -X POST http://localhost:8000/predict -F "file=@./test_images/pothole.jpg"
```

#### Expected Response

```json
{
  "category": "POTHOLE",
  "confidence": 0.847,
  "model_version": "resnet18_v1.0",
  "processing_time": 0.156,
  "image_size": [1920, 1080],
  "file_name": "pothole.jpg",
  "file_size": 245678,
  "timestamp": 1703123456.789,
  "success": true
}
```

#### Using Python

```python
import requests

# Method 1: Using file path
with open('path/to/image.jpg', 'rb') as f:
    files = {'file': ('image.jpg', f, 'image/jpeg')}
    response = requests.post('http://localhost:8000/predict', files=files)
    print(response.json())

# Method 2: Using image buffer
with open('path/to/image.jpg', 'rb') as f:
    files = {'file': ('image.jpg', f.read(), 'image/jpeg')}
    response = requests.post('http://localhost:8000/predict', files=files)
    print(response.json())
```

#### Using JavaScript/Node.js

```javascript
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

const formData = new FormData();
formData.append('file', fs.createReadStream('path/to/image.jpg'));

axios.post('http://localhost:8000/predict', formData, {
  headers: formData.getHeaders(),
})
.then(response => console.log(response.data))
.catch(error => console.error(error));
```

#### Using Postman

1. Create a new POST request to `http://localhost:8000/predict`
2. Go to the **Body** tab
3. Select **form-data**
4. Add a key named `file` with type **File**
5. Click **Select Files** and choose your image
6. Click **Send**

---

### 4. Base64 Image Prediction

**Purpose**: Classify an image sent as base64-encoded string (backward compatibility)

#### Using curl

```bash
# First, encode your image to base64
IMAGE_B64=$(base64 -i path/to/image.jpg)

# Then send the request
curl -X POST http://localhost:8000/predict/base64 \
  -H "Content-Type: application/json" \
  -d "{\"image\": \"$IMAGE_B64\"}"
```

**On Windows (PowerShell)**:
```powershell
$imageBytes = [System.IO.File]::ReadAllBytes("path\to\image.jpg")
$imageBase64 = [System.Convert]::ToBase64String($imageBytes)
$body = @{image=$imageBase64} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8000/predict/base64" -Method Post -Body $body -ContentType "application/json"
```

#### Using Python

```python
import requests
import base64

# Read and encode image
with open('path/to/image.jpg', 'rb') as f:
    image_data = f.read()
    image_b64 = base64.b64encode(image_data).decode('utf-8')

# Send request
response = requests.post(
    'http://localhost:8000/predict/base64',
    json={'image': image_b64}
)
print(response.json())
```

#### Expected Response

Same format as file upload endpoint.

---

### 5. Batch Prediction

**Purpose**: Classify multiple images in a single request (up to 10 images)

#### Using curl

```bash
curl -X POST http://localhost:8000/predict/batch \
  -F "file=@image1.jpg" \
  -F "file=@image2.jpg" \
  -F "file=@image3.jpg"
```

#### Expected Response

```json
{
  "success": true,
  "predictions": [
    {
      "category": "POTHOLE",
      "confidence": 0.847,
      "model_version": "resnet18_v1.0",
      "processing_time": 0.156,
      "file_index": 0,
      "file_name": "image1.jpg",
      "file_size": 245678,
      "success": true
    },
    {
      "category": "ROAD_INSTABILITY",
      "confidence": 0.723,
      "model_version": "resnet18_v1.0",
      "processing_time": 0.142,
      "file_index": 1,
      "file_name": "image2.jpg",
      "file_size": 189234,
      "success": true
    },
    {
      "category": "TREE_DAMAGE",
      "confidence": 0.891,
      "model_version": "resnet18_v1.0",
      "processing_time": 0.168,
      "file_index": 2,
      "file_name": "image3.jpg",
      "file_size": 312456,
      "success": true
    }
  ],
  "total_files": 3,
  "timestamp": 1703123456.789
}
```

#### Using Python

```python
import requests

files = [
    ('file', ('image1.jpg', open('path/to/image1.jpg', 'rb'), 'image/jpeg')),
    ('file', ('image2.jpg', open('path/to/image2.jpg', 'rb'), 'image/jpeg')),
    ('file', ('image3.jpg', open('path/to/image3.jpg', 'rb'), 'image/jpeg')),
]

response = requests.post('http://localhost:8000/predict/batch', files=files)
print(response.json())

# Close files
for _, (_, file_obj, _) in files:
    file_obj.close()
```

#### Using JavaScript/Node.js

```javascript
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

const formData = new FormData();
formData.append('file', fs.createReadStream('path/to/image1.jpg'));
formData.append('file', fs.createReadStream('path/to/image2.jpg'));
formData.append('file', fs.createReadStream('path/to/image3.jpg'));

axios.post('http://localhost:8000/predict/batch', formData, {
  headers: formData.getHeaders(),
})
.then(response => console.log(response.data))
.catch(error => console.error(error));
```

---

## Using Different Tools

### Postman Collection

Create a Postman collection with these requests:

1. **Health Check**
   - Method: GET
   - URL: `http://localhost:8000/health`

2. **Model Info**
   - Method: GET
   - URL: `http://localhost:8000/model/info`

3. **Single Prediction**
   - Method: POST
   - URL: `http://localhost:8000/predict`
   - Body: form-data
   - Key: `file` (type: File)

4. **Base64 Prediction**
   - Method: POST
   - URL: `http://localhost:8000/predict/base64`
   - Body: raw JSON
   - Content: `{"image": "<base64_string>"}`

5. **Batch Prediction**
   - Method: POST
   - URL: `http://localhost:8000/predict/batch`
   - Body: form-data
   - Multiple keys: `file` (type: File)

### FastAPI Interactive Docs

FastAPI provides automatic interactive documentation:

1. Start the ML service
2. Open your browser to: `http://localhost:8000/docs`
3. You'll see Swagger UI with all endpoints
4. Click "Try it out" on any endpoint
5. Upload files or enter JSON data
6. Click "Execute" to test

**Alternative**: ReDoc documentation at `http://localhost:8000/redoc`

---

## Testing with Real Images

### Getting Test Images

#### Option 1: Use Your Own Images
- Take photos of road issues with your phone
- Save them to a test directory
- Use the file paths in your requests

#### Option 2: Download Sample Images
- Search for "pothole images", "road damage", etc. on image search engines
- Save images to a `test_images` folder
- Ensure images are in supported formats (JPEG, PNG, WEBP, BMP)

#### Option 3: Use the Test Script
The service includes a test script that generates synthetic test images:

```bash
cd services/ml-service
python test_ml_service.py
```

This script:
- Creates synthetic test images for each category
- Tests all endpoints automatically
- Provides detailed output

### Image Requirements

- **Formats**: JPEG, PNG, WEBP, BMP
- **Minimum Size**: 50x50 pixels
- **Maximum Size**: 10MB
- **Recommended**: 224x224 pixels (model input size)
- **Color**: RGB (will be converted automatically)

### Example Test Workflow

```bash
# 1. Start the service
cd services/ml-service
python main.py

# 2. In another terminal, test health
curl http://localhost:8000/health

# 3. Test with a single image
curl -X POST http://localhost:8000/predict \
  -F "file=@./test_images/pothole.jpg"

# 4. Test batch prediction
curl -X POST http://localhost:8000/predict/batch \
  -F "file=@./test_images/pothole.jpg" \
  -F "file=@./test_images/crack.jpg" \
  -F "file=@./test_images/tree.jpg"

# 5. Run automated tests
python test_ml_service.py
```

---

## Complete Python Test Script

Create a file `test_local.py`:

```python
#!/usr/bin/env python3
"""
Complete test script for local ML service testing
"""
import requests
import base64
import os
from pathlib import Path

ML_SERVICE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("🔍 Testing health endpoint...")
    response = requests.get(f"{ML_SERVICE_URL}/health")
    assert response.status_code == 200
    data = response.json()
    print(f"✅ Service is {data['status']}")
    print(f"   Model status: {data['model_status']}")
    return data

def test_model_info():
    """Test model info endpoint"""
    print("\n🔍 Testing model info endpoint...")
    response = requests.get(f"{ML_SERVICE_URL}/model/info")
    assert response.status_code == 200
    data = response.json()
    print(f"✅ Model: {data['model_name']} v{data['model_version']}")
    print(f"   Categories: {', '.join(data['categories'])}")
    return data

def test_single_prediction(image_path):
    """Test single image prediction"""
    print(f"\n🔍 Testing single prediction with {image_path}...")
    
    if not os.path.exists(image_path):
        print(f"❌ Image not found: {image_path}")
        return None
    
    with open(image_path, 'rb') as f:
        files = {'file': (os.path.basename(image_path), f, 'image/jpeg')}
        response = requests.post(f"{ML_SERVICE_URL}/predict", files=files)
    
    assert response.status_code == 200
    data = response.json()
    print(f"✅ Prediction: {data['category']} (confidence: {data['confidence']:.3f})")
    print(f"   Processing time: {data['processing_time']:.3f}s")
    return data

def test_base64_prediction(image_path):
    """Test base64 prediction"""
    print(f"\n🔍 Testing base64 prediction with {image_path}...")
    
    if not os.path.exists(image_path):
        print(f"❌ Image not found: {image_path}")
        return None
    
    with open(image_path, 'rb') as f:
        image_data = f.read()
        image_b64 = base64.b64encode(image_data).decode('utf-8')
    
    response = requests.post(
        f"{ML_SERVICE_URL}/predict/base64",
        json={'image': image_b64}
    )
    
    assert response.status_code == 200
    data = response.json()
    print(f"✅ Prediction: {data['category']} (confidence: {data['confidence']:.3f})")
    return data

def test_batch_prediction(image_paths):
    """Test batch prediction"""
    print(f"\n🔍 Testing batch prediction with {len(image_paths)} images...")
    
    files = []
    for path in image_paths:
        if os.path.exists(path):
            files.append(('file', (os.path.basename(path), open(path, 'rb'), 'image/jpeg')))
    
    if not files:
        print("❌ No valid images found")
        return None
    
    response = requests.post(f"{ML_SERVICE_URL}/predict/batch", files=files)
    
    # Close files
    for _, (_, file_obj, _) in files:
        file_obj.close()
    
    assert response.status_code == 200
    data = response.json()
    print(f"✅ Processed {data['total_files']} images")
    for i, pred in enumerate(data['predictions']):
        if pred.get('success'):
            print(f"   {i+1}. {pred['file_name']}: {pred['category']} ({pred['confidence']:.3f})")
    return data

def main():
    """Run all tests"""
    print("🤖 MargWatch ML Service Local Testing")
    print("=" * 50)
    
    # Test 1: Health check
    test_health()
    
    # Test 2: Model info
    test_model_info()
    
    # Test 3: Single prediction (if image provided)
    import sys
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        test_single_prediction(image_path)
        test_base64_prediction(image_path)
    
    # Test 4: Batch prediction (if multiple images provided)
    if len(sys.argv) > 2:
        image_paths = sys.argv[1:]
        test_batch_prediction(image_paths)
    
    print("\n" + "=" * 50)
    print("✅ All tests completed!")

if __name__ == "__main__":
    main()
```

**Usage**:
```bash
# Test with single image
python test_local.py path/to/image.jpg

# Test with multiple images
python test_local.py image1.jpg image2.jpg image3.jpg
```

---

## Troubleshooting

### Service Won't Start

**Problem**: `ModuleNotFoundError` or import errors

**Solution**:
```bash
# Ensure you're in the correct directory
cd services/ml-service

# Install dependencies
pip install -r requirements.txt

# Verify Python version (should be 3.9+)
python --version
```

### Model Not Loading

**Problem**: `model_status: "failed"` in health check

**Solution**:
- Check logs for specific error messages
- Ensure PyTorch installed correctly: `python -c "import torch; print(torch.__version__)"`
- Try reinstalling PyTorch: `pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu`

### Connection Refused

**Problem**: `Connection refused` when making requests

**Solution**:
- Verify service is running: Check terminal output
- Check port is correct: Default is 8000
- Try: `curl http://localhost:8000/health`
- Check if port is in use: `netstat -an | grep 8000` (Linux/Mac) or `netstat -an | findstr 8000` (Windows)

### Image Upload Fails

**Problem**: 400 Bad Request with "Invalid image format"

**Solution**:
- Verify image format is supported (JPEG, PNG, WEBP, BMP)
- Check image size is between 50x50 and 10MB
- Try opening image in an image viewer to verify it's valid
- Check file path is correct

### Low Confidence Scores

**Problem**: Predictions have low confidence (< 0.6)

**Solution**:
- This is normal for pre-trained ResNet18 (not fine-tuned on road issues)
- Model is using ImageNet pre-trained weights
- For better accuracy, you would need to fine-tune on road issue dataset
- Current model is a baseline/prototype

### Docker Issues

**Problem**: Docker container won't start or crashes

**Solution**:
```bash
# Check Docker logs
docker logs <container_id>

# Rebuild image
docker build -t margwatch-ml-service .

# Run with more memory (if needed)
docker run -p 8000:8000 --memory="1g" margwatch-ml-service
```

---

## Performance Testing

### Measure Response Times

```bash
# Single request timing
time curl -X POST http://localhost:8000/predict \
  -F "file=@image.jpg"

# Multiple requests
for i in {1..10}; do
  time curl -X POST http://localhost:8000/predict \
    -F "file=@image.jpg" > /dev/null
done
```

### Load Testing with Python

```python
import requests
import time
from concurrent.futures import ThreadPoolExecutor

def test_prediction(image_path):
    with open(image_path, 'rb') as f:
        files = {'file': ('test.jpg', f, 'image/jpeg')}
        start = time.time()
        response = requests.post('http://localhost:8000/predict', files=files)
        elapsed = time.time() - start
        return elapsed, response.status_code

# Test with 10 concurrent requests
with ThreadPoolExecutor(max_workers=10) as executor:
    futures = [executor.submit(test_prediction, 'image.jpg') for _ in range(10)]
    results = [f.result() for f in futures]

avg_time = sum(r[0] for r in results) / len(results)
print(f"Average response time: {avg_time:.3f}s")
```

---

## Next Steps

1. **Test with Real Road Images**: Use actual photos of road issues
2. **Integrate with Backend**: Test the full flow from mobile app → backend → ML service
3. **Monitor Performance**: Track response times and accuracy
4. **Fine-tune Model**: Train on road issue dataset for better accuracy
5. **Production Deployment**: Deploy to production environment

---

## Additional Resources

- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **PyTorch Docs**: https://pytorch.org/docs/
- **ResNet18 Paper**: https://arxiv.org/abs/1512.03385
- **Service README**: `services/ml-service/README.md`
- **Detailed Documentation**: `docs/ML_SERVICE_DETAILED.md`

---

## Quick Reference

| Endpoint | Method | Purpose | Input |
|----------|--------|---------|-------|
| `/health` | GET | Health check | None |
| `/model/info` | GET | Model information | None |
| `/predict` | POST | Single prediction | File upload |
| `/predict/base64` | POST | Base64 prediction | JSON with base64 string |
| `/predict/batch` | POST | Batch prediction | Multiple file uploads |

**Service URL**: `http://localhost:8000`  
**Interactive Docs**: `http://localhost:8000/docs`  
**ReDoc**: `http://localhost:8000/redoc`

