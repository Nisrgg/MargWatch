# YOLOv8-Segmentation Training Guide for MargWatch

**Purpose:** Complete guide for preparing datasets and training YOLOv8-segmentation model for 4 road hazard categories.

**Target Categories:**
1. **pothole** - Road surface depressions
2. **instable/cracked_road** - Road instability, cracks, subsidence
3. **fallen_trees** - Fallen trees and storm debris
4. **garbage** - Roadside garbage, litter, urban waste

---

## Table of Contents

1. [Dataset Strategy Overview](#dataset-strategy-overview)
2. [Class Label Mapping](#class-label-mapping)
3. [Roboflow Workflow](#roboflow-workflow)
4. [Data Preprocessing Steps](#data-preprocessing-steps)
5. [Dataset Quality Assurance](#dataset-quality-assurance)
6. [YOLOv8-seg Training Preparation](#yolov8-seg-training-preparation)
7. [Training Configuration](#training-configuration)
8. [Model Integration](#model-integration)

---

## 1. Dataset Strategy Overview

### 1.1 Recommended Datasets by Category

#### Category 1: Pothole
**Primary Sources:**
- **Pothole Mix Dataset** (4,340 images, segmentation masks, CC BY 4.0)
- **RoadDefects-ISeg** (1,000 images, YOLO format, CC BY 4.0)
- **EGY_PDD** (14,612 images, YOLO format, pothole class)
- **Cracks and Potholes in Road** (2,235 images, segmentation masks, CC BY 4.0)

**Strategy:** Use pothole class from all datasets. Extract only pothole annotations, ignore crack annotations (they go to Category 2).

#### Category 2: Instable/Cracked Road
**Primary Sources:**
- **EGY_PDD** - Map these classes to "instable/cracked_road":
  - Longitudinal cracks
  - Transverse cracks
  - Alligator cracks
  - Block cracks
  - Rutting
  - Bumps and sags
- **Cracks and Potholes in Road** - Use crack annotations
- **Pothole Mix** - Use crack annotations
- **RDD2022** - Convert bounding boxes to segmentation, map crack types

**Strategy:** Merge all crack-related and instability-related classes into single "instable/cracked_road" category.

#### Category 3: Fallen Trees
**Primary Sources:**
- **"Fallen Trees On Road" object detection dataset** (234 images with bounding boxes)
- **RescueNet** - Extract tree/debris classes
- **IDD-AW** - Extract relevant adverse weather scenarios

**Strategy:** 
1. Download the 234-image object detection dataset
2. Upload to Roboflow
3. Convert bounding boxes to instance segmentation masks manually
4. Use existing bounding boxes as guides for polygon tracing

#### Category 4: Garbage
**Primary Sources:**
- **TACO Dataset** (if available) - Trash annotation in COCO format
- **Outdoor Hazard Detection** - May contain relevant classes
- **Cityscapes** - Extract relevant urban waste scenes (manual annotation)

**Strategy:** 
1. Merge multiple garbage/trash datasets
2. Map all granular labels (litter, trash, waste, rubbish, etc.) to single "garbage" class
3. May require custom data collection

---

## 2. Class Label Mapping

### 2.1 Unified Label Scheme

Create a mapping dictionary for Roboflow:

```python
# Unified class mapping for 4 categories
UNIFIED_LABELS = {
    # Category 1: Pothole
    "pothole": [
        "pothole",
        "potholes", 
        "D40",  # RDD2022
        "pothole_mix",  # Pothole Mix dataset
    ],
    
    # Category 2: Instable/Cracked Road
    "instable_cracked_road": [
        # Cracks
        "crack",
        "cracks",
        "longitudinal_crack",
        "transverse_crack",
        "alligator_crack",
        "block_crack",
        "D00",  # RDD2022 - Longitudinal
        "D10",  # RDD2022 - Transverse
        "D20",  # RDD2022 - Alligator
        # Instability indicators
        "rutting",
        "bump",
        "sag",
        "bumps_and_sags",
        "D43",  # RDD2022 - Rutting
        "D44",  # RDD2022 - Bumps/sags
        "subsidence",
        "road_instability",
    ],
    
    # Category 3: Fallen Trees
    "fallen_trees": [
        "fallen_tree",
        "fallen_trees",
        "tree",
        "trees",
        "storm_debris",
        "debris",
        "obstruction",
        "fallen_branch",
    ],
    
    # Category 4: Garbage
    "garbage": [
        "garbage",
        "litter",
        "trash",
        "waste",
        "rubbish",
        "refuse",
        "debris",  # If not tree-related
        "urban_waste",
        "roadside_garbage",
    ]
}
```

### 2.2 Label Mapping Rules

**Important Decisions:**

1. **Pothole vs. Crack Separation:**
   - When a dataset has both pothole and crack classes:
     - Use **pothole** class → Category 1
     - Use **crack** class → Category 2
   - Example: "Cracks and Potholes in Road" dataset
     - Extract pothole masks → pothole
     - Extract crack masks → instable_cracked_road

2. **Crack Type Consolidation:**
   - All crack types (longitudinal, transverse, alligator, block) → instable_cracked_road
   - All instability indicators (rutting, bumps, sags) → instable_cracked_road

3. **Debris Classification:**
   - Tree-related debris → fallen_trees
   - Non-tree debris (urban waste) → garbage
   - If ambiguous, use context (roadside = garbage, on road = fallen_trees)

---

## 3. Roboflow Workflow

### 3.1 Initial Setup

1. **Create Roboflow Account**
   - Sign up at [roboflow.com](https://roboflow.com)
   - Create a new workspace: "MargWatch Road Hazards"

2. **Create New Project**
   - Project Name: `margwatch-road-hazards-seg`
   - Project Type: **Instance Segmentation**
   - License: Choose appropriate (CC BY 4.0 recommended)

3. **Define Classes**
   - Add 4 classes:
     - `pothole`
     - `instable_cracked_road`
     - `fallen_trees`
     - `garbage`

### 3.2 Dataset Upload Workflow

#### Step 1: Upload Pothole Datasets

**For each pothole dataset:**

1. **Upload Dataset**
   - Click "Add Images" → "Upload"
   - Upload images and annotations
   - Select annotation format (YOLO, COCO, Pascal VOC, or masks)

2. **Format Conversion** (if needed)
   - Roboflow auto-detects format
   - If bounding boxes, convert to segmentation:
     - Go to "Annotate" tab
     - Use "Auto-Annotate" → "Convert Bounding Boxes to Polygons"
     - Or manually trace polygons

3. **Class Mapping**
   - Map dataset classes to unified classes:
     - `pothole`, `potholes`, `D40` → `pothole`
     - Remove or ignore `crack` classes (save for Category 2)

4. **Quality Check**
   - Review annotations
   - Fix incorrect masks
   - Remove low-quality images

#### Step 2: Upload Instability/Crack Datasets

**For each crack/instability dataset:**

1. **Upload Dataset**
   - Upload images and annotations

2. **Class Mapping**
   - Map all crack types to `instable_cracked_road`:
     - `longitudinal_crack`, `D00` → `instable_cracked_road`
     - `transverse_crack`, `D10` → `instable_cracked_road`
     - `alligator_crack`, `D20` → `instable_cracked_road`
     - `rutting`, `D43` → `instable_cracked_road`
     - `bumps_and_sags`, `D44` → `instable_cracked_road`

3. **Bounding Box to Segmentation** (for RDD2022)
   - Use Roboflow's auto-convert feature
   - Or manually trace polygons using bounding boxes as guides

#### Step 3: Upload Fallen Trees Dataset

**For the 234-image "Fallen Trees On Road" dataset:**

1. **Upload Object Detection Dataset**
   - Upload images and bounding box annotations

2. **Convert to Segmentation**
   - **Manual Process:**
     - Go to "Annotate" tab
     - For each image:
       - Click on bounding box
       - Select "Convert to Polygon"
       - Trace the tree outline following the bounding box guide
       - Label as `fallen_trees`
   - **Semi-Automated:**
     - Use "Auto-Annotate" → "Convert Bounding Boxes to Polygons"
     - Review and refine each polygon manually

3. **Quality Assurance**
   - Ensure polygons accurately trace tree shapes
   - Remove background pixels
   - Fix any mislabeled instances

#### Step 4: Upload Garbage Datasets

**For garbage/trash datasets:**

1. **Upload Multiple Datasets**
   - TACO dataset (if available)
   - Outdoor Hazard Detection (extract relevant classes)
   - Any other trash/litter datasets

2. **Class Consolidation**
   - Map all granular labels to `garbage`:
     - `litter`, `trash`, `waste`, `rubbish`, `refuse` → `garbage`
   - Remove irrelevant classes

3. **Custom Annotation** (if needed)
   - Manually annotate images from Cityscapes or other urban datasets
   - Focus on roadside garbage scenes

### 3.3 Dataset Merging in Roboflow

1. **Merge All Uploaded Datasets**
   - Go to "Versions" tab
   - Click "Create New Version"
   - Select all uploaded datasets
   - Choose merge strategy: "Combine all"

2. **Class Consolidation**
   - Ensure all classes map to 4 unified classes
   - Remove duplicate classes
   - Verify class distribution

3. **Dataset Splitting**
   - Recommended split:
     - **Train:** 70%
     - **Validation:** 15%
     - **Test:** 15%
   - Use "Stratified Split" to maintain class balance
   - Ensure each split has representation from all categories

### 3.4 Data Augmentation

**Recommended Augmentation Settings:**

1. **Basic Augmentations:**
   - **Rotation:** ±15 degrees
   - **Brightness:** ±20%
   - **Contrast:** ±20%
   - **Saturation:** ±20%
   - **Hue:** ±10%

2. **Advanced Augmentations:**
   - **Mosaic:** Enabled (helps with small objects)
   - **MixUp:** Enabled (improves generalization)
   - **Copy-Paste:** Consider for rare classes (fallen_trees, garbage)

3. **Augmentation Strategy:**
   - Apply more augmentation to underrepresented classes
   - Use "Class Balancing" feature in Roboflow
   - Monitor augmentation quality (avoid unrealistic transformations)

### 3.5 Export Dataset

1. **Export Settings:**
   - **Format:** YOLOv8 (YOLO format with segmentation)
   - **Version:** Latest version
   - **Include:** Train, Validation, Test splits

2. **Download Options:**
   - Download as ZIP
   - Or use Roboflow Python API for programmatic access

3. **Dataset Structure:**
   ```
   margwatch-road-hazards-seg/
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

## 4. Data Preprocessing Steps

### 4.1 Local Preprocessing Checklist

After downloading from Roboflow, perform these checks:

#### 4.1.1 Image Quality Checks

```python
# Example preprocessing script
import os
from PIL import Image
import yaml

def validate_images(dataset_path):
    """Validate all images in dataset"""
    issues = []
    
    for split in ['train', 'valid', 'test']:
        images_dir = os.path.join(dataset_path, split, 'images')
        
        for img_file in os.listdir(images_dir):
            img_path = os.path.join(images_dir, img_file)
            
            try:
                img = Image.open(img_path)
                
                # Check dimensions
                if img.size[0] < 100 or img.size[1] < 100:
                    issues.append(f"Small image: {img_path} - {img.size}")
                
                # Check format
                if img.format not in ['JPEG', 'PNG']:
                    issues.append(f"Unsupported format: {img_path} - {img.format}")
                
                # Check if corrupted
                img.verify()
                
            except Exception as e:
                issues.append(f"Corrupted image: {img_path} - {str(e)}")
    
    return issues
```

#### 4.1.2 Annotation Validation

```python
def validate_annotations(dataset_path):
    """Validate YOLO segmentation annotations"""
    issues = []
    
    for split in ['train', 'valid', 'test']:
        labels_dir = os.path.join(dataset_path, split, 'labels')
        images_dir = os.path.join(dataset_path, split, 'images')
        
        for label_file in os.listdir(labels_dir):
            label_path = os.path.join(labels_dir, label_file)
            img_name = label_file.replace('.txt', '.jpg')
            img_path = os.path.join(images_dir, img_name)
            
            # Check if corresponding image exists
            if not os.path.exists(img_path):
                issues.append(f"Missing image: {img_path}")
                continue
            
            # Load image to get dimensions
            img = Image.open(img_path)
            img_w, img_h = img.size
            
            # Validate annotation file
            with open(label_path, 'r') as f:
                lines = f.readlines()
                
                for line_num, line in enumerate(lines, 1):
                    parts = line.strip().split()
                    
                    if len(parts) < 2:
                        issues.append(f"Invalid line in {label_path}:{line_num}")
                        continue
                    
                    class_id = int(parts[0])
                    
                    # Check class ID (should be 0-3 for 4 classes)
                    if class_id < 0 or class_id > 3:
                        issues.append(f"Invalid class ID in {label_path}:{line_num} - {class_id}")
                    
                    # Check polygon coordinates
                    if len(parts) < 7:  # At least 3 points (6 coords) + class_id
                        issues.append(f"Insufficient points in {label_path}:{line_num}")
                    
                    # Validate coordinates are normalized (0-1)
                    coords = [float(x) for x in parts[1:]]
                    for coord in coords:
                        if coord < 0 or coord > 1:
                            issues.append(f"Invalid coordinate in {label_path}:{line_num} - {coord}")
    
    return issues
```

#### 4.1.3 Class Distribution Analysis

```python
def analyze_class_distribution(dataset_path):
    """Analyze class distribution across splits"""
    class_counts = {
        'train': {0: 0, 1: 0, 2: 0, 3: 0},  # pothole, instable, trees, garbage
        'valid': {0: 0, 1: 0, 2: 0, 3: 0},
        'test': {0: 0, 1: 0, 2: 0, 3: 0}
    }
    
    class_names = ['pothole', 'instable_cracked_road', 'fallen_trees', 'garbage']
    
    for split in ['train', 'valid', 'test']:
        labels_dir = os.path.join(dataset_path, split, 'labels')
        
        for label_file in os.listdir(labels_dir):
            label_path = os.path.join(labels_dir, label_file)
            
            with open(label_path, 'r') as f:
                for line in f:
                    class_id = int(line.strip().split()[0])
                    class_counts[split][class_id] += 1
    
    # Print distribution
    for split in ['train', 'valid', 'test']:
        print(f"\n{split.upper()} Split:")
        total = sum(class_counts[split].values())
        for class_id, count in class_counts[split].items():
            percentage = (count / total * 100) if total > 0 else 0
            print(f"  {class_names[class_id]}: {count} ({percentage:.1f}%)")
    
    return class_counts
```

### 4.2 Dataset Configuration File

Create `data.yaml` for YOLOv8 training:

```yaml
# MargWatch Road Hazards Dataset Configuration
path: /path/to/margwatch-road-hazards-seg  # dataset root dir
train: train/images  # train images (relative to 'path')
val: valid/images    # val images (relative to 'path')
test: test/images    # test images (relative to 'path')

# Classes
names:
  0: pothole
  1: instable_cracked_road
  2: fallen_trees
  3: garbage

# Number of classes
nc: 4
```

### 4.3 Preprocessing Script

Create a comprehensive preprocessing script:

```python
#!/usr/bin/env python3
"""
MargWatch Dataset Preprocessing Script
Validates and prepares dataset for YOLOv8-seg training
"""

import os
import yaml
from pathlib import Path
from PIL import Image
import shutil

def create_data_yaml(dataset_path, output_path='data.yaml'):
    """Create data.yaml configuration file"""
    config = {
        'path': str(Path(dataset_path).absolute()),
        'train': 'train/images',
        'val': 'valid/images',
        'test': 'test/images',
        'names': {
            0: 'pothole',
            1: 'instable_cracked_road',
            2: 'fallen_trees',
            3: 'garbage'
        },
        'nc': 4
    }
    
    with open(output_path, 'w') as f:
        yaml.dump(config, f, default_flow_style=False, sort_keys=False)
    
    print(f"✅ Created {output_path}")

def clean_dataset(dataset_path):
    """Remove corrupted images and orphaned annotations"""
    removed = []
    
    for split in ['train', 'valid', 'test']:
        images_dir = Path(dataset_path) / split / 'images'
        labels_dir = Path(dataset_path) / split / 'labels'
        
        # Remove images without labels
        for img_file in images_dir.glob('*'):
            label_file = labels_dir / (img_file.stem + '.txt')
            if not label_file.exists():
                img_file.unlink()
                removed.append(f"Removed orphaned image: {img_file}")
        
        # Remove labels without images
        for label_file in labels_dir.glob('*.txt'):
            img_file = images_dir / (label_file.stem + '.jpg')
            if not img_file.exists():
                # Try other extensions
                for ext in ['.png', '.jpeg', '.JPG', '.PNG']:
                    img_file = images_dir / (label_file.stem + ext)
                    if img_file.exists():
                        break
                else:
                    label_file.unlink()
                    removed.append(f"Removed orphaned label: {label_file}")
    
    return removed

def main():
    dataset_path = input("Enter dataset path: ").strip()
    
    if not os.path.exists(dataset_path):
        print(f"❌ Dataset path does not exist: {dataset_path}")
        return
    
    print("🔍 Validating dataset...")
    # Run validation functions
    # ...
    
    print("🧹 Cleaning dataset...")
    removed = clean_dataset(dataset_path)
    if removed:
        print(f"Removed {len(removed)} orphaned files")
    
    print("📝 Creating data.yaml...")
    create_data_yaml(dataset_path)
    
    print("✅ Preprocessing complete!")

if __name__ == '__main__':
    main()
```

---

## 5. Dataset Quality Assurance

### 5.1 Quality Metrics

**Target Metrics:**

1. **Class Balance:**
   - Each class should have at least 500 instances in training set
   - Class distribution should be within 2:1 ratio (no class < 33% of largest class)

2. **Annotation Quality:**
   - Polygon masks should accurately trace object boundaries
   - No overlapping polygons for same class
   - No polygons outside image boundaries

3. **Image Quality:**
   - Minimum resolution: 640x640 pixels
   - No corrupted or unreadable images
   - Diverse lighting conditions and angles

### 5.2 Quality Assurance Checklist

- [ ] All images have corresponding label files
- [ ] All label files have corresponding images
- [ ] Class IDs are correct (0-3)
- [ ] Polygon coordinates are normalized (0-1)
- [ ] No empty label files (images with no annotations)
- [ ] Train/val/test splits are balanced
- [ ] No duplicate images across splits
- [ ] Image formats are consistent (JPEG or PNG)
- [ ] Annotation polygons are closed and valid

### 5.3 Manual Review Process

1. **Sample Review:**
   - Review 50 random images from each class
   - Check annotation accuracy
   - Identify common annotation errors

2. **Edge Case Review:**
   - Review images with multiple classes
   - Review images with small objects
   - Review images with occlusions

3. **Fix Common Issues:**
   - Incorrect class labels
   - Inaccurate polygon boundaries
   - Missing annotations
   - Duplicate annotations

---

## 6. YOLOv8-seg Training Preparation

### 6.1 Environment Setup

```bash
# Create virtual environment
python -m venv yolov8_env
source yolov8_env/bin/activate  # On Windows: yolov8_env\Scripts\activate

# Install Ultralytics YOLOv8
pip install ultralytics

# Install additional dependencies
pip install opencv-python pillow numpy matplotlib seaborn
```

### 6.2 Dataset Structure Verification

Verify your dataset structure matches:

```
margwatch-road-hazards-seg/
├── data.yaml
├── train/
│   ├── images/
│   │   ├── img001.jpg
│   │   ├── img002.jpg
│   │   └── ...
│   └── labels/
│       ├── img001.txt
│       ├── img002.txt
│       └── ...
├── valid/
│   ├── images/
│   └── labels/
└── test/
    ├── images/
    └── labels/
```

### 6.3 YOLOv8 Label Format

Each label file (`.txt`) contains one line per object:

```
class_id x1 y1 x2 y2 x3 y3 ... xn yn
```

Where:
- `class_id`: 0-3 (pothole, instable_cracked_road, fallen_trees, garbage)
- `x1 y1 x2 y2 ...`: Normalized polygon coordinates (0-1)

Example:
```
0 0.5 0.3 0.6 0.3 0.6 0.5 0.5 0.5
1 0.2 0.7 0.4 0.7 0.4 0.9 0.2 0.9
```

---

## 7. Training Configuration

### 7.1 Basic Training Command

```python
from ultralytics import YOLO

# Load YOLOv8n-seg model (nano version - fastest)
model = YOLO('yolov8n-seg.pt')

# Train the model
results = model.train(
    data='data.yaml',           # Path to data.yaml
    epochs=100,                  # Number of training epochs
    imgsz=640,                   # Image size
    batch=16,                    # Batch size (adjust based on GPU memory)
    device=0,                    # GPU device (0 for first GPU, 'cpu' for CPU)
    workers=8,                   # Number of worker threads
    project='runs/segment',      # Project directory
    name='margwatch-hazards',    # Experiment name
    exist_ok=True,               # Overwrite existing experiment
)
```

### 7.2 Advanced Training Configuration

```python
from ultralytics import YOLO

model = YOLO('yolov8n-seg.pt')

results = model.train(
    # Data configuration
    data='data.yaml',
    
    # Training parameters
    epochs=200,
    imgsz=640,
    batch=16,
    device=0,
    workers=8,
    
    # Optimization
    lr0=0.01,                    # Initial learning rate
    lrf=0.01,                    # Final learning rate (lr0 * lrf)
    momentum=0.937,              # SGD momentum
    weight_decay=0.0005,         # Weight decay
    warmup_epochs=3.0,           # Warmup epochs
    warmup_momentum=0.8,         # Warmup initial momentum
    warmup_bias_lr=0.1,          # Warmup initial bias lr
    
    # Augmentation
    hsv_h=0.015,                 # Image HSV-Hue augmentation
    hsv_s=0.7,                   # Image HSV-Saturation augmentation
    hsv_v=0.4,                   # Image HSV-Value augmentation
    degrees=0.0,                 # Image rotation (+/- deg)
    translate=0.1,               # Image translation (+/- fraction)
    scale=0.5,                   # Image scale (+/- gain)
    shear=0.0,                   # Image shear (+/- deg)
    perspective=0.0,             # Image perspective (+/- fraction)
    flipud=0.0,                  # Image flip up-down (probability)
    fliplr=0.5,                  # Image flip left-right (probability)
    mosaic=1.0,                  # Image mosaic (probability)
    mixup=0.0,                   # Image mixup (probability)
    copy_paste=0.0,              # Segment copy-paste (probability)
    
    # Project settings
    project='runs/segment',
    name='margwatch-hazards-v1',
    exist_ok=True,
    
    # Validation
    val=True,                    # Validate during training
    plots=True,                  # Save plots during training
    
    # Saving
    save=True,                   # Save checkpoints
    save_period=10,              # Save checkpoint every N epochs
    save_json=False,             # Save results to JSON
    save_hybrid=False,           # Save hybrid version of labels
    
    # Other
    patience=50,                 # Early stopping patience
    resume=False,                # Resume training from last checkpoint
    amp=True,                    # Automatic Mixed Precision (AMP) training
    fraction=1.0,                # Dataset fraction to train on
    profile=False,               # Profile ONNX and TensorRT speeds
    freeze=None,                 # Freeze layers: backbone=10, first3=0 1 2
    multi_scale=False,           # Multi-scale training
    overlap_mask=True,           # Masks should overlap during training
    mask_ratio=4,                # Mask downsample ratio
    dropout=0.0,                 # Use dropout regularization
)
```

### 7.3 Training Script

Create `train_yolov8_seg.py`:

```python
#!/usr/bin/env python3
"""
YOLOv8-segmentation Training Script for MargWatch
"""

from ultralytics import YOLO
import torch
import os

def main():
    # Check GPU availability
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f"🚀 Using device: {device}")
    
    if device == 'cuda':
        print(f"   GPU: {torch.cuda.get_device_name(0)}")
        print(f"   Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")
    
    # Load model
    model_name = 'yolov8n-seg.pt'  # Start with nano, can upgrade to s/m/l/x
    print(f"📦 Loading model: {model_name}")
    model = YOLO(model_name)
    
    # Training configuration
    config = {
        'data': 'data.yaml',
        'epochs': 200,
        'imgsz': 640,
        'batch': 16 if device == 'cuda' else 8,
        'device': device,
        'workers': 8 if device == 'cuda' else 4,
        'project': 'runs/segment',
        'name': 'margwatch-hazards',
        'exist_ok': True,
        'patience': 50,
        'save_period': 10,
        'val': True,
        'plots': True,
        'amp': device == 'cuda',  # AMP only on GPU
    }
    
    print("🎯 Starting training...")
    print(f"   Configuration: {config}")
    
    # Train
    results = model.train(**config)
    
    print("✅ Training complete!")
    print(f"   Best model: {results.save_dir}/weights/best.pt")
    print(f"   Last model: {results.save_dir}/weights/last.pt")
    
    # Validate on test set
    print("\n📊 Running validation on test set...")
    metrics = model.val(data='data.yaml', split='test')
    print(f"   mAP50: {metrics.seg.map50:.4f}")
    print(f"   mAP50-95: {metrics.seg.map:.4f}")

if __name__ == '__main__':
    main()
```

### 7.4 Training Monitoring

**Key Metrics to Monitor:**

1. **Loss Metrics:**
   - `train/box_loss` - Bounding box loss
   - `train/seg_loss` - Segmentation mask loss
   - `train/cls_loss` - Classification loss
   - `train/dfl_loss` - Distribution focal loss

2. **Validation Metrics:**
   - `metrics/mAP50(B)` - Mean Average Precision at IoU=0.5 (boxes)
   - `metrics/mAP50-95(B)` - mAP at IoU=0.5:0.95 (boxes)
   - `metrics/mAP50(M)` - mAP at IoU=0.5 (masks)
   - `metrics/mAP50-95(M)` - mAP at IoU=0.5:0.95 (masks)

3. **Per-Class Metrics:**
   - Precision and recall for each class
   - Class-wise mAP scores

**Training Tips:**

- Start with `yolov8n-seg.pt` (nano) for faster iteration
- Monitor validation metrics to avoid overfitting
- Use early stopping (patience=50)
- Save checkpoints periodically
- If underfitting, try larger model (s/m/l/x) or more epochs
- If overfitting, increase augmentation or reduce model size

---

## 8. Model Integration

### 8.1 Export Trained Model

After training, export the model:

```python
from ultralytics import YOLO

# Load best model
model = YOLO('runs/segment/margwatch-hazards/weights/best.pt')

# Export to different formats
model.export(format='onnx')      # ONNX format
model.export(format='torchscript')  # TorchScript format
model.export(format='tflite')    # TensorFlow Lite format
```

### 8.2 Update ML Service

Update `services/ml-service/main.py` to use YOLOv8-seg:

```python
from ultralytics import YOLO
from fastapi import FastAPI, File, UploadFile
from PIL import Image
import io

# Load YOLOv8-seg model
model = YOLO('models/yolov8n-seg-margwatch.pt')

# Category mapping
CLASS_NAMES = ['pothole', 'instable_cracked_road', 'fallen_trees', 'garbage']
CATEGORY_MAPPING = {
    'pothole': 'POTHOLE',
    'instable_cracked_road': 'ROAD_INSTABILITY',
    'fallen_trees': 'TREE_DAMAGE',
    'garbage': 'OTHER'
}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # Read image
    image_data = await file.read()
    image = Image.open(io.BytesIO(image_data))
    
    # Run inference
    results = model(image)
    
    # Process results
    if len(results) > 0 and len(results[0].boxes) > 0:
        # Get highest confidence detection
        boxes = results[0].boxes
        masks = results[0].masks
        
        # Find highest confidence detection
        confidences = boxes.conf.cpu().numpy()
        best_idx = confidences.argmax()
        
        class_id = int(boxes.cls[best_idx])
        confidence = float(confidences[best_idx])
        mask = masks.data[best_idx] if masks is not None else None
        
        # Map to MargWatch category
        class_name = CLASS_NAMES[class_id]
        category = CATEGORY_MAPPING[class_name]
        
        return {
            'category': category,
            'confidence': confidence,
            'class_name': class_name,
            'has_mask': mask is not None,
            'model_version': 'yolov8n-seg-v1'
        }
    else:
        # No detection
        return {
            'category': 'OTHER',
            'confidence': 0.5,
            'model_version': 'yolov8n-seg-v1'
        }
```

### 8.3 Model Deployment

1. **Copy Model to ML Service:**
   ```bash
   cp runs/segment/margwatch-hazards/weights/best.pt services/ml-service/models/yolov8n-seg-margwatch.pt
   ```

2. **Update Requirements:**
   Add to `services/ml-service/requirements.txt`:
   ```
   ultralytics>=8.0.0
   ```

3. **Update Dockerfile** (if needed):
   - Ensure CUDA support if using GPU
   - Install Ultralytics package

4. **Test Integration:**
   - Start ML service
   - Test with sample images
   - Verify category predictions

---

## 9. Next Steps After Training

### 9.1 Model Evaluation

1. **Test Set Evaluation:**
   ```python
   from ultralytics import YOLO
   
   model = YOLO('runs/segment/margwatch-hazards/weights/best.pt')
   metrics = model.val(data='data.yaml', split='test')
   ```

2. **Visual Inspection:**
   - Review predictions on test images
   - Identify failure cases
   - Note common errors

3. **Per-Class Analysis:**
   - Check precision/recall for each class
   - Identify underperforming classes
   - Plan data collection for weak classes

### 9.2 Model Improvement

1. **If Model Underperforms:**
   - Collect more training data (especially weak classes)
   - Increase model size (n → s → m → l → x)
   - Adjust augmentation parameters
   - Train for more epochs

2. **If Specific Class Underperforms:**
   - Collect more data for that class
   - Review annotation quality
   - Adjust class weights
   - Use class-specific augmentation

3. **If Overfitting:**
   - Increase augmentation
   - Reduce model size
   - Add dropout
   - Use early stopping

### 9.3 Production Deployment

1. **Model Optimization:**
   - Export to ONNX for faster inference
   - Quantize model if needed
   - Optimize batch processing

2. **Monitoring:**
   - Track prediction confidence distributions
   - Monitor per-class performance
   - Collect feedback for model improvement

3. **Continuous Improvement:**
   - Collect new data from production
   - Retrain periodically
   - A/B test model versions

---

## 10. Troubleshooting

### Common Issues

1. **Out of Memory:**
   - Reduce batch size
   - Reduce image size
   - Use smaller model (nano instead of small/medium)

2. **Poor Performance:**
   - Check class balance
   - Verify annotation quality
   - Increase training epochs
   - Try larger model

3. **Training Stalls:**
   - Check learning rate
   - Verify data loading
   - Check GPU utilization

4. **Annotation Errors:**
   - Validate label format
   - Check coordinate normalization
   - Verify class IDs

---

## Appendix A: Quick Start Checklist

- [ ] Download all datasets
- [ ] Create Roboflow account and project
- [ ] Upload and merge datasets in Roboflow
- [ ] Map all classes to 4 unified categories
- [ ] Convert bounding boxes to segmentation (if needed)
- [ ] Manually annotate fallen trees dataset
- [ ] Merge all datasets in Roboflow
- [ ] Apply data augmentation
- [ ] Split dataset (70/15/15)
- [ ] Export dataset in YOLO format
- [ ] Validate dataset locally
- [ ] Create data.yaml configuration
- [ ] Set up training environment
- [ ] Train YOLOv8n-seg model
- [ ] Evaluate on test set
- [ ] Export trained model
- [ ] Integrate with ML service
- [ ] Test end-to-end pipeline

---

## Appendix B: Useful Commands

```bash
# Install YOLOv8
pip install ultralytics

# Train model
python train_yolov8_seg.py

# Validate model
yolo segment val model=runs/segment/margwatch-hazards/weights/best.pt data=data.yaml

# Predict on image
yolo segment predict model=runs/segment/margwatch-hazards/weights/best.pt source=test_image.jpg

# Export model
yolo export model=runs/segment/margwatch-hazards/weights/best.pt format=onnx
```

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Maintained By:** MargWatch Development Team

