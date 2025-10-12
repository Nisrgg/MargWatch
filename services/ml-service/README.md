# MargWatch ML Service

## 🤖 **FOR ML DEVELOPER ONLY**

This directory contains the machine learning service for road issue classification.

### **Quick Start**
```bash
cd ml-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### **Development**
- **Language**: Python 3.9+
- **Framework**: PyTorch/TensorFlow
- **API**: FastAPI
- **MLOps**: MLflow, Weights & Biases

### **Key Files**
- `app.py` - Main Flask application
- `src/models/` - ML model implementations
- `src/data/` - Data processing
- `requirements.txt` - Python dependencies

### **API Endpoints**
```
POST   /predict              # Single image prediction
POST   /batch-predict        # Batch image prediction
GET    /model-info           # Model information
GET    /health               # Health check
```

### **Integration Points**
- Backend API calls this service
- Receives images from complaint submissions
- Returns predictions with confidence scores

### **Documentation**
- See `docs/ml-service/` for detailed documentation
- See `docs/ML_MODEL_ENHANCEMENT_TODO.md` for development plan

---

**Note**: This is your primary development area. Other team members don't need these files.
