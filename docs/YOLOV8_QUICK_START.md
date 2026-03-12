# YOLOv8-Segmentation Quick Start Guide

**Quick reference for training YOLOv8-segmentation model for MargWatch road hazards.**

---

## 🎯 Goal

Train a YOLOv8-segmentation model to detect 4 categories:
1. **pothole** - Road surface depressions
2. **instable_cracked_road** - Cracks, rutting, bumps, subsidence
3. **fallen_trees** - Fallen trees and storm debris
4. **garbage** - Roadside garbage, litter, urban waste

---

## 📋 Prerequisites

- Roboflow account (for dataset management)
- Python 3.8+
- GPU recommended (CUDA-capable) for faster training
- ~50GB free disk space for datasets and models

---

## 🚀 Quick Start (5 Steps)

### Step 1: Prepare Datasets in Roboflow

1. **Create Roboflow Project:**
   - Go to [roboflow.com](https://roboflow.com)
   - Create new project: "Instance Segmentation"
   - Add 4 classes: `pothole`, `instable_cracked_road`, `fallen_trees`, `garbage`

2. **Upload Datasets:**
   - **Pothole:** Pothole Mix, RoadDefects-ISeg, EGY_PDD (pothole class only)
   - **Instability:** EGY_PDD (crack classes), Cracks and Potholes dataset (crack class)
   - **Fallen Trees:** "Fallen Trees On Road" dataset (convert bboxes to polygons)
   - **Garbage:** TACO dataset, custom annotations

3. **Merge & Export:**
   - Merge all datasets
   - Apply augmentation
   - Split: 70% train, 15% val, 15% test
   - Export as **YOLOv8** format

### Step 2: Download & Validate Dataset

```bash
# Download dataset from Roboflow
# Extract to: datasets/margwatch-road-hazards-seg/

# Validate dataset
cd services/ml-service
python preprocess_dataset.py ../datasets/margwatch-road-hazards-seg --all
```

### Step 3: Install Dependencies

```bash
# Install YOLOv8
pip install ultralytics

# Install additional tools
pip install opencv-python pillow numpy matplotlib
```

### Step 4: Train Model

```bash
cd services/ml-service

# Basic training
python train_yolov8_seg.py

# Advanced training (custom parameters)
python train_yolov8_seg.py \
    --model-size s \
    --epochs 300 \
    --batch 32 \
    --imgsz 640 \
    --name margwatch-hazards-v1
```

### Step 5: Evaluate & Deploy

```bash
# Model will be saved to: runs/segment/margwatch-hazards/weights/best.pt

# Test predictions
yolo segment predict \
    model=runs/segment/margwatch-hazards/weights/best.pt \
    source=test_image.jpg

# Export for deployment
yolo export \
    model=runs/segment/margwatch-hazards/weights/best.pt \
    format=onnx
```

---

## 📊 Dataset Sources

### Category 1: Pothole
- **Pothole Mix** (4,340 images) - [Mendeley Data](https://data.mendeley.com/datasets/kfth5g2xk3)
- **RoadDefects-ISeg** (1,000 images) - [Zenodo](https://zenodo.org/records/17194814)
- **EGY_PDD** (14,612 images) - Extract pothole class only

### Category 2: Instable/Cracked Road
- **EGY_PDD** - All crack classes (longitudinal, transverse, alligator, block)
- **EGY_PDD** - Instability classes (rutting, bumps, sags)
- **Cracks and Potholes** - Extract crack class only

### Category 3: Fallen Trees
- **"Fallen Trees On Road"** (234 images) - Convert bboxes to polygons
- **RescueNet** - Extract tree/debris classes

### Category 4: Garbage
- **TACO Dataset** - Trash annotation dataset
- **Custom collection** - May be required

---

## 🔧 Class Label Mapping

When merging datasets in Roboflow, map all classes to 4 unified categories:

| Original Class | Unified Class |
|----------------|---------------|
| pothole, potholes, D40 | pothole |
| crack, cracks, longitudinal_crack, transverse_crack, alligator_crack, D00, D10, D20 | instable_cracked_road |
| rutting, bump, sag, D43, D44 | instable_cracked_road |
| fallen_tree, tree, debris | fallen_trees |
| garbage, litter, trash, waste | garbage |

---

## 📁 Expected Dataset Structure

```
margwatch-road-hazards-seg/
├── data.yaml
├── train/
│   ├── images/
│   └── labels/
├── valid/
│   ├── images/
│   └── labels/
└── test/
    ├── images/
    └── labels/
```

---

## ⚙️ Training Configuration

### Recommended Settings

**For GPU (8GB+ VRAM):**
- Model: `yolov8n-seg.pt` (start with nano)
- Batch size: 16-32
- Image size: 640
- Epochs: 200

**For CPU:**
- Model: `yolov8n-seg.pt`
- Batch size: 4-8
- Image size: 640
- Epochs: 100-200

### Model Sizes

| Size | Parameters | Speed | Accuracy |
|------|------------|-------|----------|
| n (nano) | 3.2M | Fastest | Baseline |
| s (small) | 11.2M | Fast | Better |
| m (medium) | 25.9M | Medium | Good |
| l (large) | 43.7M | Slow | Better |
| x (xlarge) | 68.2M | Slowest | Best |

**Recommendation:** Start with `n`, upgrade to `s` or `m` if needed.

---

## 📈 Monitoring Training

### Key Metrics

- **mAP50 (boxes):** Mean Average Precision at IoU=0.5
- **mAP50-95 (boxes):** mAP at IoU=0.5:0.95
- **mAP50 (masks):** Segmentation mask mAP at IoU=0.5
- **mAP50-95 (masks):** Segmentation mask mAP at IoU=0.5:0.95

### Training Output

Results saved to: `runs/segment/margwatch-hazards/`

- `weights/best.pt` - Best model (highest mAP)
- `weights/last.pt` - Last checkpoint
- `results.png` - Training curves
- `confusion_matrix.png` - Confusion matrix
- `val_batch0_labels.jpg` - Validation predictions

---

## 🐛 Troubleshooting

### Out of Memory
```bash
# Reduce batch size
python train_yolov8_seg.py --batch 8

# Use smaller model
python train_yolov8_seg.py --model-size n
```

### Poor Performance
- Check class balance (use `preprocess_dataset.py --stats`)
- Verify annotation quality
- Increase training epochs
- Try larger model size

### Training Stalls
- Check learning rate (default should work)
- Verify data loading (check workers parameter)
- Monitor GPU utilization

---

## 📚 Full Documentation

For detailed information, see:
- **[YOLOV8_SEG_TRAINING_GUIDE.md](./YOLOV8_SEG_TRAINING_GUIDE.md)** - Complete training guide
- **[ROAD_HAZARD_DATASETS_RESEARCH.md](./ROAD_HAZARD_DATASETS_RESEARCH.md)** - Dataset research

---

## 🔗 Useful Links

- [Ultralytics YOLOv8 Docs](https://docs.ultralytics.com/)
- [Roboflow Universe](https://universe.roboflow.com/)
- [YOLOv8 Segmentation Guide](https://docs.ultralytics.com/tasks/segment/)

---

## ✅ Checklist

- [ ] Roboflow project created with 4 classes
- [ ] All datasets uploaded and merged
- [ ] Classes mapped to unified scheme
- [ ] Dataset exported in YOLOv8 format
- [ ] Dataset validated locally
- [ ] `data.yaml` created
- [ ] Training environment set up
- [ ] Model trained successfully
- [ ] Model evaluated on test set
- [ ] Model exported for deployment
- [ ] Model integrated into ML service

---

**Last Updated:** January 2025

