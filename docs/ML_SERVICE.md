# MargWatch ML Service

## 1. Overview

- **Stack**: Flask (Python); intended for PyTorch ResNet18; current implementation uses mock/placeholder predictions.
- **Location**: `services/ml-service/` (root `app.py` and/or `src/` package with blueprint).
- **Port**: 8000 (configurable via `ML_SERVICE_PORT`).

---

## 2. Entry Points

- **Root app**: `services/ml-service/app.py` – standalone Flask app with routes at `/health`, `/predict`, `/predict/batch`. Used when running from repo root (e.g. `python app.py`).
- **Package app**: `services/ml-service/src/app.py` – `create_app()` registers blueprint from `src/routes/ml_routes.py` with prefix `/api/ml`, plus root `/health`. Routes: `/api/ml/health`, `/api/ml/predict`, `/api/ml/predict/batch`, `/api/ml/model/info`.

Dockerfile in `services/ml-service` copies the repo and sets `PYTHONPATH=/app`; CMD is `["bash"]`, so the run command (e.g. in docker-compose or a custom command) must start the Flask app explicitly (e.g. `python app.py` or `python -m src.app`). Confirm which entry point is used in your deployment.

---

## 3. Flask Endpoints

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | /health | - | status, message, model_status, model_version, categories, timestamp |
| POST | /predict (root) or /api/ml/predict (blueprint) | **Root/Blueprint**: JSON `{ "image": "<base64>" }`. **Backend expectation**: API sends FormData with `file` (buffer). See Integration note below. | success, category, confidence, model_version, processing_time, image_size?, timestamp |
| POST | /predict/batch or /api/ml/predict/batch | JSON `{ "images": ["<base64>", ...] }` (max 10) | success, predictions[], total_images, timestamp |
| GET | /api/ml/model/info (blueprint only) | - | model_loaded, model_path, categories, confidence_threshold, supported_formats, max_image_size, recommended_size |

---

## 4. Model Loading

- **Config**: `MODEL_PATH` from env; `SERVICE_CONFIG['model_path']` in `src/config/settings.py`.
- **Behavior**: In `MLModelService.load_model()`, if `model_path` exists and is valid, sets `model_loaded = True` (actual PyTorch load is TODO). Otherwise uses mock predictions (`model_loaded = False`).
- **Categories**: POTHOLE, ROAD_INSTABILITY, STREETLIGHT_DAMAGE, TREE_DAMAGE, OTHER (lowercase in responses: `pothole`, `road_instability`, etc.).

---

## 5. Preprocessing Pipeline

- **In code**: `_preprocess_image(image_data: bytes)` – open with PIL, convert to RGB, resize to 224x224 (or `SERVICE_CONFIG['recommended_image_size']`), normalize to [0,1], add batch dimension. Not used in mock path; ready for real model.
- **Validation**: Min image size (e.g. 50x50 in settings); image format validation before predict.

---

## 6. Inference Pipeline

- **predict(image_data)**: If not `model_loaded`, returns `_mock_predict(image_data)` (random category, confidence 0.7–0.95). Else (TODO) preprocess and run model. On exception returns `_fallback_prediction()` (category `other`, confidence 0.5).
- **Response shape**: category (string), confidence (float), model_version (string), processing_time (float). Optional: success, image_size, timestamp, error.

---

## 7. Response Format (Single Predict)

```json
{
  "success": true,
  "category": "pothole",
  "confidence": 0.87,
  "model_version": "mock_v1.0",
  "processing_time": 0.12,
  "image_size": [1024, 768],
  "timestamp": "..."
}
```

Backend maps category string to `IssueCategory` (e.g. `pothole` → POTHOLE) in `mlService.mapCategory()`.

---

## 8. Model Categories and Confidence

- **Categories**: pothole, road_instability, streetlight_damage, tree_damage, other.
- **Confidence**: 0–1. Mock returns 0.7–0.95; fallback 0.5. Backend stores in `Complaint.mlConfidence`.
- **Threshold**: `MODEL_CONFIDENCE_THRESHOLD = 0.6` in config; can be used for filtering or fallback logic.

---

## 9. How the Backend Calls This Service

- **Health**: `GET http://<ML_SERVICE_URL>/health` (e.g. `http://ml-service:8000/health`) from `mlService.healthCheck()`.
- **Prediction**: After uploading complaint images to Cloudinary, backend calls `mlService.predictIssueCategory(imageUrl)`. mlService:
  1. Downloads image from Cloudinary URL to buffer.
  2. POSTs to `ML_MODEL_URL` (e.g. `http://ml-service:8000/predict`) with **FormData** and key `file` (buffer).
- **Integration gap**: Current ML route implementations expect JSON with base64 `image`. The backend sends multipart/form-data `file`. So either:
  - Add a `/predict` route that accepts `request.files['file']` and reads bytes, or
  - Change backend to send base64 JSON to the existing route.
- **Fallback**: If ML request fails, backend uses `IssueCategory.OTHER`, confidence 0.5, model_version `'fallback'`.

---

## 10. Config (src/config/settings.py)

- **SERVICE_CONFIG**: host, port, debug, model_path, max_batch_size, max_image_size_mb, min_image_size, recommended_image_size (224).
- **MODEL_CATEGORIES**, **MODEL_CONFIDENCE_THRESHOLD**, **SUPPORTED_FORMATS**, **LOGGING_CONFIG**.
