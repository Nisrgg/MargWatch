# MargWatch Integration Documentation

## Overview

This document describes how the ML Service integrates with the rest of the MargWatch system, including API contracts, data flow, and error handling.

---

## ML Service Integration

### Integration Points

The ML Service is integrated into the MargWatch system at the following points:

1. **Backend API → ML Service**: Image classification during complaint submission
2. **Category Mapping**: ML categories mapped to shared type enums
3. **Error Handling**: Graceful fallback when ML service is unavailable

---

## Backend API Integration

### Service Location

**File**: `apps/api/src/services/mlService.ts`

### Service Class: `MLService`

Singleton service class that handles all ML service interactions.

#### Configuration

```typescript
private modelUrl: string;      // ML service prediction endpoint
private healthUrl: string;     // ML service health check endpoint
```

Configuration loaded from `config.mlModelUrl` and `config.mlServiceUrl`.

#### Key Methods

##### `predictIssueCategory(imageUrl: string): Promise<MLPredictionResponse>`

**Purpose**: Predict issue category from Cloudinary image URL

**Flow**:
1. Download image from Cloudinary URL
2. Create FormData with image buffer
3. POST to ML service `/predict` endpoint
4. Map ML category to shared type enum
5. Return prediction with metadata

**Error Handling**:
- Falls back to `IssueCategory.OTHER` with 0.5 confidence
- Logs error for debugging
- Returns fallback prediction object

**Response Type**:
```typescript
{
  category: IssueCategory;
  confidence: number;
  modelVersion: string;
  processingTime: number;
  imageSize: [number, number] | null;
  error?: string;
}
```

##### `predictIssueCategoryFromFile(imagePath: string): Promise<MLPredictionResponse>`

**Purpose**: Predict from local file path (for testing/admin use)

**Flow**:
1. Read image file from filesystem
2. Create FormData with image buffer
3. POST to ML service `/predict` endpoint
4. Map and return prediction

##### `batchPredict(imageUrls: string[]): Promise<MLPredictionResponse[]>`

**Purpose**: Batch prediction for multiple images

**Flow**:
1. Process all images in parallel using `Promise.allSettled`
2. Handle individual failures gracefully
3. Return array of predictions

**Error Handling**:
- Individual failures don't stop batch processing
- Failed predictions return fallback values

##### `healthCheck(): Promise<{ healthy: boolean; status?: any }>`

**Purpose**: Check ML service availability

**Flow**:
1. GET request to `/health` endpoint
2. Return health status
3. 5-second timeout

##### `isAvailable(): Promise<boolean>`

**Purpose**: Quick availability check

**Returns**: Boolean indicating service health

##### `getModelInfo(): Promise<any>`

**Purpose**: Get model information and capabilities

**Flow**:
1. GET request to `/model/info` endpoint
2. Return model details

##### `mapCategory(mlCategory: string): IssueCategory`

**Purpose**: Map ML service categories to shared type enums

**Mapping**:
```typescript
'pothole' → IssueCategory.POTHOLE
'road_instability' → IssueCategory.ROAD_INSTABILITY
'streetlight_damage' → IssueCategory.STREETLIGHT_DAMAGE
'tree_damage' → IssueCategory.TREE_DAMAGE
'other' → IssueCategory.OTHER
```

**Default**: Returns `IssueCategory.OTHER` for unknown categories

---

## Complaint Submission Integration

### Integration Point

**File**: `apps/api/src/controllers/complaintController.ts`

**Method**: `submitComplaint()`

### Integration Flow

```typescript
// 1. Upload images to Cloudinary
const imageUrls = await uploadImagesToCloudinary(files);

// 2. Check ML service availability
const mlAvailable = await mlService.isAvailable();

// 3. Get ML prediction if available
if (mlAvailable && imageUrls.length > 0) {
  const mlPrediction = await mlService.predictIssueCategory(imageUrls[0]);
  predictedCategory = mlPrediction.category;
  mlConfidence = mlPrediction.confidence;
  mlModelVersion = mlPrediction.modelVersion;
  mlProcessingTime = mlPrediction.processingTime;
}

// 4. Create complaint with ML prediction
const complaint = await prisma.complaint.create({
  data: {
    category: predictedCategory,
    mlConfidence: mlConfidence,
    mlModelVersion: mlModelVersion,
    // ... other fields
  }
});
```

### Error Handling

- ML service unavailability doesn't block complaint submission
- Falls back to `IssueCategory.OTHER`
- Errors are logged but don't affect user experience
- ML metadata stored even if prediction fails

---

## Category Mapping

### ML Service Categories

The ML service uses these categories (from `main.py`):

```python
MODEL_CATEGORIES = [
    'POTHOLE',
    'ROAD_INSTABILITY',
    'STREETLIGHT_DAMAGE',
    'TREE_DAMAGE',
    'OTHER'
]
```

### Shared Type Categories

The shared types package defines (from `packages/shared-types/src/enums/IssueCategory.ts`):

```typescript
export enum IssueCategory {
  POTHOLE = 'POTHOLE',
  ROAD_INSTABILITY = 'ROAD_INSTABILITY',
  STREETLIGHT_DAMAGE = 'STREETLIGHT_DAMAGE',
  TREE_DAMAGE = 'TREE_DAMAGE',
  OTHER = 'OTHER'
}
```

