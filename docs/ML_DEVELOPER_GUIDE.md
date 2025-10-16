# ML Service Development Guide

## 🤖 **FOR ML DEVELOPER ONLY**

### **Your Responsibilities**
You are responsible for developing and enhancing the machine learning service that classifies road issues from images.

### **What You Need to Work With**

#### **✅ ML Service Directory**
```
ml-service/
├── src/
│   ├── models/                 # Your ML model implementations
│   ├── data/                  # Data processing pipelines
│   ├── training/              # Training scripts
│   ├── inference/             # Inference pipeline
│   └── utils/                 # ML utilities
├── data/                      # Training datasets
├── experiments/                # ML experiments
├── notebooks/                 # Jupyter notebooks
├── requirements.txt           # Python dependencies
└── Dockerfile                 # ML service container
```

#### **✅ Backend Integration Files**
```
backend/src/services/mlService.ts          # ML service integration
backend/src/controllers/complaintController.ts  # ML API endpoints
```

#### **✅ Database Schema (ML-related)**
- Complaint table with ML prediction fields
- ML model version tracking
- Prediction accuracy metrics

### **What You DON'T Need**
- ❌ Android app files (`MargWatch/` directory)
- ❌ Admin portal files (handled by Team Member 1)
- ❌ Mobile-specific configurations
- ❌ Frontend code

### **Your Development Workflow**

#### **1. Local Development**
```bash
cd ml-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

#### **2. ML Model Development**
- Use the comprehensive TODO list in `ML_MODEL_ENHANCEMENT_TODO.md`
- Follow the 16-week development plan
- Implement industry-standard ML practices

#### **3. API Integration**
- Your ML service runs on port 5001
- Backend calls your service via HTTP
- Use FastAPI for your ML API
- Follow the API specifications in the TODO list

### **Key API Endpoints You Need to Implement**
```
POST   /predict              # Single image prediction
POST   /batch-predict        # Batch image prediction
GET    /model-info           # Model information
GET    /health               # Health check
POST   /retrain              # Model retraining
GET    /performance          # Model performance metrics
```

### **Integration Points with Backend**
- Backend sends images to your service
- You return predictions with confidence scores
- Backend stores predictions in database
- You provide model performance metrics

### **Development Environment**
- **Python**: 3.9+
- **ML Framework**: PyTorch or TensorFlow
- **API**: FastAPI
- **Containerization**: Docker
- **MLOps**: MLflow, Weights & Biases

### **Testing Your ML Service**
```bash
# Test single prediction
curl -X POST http://localhost:5001/predict \
  -F "image=@test-image.jpg"

# Test health check
curl http://localhost:5001/health
```

### **Communication with Other Team Members**
- **Backend Developer**: Coordinate on API integration
- **Android Developer**: Not directly - backend handles mobile integration
- **Project Lead**: Report progress and blockers

### **Resources**
- **Comprehensive TODO**: `ML_MODEL_ENHANCEMENT_TODO.md`
- **Project Structure**: `PROJECT_STRUCTURE.md`
- **Team Collaboration**: `TEAM_TODO_LIST.md`

---

## 🚀 **Quick Start for ML Developer**

1. **Clone the repository**
2. **Navigate to ML service**: `cd ml-service`
3. **Set up environment**: Follow setup in TODO list
4. **Start development**: Follow 16-week plan
5. **Integrate with backend**: Use provided API specifications

**Focus on**: Computer vision, model training, API development, and ML operations.

**Don't worry about**: Mobile app, admin portal, or frontend development.
