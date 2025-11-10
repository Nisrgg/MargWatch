#!/usr/bin/env python3
"""
Test script for the MargWatch ML Service
This script tests the ML service endpoints to ensure they're working correctly.
"""

import requests
import base64
import io
from PIL import Image
import numpy as np
import time

# ML Service Configuration
ML_SERVICE_URL = "http://localhost:8000"
TEST_IMAGE_SIZE = (224, 224)

def create_test_image(category: str = "POTHOLE") -> bytes:
    """Create a simple test image for testing purposes"""
    # Create a simple colored image
    if category == "POTHOLE":
        # Create a dark circular area (simulating a pothole)
        image = Image.new('RGB', TEST_IMAGE_SIZE, color='lightgray')
        pixels = np.array(image)
        
        # Add a dark circular area in the center
        center_x, center_y = TEST_IMAGE_SIZE[0] // 2, TEST_IMAGE_SIZE[1] // 2
        radius = 30
        
        for x in range(TEST_IMAGE_SIZE[0]):
            for y in range(TEST_IMAGE_SIZE[1]):
                if (x - center_x)**2 + (y - center_y)**2 <= radius**2:
                    pixels[y, x] = [50, 50, 50]  # Dark gray
        
        image = Image.fromarray(pixels)
    else:
        # Create a simple colored image
        colors = {
            "ROAD_INSTABILITY": (100, 100, 100),
            "STREETLIGHT_DAMAGE": (200, 200, 100),
            "TREE_DAMAGE": (50, 150, 50),
            "OTHER": (150, 150, 150)
        }
        color = colors.get(category, (150, 150, 150))
        image = Image.new('RGB', TEST_IMAGE_SIZE, color=color)
    
    # Convert to bytes
    img_buffer = io.BytesIO()
    image.save(img_buffer, format='JPEG')
    return img_buffer.getvalue()

def test_health_endpoint():
    """Test the health endpoint"""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get(f"{ML_SERVICE_URL}/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data['status']}")
            print(f"   Model status: {data['model_status']}")
            print(f"   Model version: {data['model_version']}")
            print(f"   Categories: {data['categories']}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_model_info():
    """Test the model info endpoint"""
    print("\n🔍 Testing model info endpoint...")
    try:
        response = requests.get(f"{ML_SERVICE_URL}/model/info", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Model info retrieved:")
            print(f"   Model loaded: {data['model_loaded']}")
            print(f"   Model name: {data['model_name']}")
            print(f"   Framework: {data['framework']}")
            print(f"   Input shape: {data['input_shape']}")
            return True
        else:
            print(f"❌ Model info failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Model info error: {e}")
        return False

def test_prediction_endpoint():
    """Test the prediction endpoint with file upload"""
    print("\n🔍 Testing prediction endpoint...")
    try:
        # Create test image
        test_image = create_test_image("POTHOLE")
        
        # Prepare file upload
        files = {'file': ('test_image.jpg', test_image, 'image/jpeg')}
        
        # Make prediction request
        response = requests.post(f"{ML_SERVICE_URL}/predict", files=files, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Prediction successful:")
            print(f"   Category: {data['category']}")
            print(f"   Confidence: {data['confidence']:.3f}")
            print(f"   Model version: {data['model_version']}")
            print(f"   Processing time: {data['processing_time']:.3f}s")
            print(f"   Image size: {data['image_size']}")
            return True
        else:
            print(f"❌ Prediction failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Prediction error: {e}")
        return False

def test_base64_prediction():
    """Test the base64 prediction endpoint (for backward compatibility)"""
    print("\n🔍 Testing base64 prediction endpoint...")
    try:
        # Create test image
        test_image = create_test_image("ROAD_INSTABILITY")
        
        # Convert to base64
        base64_image = base64.b64encode(test_image).decode('utf-8')
        
        # Make prediction request
        response = requests.post(f"{ML_SERVICE_URL}/predict/base64", 
                               json={'image': base64_image}, 
                               timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Base64 prediction successful:")
            print(f"   Category: {data['category']}")
            print(f"   Confidence: {data['confidence']:.3f}")
            print(f"   Model version: {data['model_version']}")
            return True
        else:
            print(f"❌ Base64 prediction failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Base64 prediction error: {e}")
        return False

def test_batch_prediction():
    """Test the batch prediction endpoint"""
    print("\n🔍 Testing batch prediction endpoint...")
    try:
        # Create multiple test images
        test_images = []
        categories = ["POTHOLE", "ROAD_INSTABILITY", "STREETLIGHT_DAMAGE", "TREE_DAMAGE"]
        
        for category in categories:
            test_image = create_test_image(category)
            test_images.append(('file', (f'test_{category.lower()}.jpg', test_image, 'image/jpeg')))
        
        # Make batch prediction request
        response = requests.post(f"{ML_SERVICE_URL}/predict/batch", 
                               files=test_images, 
                               timeout=60)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Batch prediction successful:")
            print(f"   Total files: {data['total_files']}")
            print(f"   Predictions:")
            for i, pred in enumerate(data['predictions']):
                print(f"     {i+1}. {pred['file_name']}: {pred['category']} ({pred['confidence']:.3f})")
            return True
        else:
            print(f"❌ Batch prediction failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Batch prediction error: {e}")
        return False

def main():
    """Run all tests"""
    print("🤖 MargWatch ML Service Test Suite")
    print("=" * 50)
    
    # Wait a moment for service to be ready
    print("⏳ Waiting for ML service to be ready...")
    time.sleep(2)
    
    # Run tests
    tests = [
        ("Health Check", test_health_endpoint),
        ("Model Info", test_model_info),
        ("File Upload Prediction", test_prediction_endpoint),
        ("Base64 Prediction", test_base64_prediction),
        ("Batch Prediction", test_batch_prediction),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ Test {test_name} crashed: {e}")
            results.append((test_name, False))
    
    # Summary
    print(f"\n{'='*50}")
    print("📊 Test Results Summary:")
    print("=" * 50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"   {test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! ML service is working correctly.")
    else:
        print("⚠️ Some tests failed. Check the ML service logs for details.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
