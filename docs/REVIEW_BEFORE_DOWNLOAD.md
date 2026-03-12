# Review Checklist Before Downloading Datasets

**Purpose:** Pre-download checklist to ensure dataset quality, licensing, and annotation requirements are met before committing to download and preprocessing.

---

## 📋 Pre-Download Checklist

### 1. Class Minimums

**Target minimum instances per class:**
- **pothole**: ≥ 500 instances (well-resourced category)
- **instable_cracked_road**: ≥ 500 instances (can merge multiple crack types)
- **fallen_trees**: ≥ 200 instances (may require manual annotation)
- **garbage**: ≥ 300 instances (may require custom collection)

**Action Items:**
- [ ] Verify each dataset source has sufficient instances for target classes
- [ ] Plan to merge multiple datasets if single source is insufficient
- [ ] Document expected class distribution after merging

---

### 2. Perspective Filter

**Critical:** Ensure datasets use **ground-level perspective** (not aerial/satellite).

**Check:**
- [ ] Images are captured from vehicle-mounted or handheld cameras
- [ ] Images show road surface from driver/pedestrian perspective
- [ ] No aerial, drone, or satellite imagery
- [ ] Consistent camera angles across dataset

**Why:** Aerial perspectives have different scale, lighting, and object appearance, which will hurt model performance on ground-level test images.

---

### 3. License Requirements

**Required:** Permissive licenses for commercial use.

**Acceptable Licenses:**
- ✅ MIT
- ✅ Apache-2.0
- ✅ CC-BY-4.0 (with attribution)
- ✅ BSD-3-Clause
- ✅ Unlicense / Public Domain

**Requires Review:**
- ⚠️ GPL-3.0 (copyleft restrictions)
- ⚠️ CC-BY-SA-4.0 (share-alike restrictions)
- ⚠️ Custom licenses (review terms)

**Action Items:**
- [ ] Run `check_manifest_and_license.py` on all dataset sources
- [ ] Review `license_warnings.txt` for any non-permissive licenses
- [ ] Document attribution requirements for CC-BY-4.0 datasets
- [ ] Verify commercial use is permitted

**Command:**
```bash
python services/ml-service/check_manifest_and_license.py \
    --sources dataset1_path dataset2_url \
    --output-csv dataset_manifest.csv \
    --output-warnings license_warnings.txt
```

---

### 4. Annotation Tasks

### 4.1 Polygon Conversion Required

**Fallen Trees Dataset:**
- **Source:** "Fallen Trees On Road" object detection dataset (234 images)
- **Task:** Convert bounding boxes to instance segmentation polygons
- **Estimated Time:** ~2-3 hours (manual tracing)
- **Tool:** Roboflow annotation interface
- **Process:**
  1. Upload dataset to Roboflow
  2. For each image, convert bbox to polygon
  3. Trace tree outline following bbox as guide
  4. Label as `fallen_trees`

**Action Items:**
- [ ] Allocate time for manual annotation (estimate: 2-3 hours for 234 images)
- [ ] Set up Roboflow project with instance segmentation enabled
- [ ] Create annotation guidelines (e.g., include branches, exclude background)

### 4.2 Class Remapping Required

**Datasets with Multiple Classes:**
- **EGY_PDD:** Map 10 damage types to 2 categories (pothole, instable_cracked_road)
- **RDD2022:** Map crack types (D00, D10, D20) to instable_cracked_road
- **Pothole Mix:** Separate pothole and crack classes

**Action Items:**
- [ ] Create remapping JSON file (see example below)
- [ ] Document mapping decisions
- [ ] Run remapping during preprocessing

**Remapping Example:**
```json
{
  "0": 0,  // pothole -> pothole
  "1": 1,  // longitudinal_crack -> instable_cracked_road
  "2": 1,  // transverse_crack -> instable_cracked_road
  "3": 1   // alligator_crack -> instable_cracked_road
}
```

### 4.3 Format Conversion Required

**Bounding Box to Segmentation:**
- **RDD2022:** Convert bboxes to polygons (semi-automated)
- **Outdoor Hazard Detection:** Convert bboxes to polygons

**Action Items:**
- [ ] Use Roboflow auto-convert feature
- [ ] Manually refine polygons for accuracy
- [ ] Validate converted annotations

