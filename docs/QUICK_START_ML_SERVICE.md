# ML Service Quick Start Guide

## 📁 Directory Structure

Your project structure looks like this:

```
MargWatch/                          ← ROOT DIRECTORY (start here)
├── services/
│   └── ml-service/                 ← ML Service directory
│       ├── main.py                 ← Main service file
│       ├── requirements.txt        ← Python dependencies
│       ├── test_ml_service.py      ← Test script
│       └── README.md
├── apps/
│   └── api/                        ← Backend API
├── infrastructure/
│   └── docker/                     ← Docker setup
└── docs/                           ← Documentation
```

---

## 🚀 Step-by-Step: Testing ML Service Locally

### Step 1: Navigate to ML Service Directory

**Open your terminal/command prompt and run:**

```bash
# If you're in the root directory (MargWatch/)
cd services/ml-service

# Verify you're in the right place - you should see main.py
ls main.py
# or on Windows:
dir main.py
```

**Current directory should be:** `D:\code\VCS\MargWatch\services\ml-service`

---

### Step 2: Install Python Dependencies

**Still in `services/ml-service/` directory:**

```bash
pip install -r requirements.txt
```

**Note**: This may take 5-10 minutes as PyTorch is a large package (~500MB).

**Verify installation:**
```bash
python --version  # Should show Python 3.9 or higher
python -c "import torch; print('PyTorch:', torch.__version__)"
```

---

### Step 3: Start the ML Service

**Still in `services/ml-service/` directory:**

```bash
python main.py
```

**You should see:**
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
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**⚠️ Keep this terminal window open!** The service is now running.

---

### Step 4: Test the Service (Open a NEW Terminal)

**Open a NEW terminal window** (keep the first one running the service)

**Option A: Test from any directory using full URL**

```bash
# Health check (works from anywhere)
curl http://localhost:8000/health
```

**Option B: Navigate to ML service directory for testing**

```bash
# Navigate to ML service directory
cd D:\code\VCS\MargWatch\services\ml-service

# Run automated tests
python test_ml_service.py
```

---

## 📝 Complete Command Sequence

Here's the complete sequence from scratch:

### Terminal 1 (Service)

```bash
# 1. Navigate to project root
cd D:\code\VCS\MargWatch

# 2. Navigate to ML service
cd services\ml-service

# 3. Install dependencies (only first time)
pip install -r requirements.txt

# 4. Start the service
python main.py
```

### Terminal 2 (Testing)

```bash
# Option 1: Test from anywhere
curl http://localhost:8000/health

# Option 2: Run test script
cd D:\code\VCS\MargWatch\services\ml-service
python test_ml_service.py

# Option 3: Test with your own image
curl -X POST http://localhost:8000/predict -F "file=@C:\path\to\your\image.jpg"
```

---

## 🎯 Quick Reference: Where to Run Commands

| Task | Directory | Command |
|------|-----------|---------|
| **Install dependencies** | `services/ml-service/` | `pip install -r requirements.txt` |
| **Start service** | `services/ml-service/` | `python main.py` |
| **Run tests** | `services/ml-service/` | `python test_ml_service.py` |
| **Test with curl** | **Any directory** | `curl http://localhost:8000/health` |
| **Test with image** | **Any directory** | `curl -X POST http://localhost:8000/predict -F "file=@image.jpg"` |

---

## 🔍 Verify Your Current Directory

### Windows (Command Prompt)
```cmd
cd
# Shows: D:\code\VCS\MargWatch\services\ml-service
```

### Windows (PowerShell)
```powershell
pwd
# Shows: D:\code\VCS\MargWatch\services\ml-service
```

### Linux/Mac
```bash
pwd
# Shows: /path/to/MargWatch/services/ml-service
```

---

## 🐛 Common Issues

### Issue: "No such file or directory"

**Problem**: You're not in the right directory.

**Solution**:
```bash
# Check where you are
pwd  # or 'cd' on Windows

# Navigate to correct directory
cd D:\code\VCS\MargWatch\services\ml-service

# Verify main.py exists
ls main.py  # or 'dir main.py' on Windows
```

### Issue: "python: command not found"

**Problem**: Python is not installed or not in PATH.

**Solution**:
```bash
# Try python3 instead
python3 main.py

# Or check Python installation
python --version
```

### Issue: "ModuleNotFoundError: No module named 'torch'"

**Problem**: Dependencies not installed.

**Solution**:
```bash
# Make sure you're in the right directory
cd D:\code\VCS\MargWatch\services\ml-service

# Install dependencies
pip install -r requirements.txt
```

### Issue: "Address already in use"

**Problem**: Port 8000 is already in use.

**Solution**:
```bash
# Find what's using port 8000 (Windows)
netstat -ano | findstr :8000

# Kill the process or use a different port
# Edit main.py and change port=8000 to port=8001
```

---

## 📂 Absolute Paths Reference

Based on your workspace, here are the absolute paths:

- **Project Root**: `D:\code\VCS\MargWatch\`
- **ML Service**: `D:\code\VCS\MargWatch\services\ml-service\`
- **Main File**: `D:\code\VCS\MargWatch\services\ml-service\main.py`
- **Test Script**: `D:\code\VCS\MargWatch\services\ml-service\test_ml_service.py`
- **Requirements**: `D:\code\VCS\MargWatch\services\ml-service\requirements.txt`

---

## ✅ Quick Checklist

Before starting, verify:

- [ ] You have Python 3.9+ installed
- [ ] You know where your project is located (`D:\code\VCS\MargWatch\`)
- [ ] You can navigate to `services\ml-service\` directory
- [ ] You see `main.py` file in that directory
- [ ] You have internet connection (for downloading PyTorch)

---

## 🎓 Next Steps

Once the service is running:

1. **Test Health**: Open browser to http://localhost:8000/health
2. **Interactive Docs**: Open http://localhost:8000/docs
3. **Test with Image**: Use curl or Postman to send an image
4. **Read Full Guide**: See `docs/ML_SERVICE_TESTING_GUIDE.md` for detailed examples

---

## 💡 Pro Tips

1. **Use two terminal windows**: One for running the service, one for testing
2. **Keep service running**: Don't close the terminal running `python main.py`
3. **Test from browser**: Fastest way is http://localhost:8000/docs
4. **Check logs**: The service prints useful information in the terminal

---

## 📞 Still Confused?

**Show me your current directory:**
```bash
# Windows
cd

# Linux/Mac
pwd
```

**Then navigate step by step:**
```bash
# Step 1: Go to project root
cd D:\code\VCS\MargWatch

# Step 2: Go to ML service
cd services\ml-service

# Step 3: List files (verify you're in right place)
dir  # Windows
# or
ls   # Linux/Mac

# You should see: main.py, requirements.txt, test_ml_service.py
```