### Mapping Logic

The mapping is case-insensitive and handles variations:

```typescript
private mapCategory(mlCategory: string): IssueCategory {
  const categoryMap: { [key: string]: IssueCategory } = {
    'pothole': IssueCategory.POTHOLE,
    'road_instability': IssueCategory.ROAD_INSTABILITY,
    'streetlight_damage': IssueCategory.STREETLIGHT_DAMAGE,
    'tree_damage': IssueCategory.TREE_DAMAGE,
    'other': IssueCategory.OTHER,
  };
  
  return categoryMap[mlCategory.toLowerCase()] || IssueCategory.OTHER;
}
```

---

## API Contract

### Request Format

**Endpoint**: `POST /predict`

**Content-Type**: `multipart/form-data`

**Body**:
```
file: [image file]
```

**Headers**:
```
Content-Type: multipart/form-data
```

### Response Format

**Success Response** (200 OK):
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

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "error": "Invalid image format",
  "message": "Image too small (minimum 50x50 pixels)"
}
```

**Error Response** (500 Internal Server Error):
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Model prediction failed"
}
```

---

## Error Handling Strategy

### ML Service Unavailable

**Scenario**: ML service is down or unreachable

**Handling**:
1. Backend API checks availability before calling
2. If unavailable, skips ML prediction
3. Uses default category (`IssueCategory.OTHER`)
4. Complaint submission continues normally
5. Error logged for monitoring

### ML Prediction Failure

**Scenario**: ML service returns error or invalid response

**Handling**:
1. Try-catch block catches exceptions
2. Returns fallback prediction
3. Complaint created with fallback category
4. Error details stored in response
5. User experience unaffected

### Timeout Handling

**Scenario**: ML service takes too long to respond

**Handling**:
- 30-second timeout configured
- Request cancelled on timeout
- Fallback prediction used
- Error logged

### Invalid Response

**Scenario**: ML service returns unexpected format

**Handling**:
1. Response validation checks required fields
2. Falls back if validation fails
3. Logs response for debugging
4. Uses default category

---

## Performance Considerations

### Image Download

- Images downloaded from Cloudinary before ML prediction
- 15-second timeout for image download
- Efficient buffer handling

### Request Timeout

- 30-second timeout for ML prediction
- Prevents hanging requests
- Allows fallback mechanism

### Batch Processing

- Multiple images processed in parallel
- Individual failures don't block others
- Efficient resource utilization

### Caching (Future)

- Potential to cache predictions for duplicate images
- Reduce ML service load
- Faster response times

---

## Configuration

### Environment Variables

**Backend API**:
```env
ML_SERVICE_URL=http://ml-service:8000
ML_MODEL_URL=http://ml-service:8000/predict
```

**ML Service**:
```env
ML_SERVICE_HOST=0.0.0.0
ML_SERVICE_PORT=8000
MODEL_PATH=/app/models/road_issue_model.pth
```

### Docker Network

Services communicate via Docker network:
- Network name: `margwatch-network`
- Service discovery via service names
- Internal communication (not exposed externally)

---

## Testing Integration

### Unit Tests

Test ML service integration in isolation:
- Mock ML service responses
- Test error handling
- Test category mapping

### Integration Tests

Test end-to-end flow:
- Submit complaint with image
- Verify ML prediction stored
- Verify fallback on ML failure

### Test ML Service

Use `test_ml_service.py` to verify ML service:
```bash
cd services/ml-service
python test_ml_service.py
```

---

## Monitoring

### Health Checks

**Backend API** checks ML service health:
- Before each prediction request
- Periodic health checks (future)
- Logs health status

### Metrics (Future)

Track:
- ML prediction success rate
- Average processing time
- Error rates
- Service availability

### Logging

Logs include:
- ML prediction requests
- Success/failure status
- Processing times
- Error details

---

## Future Enhancements

### Model Versioning

- Support multiple model versions
- A/B testing capabilities
- Gradual rollout of new models

### Prediction Caching

- Cache predictions for duplicate images
- Reduce ML service load
- Faster response times

### Batch Optimization

- Optimize batch processing
- Parallel model inference
- Resource pooling

### Real-time Updates

- WebSocket notifications for ML predictions
- Real-time confidence updates
- Live model performance metrics

---

## Troubleshooting

### ML Service Not Responding

1. Check service health: `curl http://ml-service:8000/health`
2. Check Docker logs: `docker logs ml-service`
3. Verify network connectivity
4. Check service configuration

### Category Mapping Issues

1. Verify ML service categories match mapping
2. Check case sensitivity
3. Review mapping logic in `mlService.ts`
4. Test with known categories

### Performance Issues

1. Check ML service processing times
2. Monitor image download times
3. Review timeout configurations
4. Consider caching strategies

---

## Conclusion

The ML Service integration is designed to be resilient, with comprehensive error handling and fallback mechanisms. The system continues to function even when the ML service is unavailable, ensuring a smooth user experience while providing intelligent categorization when possible.