---

### 5. Recommended Augmentations Per-Class

**General Augmentations:**
- Rotation: ±15 degrees
- Brightness: ±20%
- Contrast: ±20%
- Saturation: ±20%
- Mosaic: Enabled
- MixUp: Enabled

**Class-Specific Considerations:**

**pothole:**
- ✅ Rotation (potholes appear from various angles)
- ✅ Brightness variation (different lighting conditions)
- ⚠️ Avoid excessive rotation (maintain road surface orientation)

**instable_cracked_road:**
- ✅ Rotation (cracks can be at any angle)
- ✅ Contrast enhancement (helps highlight fine cracks)
- ✅ Mosaic (combines multiple crack patterns)

**fallen_trees:**
- ✅ Rotation (trees fall in various orientations)
- ✅ Copy-Paste augmentation (increases rare class instances)
- ⚠️ Maintain realistic scale (trees shouldn't be too large/small)

**garbage:**
- ✅ Rotation (litter appears at various angles)
- ✅ Brightness variation (different times of day)
- ✅ Copy-Paste augmentation (increases rare class instances)

**Action Items:**
- [ ] Configure Roboflow augmentation settings per-class
- [ ] Test augmentation on sample images
- [ ] Monitor augmented image quality

---

### 6. Stratified Split Instructions

**Goal:** Ensure balanced class distribution across train/val/test splits.

**Recommended Split:**
- **Train:** 70%
- **Validation:** 15%
- **Test:** 15%

**Stratification Strategy:**
- Group images by class distribution signature
- Ensure each split has representation from all classes
- Maintain similar class ratios across splits

**Command:**
```bash
python services/ml-service/preprocess_dataset.py dataset_path \
    --stratify \
    --output stratified_dataset \
    --dry-run  # Review first, then remove --dry-run
```

**Action Items:**
- [ ] Review stratified split statistics
- [ ] Verify class balance across splits
- [ ] Adjust ratios if needed (e.g., if test set too small)

---

### 7. Smoke-Test Commands

**Purpose:** Validate preprocessing pipeline before processing full dataset.

### 7.1 Create Smoke Sample

```bash
python services/ml-service/preprocess_dataset.py \
    --create-smoke-sample smoke_dataset \
    --dry-run \
    --output preprocess_dryrun_log.txt
```

**Expected Output:**
- `smoke_dataset/` directory with 4 images (one per class)
- `preprocess_report.json` with validation results
- `preprocess_dryrun_log.txt` with full log

### 7.2 Validate Smoke Sample

```bash
python services/ml-service/preprocess_dataset.py smoke_dataset \
    --all \
    --min-res 640 \
    --dry-run \
    --report smoke_preprocess_report.json
```

**Check:**
- [ ] No validation errors
- [ ] All 4 classes present
- [ ] Images meet minimum resolution
- [ ] Annotations are valid

### 7.3 Smoke Training Run

```bash
python services/ml-service/train_yolov8_seg.py \
    --data-yaml smoke_dataset/data.yaml \
    --smoke-run \
    --epochs 5 \
    --seed 42 \
    --name smoke-test
```

**Expected:**
- Training completes without errors
- Model saves successfully
- Validation runs on test set
- Per-class metrics computed

**Action Items:**
- [ ] Run smoke tests before processing full dataset
- [ ] Fix any issues found in smoke tests
- [ ] Document smoke test results

---

## 📊 Dataset Source Summary

### Recommended Datasets by Category

#### Category 1: Pothole
1. **Pothole Mix** (4,340 images, CC BY 4.0)
   - ✅ Segmentation masks ready
   - ✅ Multiple sources merged
   - ⚠️ Contains both pothole and crack classes (separate during merge)

2. **RoadDefects-ISeg** (1,000 images, CC BY 4.0)
   - ✅ YOLO format ready
   - ✅ Instance segmentation
   - ✅ Includes pothole class

3. **EGY_PDD** (14,612 images, check license)
   - ✅ YOLO format ready
   - ✅ Includes pothole class
   - ⚠️ Extract pothole class only

#### Category 2: Instable/Cracked Road
1. **EGY_PDD** - Extract crack classes:
   - Longitudinal cracks
   - Transverse cracks
   - Alligator cracks
   - Block cracks
   - Rutting
   - Bumps and sags

2. **Cracks and Potholes in Road** (2,235 images, CC BY 4.0)
   - ✅ Segmentation masks
   - ✅ Extract crack class only

3. **RDD2022** (47,420 images, check license)
   - ⚠️ Bounding boxes (convert to segmentation)
   - ✅ Multiple crack types (D00, D10, D20)

#### Category 3: Fallen Trees
1. **"Fallen Trees On Road"** (234 images)
   - ⚠️ Bounding boxes (manual conversion required)
   - ✅ Ground-level perspective
   - **Action:** Convert bboxes to polygons in Roboflow

2. **RescueNet** (check availability)
   - ✅ Segmentation masks
   - ⚠️ May include aerial imagery (filter)

#### Category 4: Garbage
1. **TACO Dataset** (check availability)
   - ✅ COCO format
   - ✅ Trash/litter annotations
   - ⚠️ May need class remapping

2. **Custom Collection** (may be required)
   - Collect roadside garbage images
   - Annotate manually

---

## 🔧 Preprocessing Workflow

### Step 1: License Check
```bash
python services/ml-service/check_manifest_and_license.py \
    --sources dataset1 dataset2 dataset3 \
    --output-csv dataset_manifest.csv \
    --output-warnings license_warnings.txt
```

### Step 2: Smoke Test
```bash
# Create smoke sample
python services/ml-service/preprocess_dataset.py \
    --create-smoke-sample smoke_dataset

# Validate smoke sample
python services/ml-service/preprocess_dataset.py smoke_dataset --all --dry-run

# Train smoke test
python services/ml-service/train_yolov8_seg.py \
    --data-yaml smoke_dataset/data.yaml \
    --smoke-run --epochs 5
```

### Step 3: Full Preprocessing
```bash
# Full validation and preprocessing
python services/ml-service/preprocess_dataset.py full_dataset_path \
    --all \
    --min-res 640 \
    --remap remapping.json \
    --stratify \
    --output stratified_dataset \
    --report preprocess_report.json
```

### Step 4: Training
```bash
python services/ml-service/train_yolov8_seg.py \
    --data-yaml stratified_dataset/data.yaml \
    --epochs 200 \
    --seed 42 \
    --export onnx torchscript \
    --monitor-classes
```

---

## ⚠️ Common Issues and Solutions

### Issue: Class Imbalance
**Solution:** Use stratified splits and class-specific augmentation

### Issue: Missing Annotations
**Solution:** Run `--clean` to remove orphaned files, then manually annotate missing images

### Issue: License Conflicts
**Solution:** Review `license_warnings.txt`, contact dataset authors if needed

### Issue: Format Incompatibility
**Solution:** Use Roboflow format conversion or custom conversion scripts

### Issue: Perspective Mismatch
**Solution:** Filter out aerial imagery, only use ground-level images

---

## 📝 Manual Follow-Ups Required

After reviewing this checklist, document:

1. **Annotation Tasks:**
   - [ ] Fallen trees: Convert 234 bboxes to polygons (estimate: 2-3 hours)
   - [ ] Garbage: Collect and annotate X images (if needed)
   - [ ] Any other manual annotation required

2. **License Compliance:**
   - [ ] All datasets have acceptable licenses
   - [ ] Attribution requirements documented
   - [ ] Commercial use confirmed

3. **Class Remapping:**
   - [ ] Remapping JSON file created
   - [ ] Mapping decisions documented
   - [ ] Tested on sample data

4. **Quality Assurance:**
   - [ ] Smoke tests passed
   - [ ] Preprocessing pipeline validated
   - [ ] Ready for full dataset processing

---

## ✅ Final Checklist

Before downloading datasets:

- [ ] All class minimums verified
- [ ] Perspective filter confirmed (ground-level only)
- [ ] Licenses checked and acceptable
- [ ] Annotation tasks identified and estimated
- [ ] Augmentation strategy planned
- [ ] Stratified split strategy defined
- [ ] Smoke tests ready to run
- [ ] Manual follow-ups documented

---

**Last Updated:** January 2025  
**Next Review:** After first dataset download

