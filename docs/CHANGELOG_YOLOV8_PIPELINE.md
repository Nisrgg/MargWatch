# Changelog: YOLOv8 Training Pipeline Enhancements

**Date:** January 2025  
**Purpose:** Robust training pipeline with pre-download checks, reproducible training, per-class monitoring, and clear human-action items.

---

## Summary of Changes

### 1. Enhanced `preprocess_dataset.py`

#### CLI Improvements
- ✅ Fixed `--dry-run` default to `False` (was `True`)
- ✅ Added `--no-dry-run` flag to explicitly disable dry-run
- ✅ Added `--sample N` flag for sampling N images during validation
- ✅ Added `--min-res` flag (default: 640) for minimum image resolution enforcement

#### Data YAML Generation
- ✅ Fixed `names` to be written as ordered list (not dict)
- ✅ Fixed `nc` to correctly reflect number of classes (4)

#### Image Validation
- ✅ Replaced `img.verify()` with `img.load()` for proper corruption detection
- ✅ Enforced minimum resolution check (`--min-res`, default 640x640)
- ✅ Added RGBA/LA/P mode to RGB conversion with white background
- ✅ Validated 3-channel RGB requirement

#### Annotation Validation
- ✅ Added support for YOLOv8 mask format (polygon coordinates)
- ✅ Added support for COCO polygon format (with conversion)
- ✅ Polygon validation:
  - Minimum 3 points required
  - Area > epsilon check
  - Bounding box fits inside image
  - Self-intersection check (if shapely available)

#### Duplicate Detection
- ✅ SHA1 hash for exact file duplicates
- ✅ Perceptual hash (pHash) for near-duplicates (if imagehash available)
- ✅ Outputs `duplicates.csv` with groups and recommendations

#### Label Remapping
- ✅ Deterministic label remapping routine
- ✅ Verifies every label is in mapping
- ✅ Outputs `remap_report.json` with statistics

#### Stratified Splits
- ✅ Added `--stratify` option for stratified splits
- ✅ Splits based on per-image instance counts per class
- ✅ Outputs counts per split and per-class instance counts

#### Dry-Run Behavior
- ✅ When `--dry-run=True`, no files deleted/changed
- ✅ Generates full `preprocess_report.json` with all statistics

#### Smoke Sample Generation
- ✅ Added `--create-smoke-sample` flag
- ✅ Generates tiny toy dataset (one image per class + simple polygon masks)
- ✅ Useful for local testing and validation

---

### 2. Enhanced `train_yolov8_seg.py`

#### Smoke Run Mode
- ✅ Added `--smoke-run` flag for quick sanity training
- ✅ Uses fraction of data (10%) and fewer epochs (max 5)
- ✅ Faster iteration for testing pipeline

#### Reproducibility
- ✅ Added `--seed` CLI flag for random seed setting
- ✅ Sets deterministic cudnn flags (`cudnn.deterministic = True`)
- ✅ Sets `cudnn.benchmark = False`
- ✅ Sets PyTorch deterministic algorithms
- ✅ Logs seed value for tracking

#### Per-Class Metrics
- ✅ Computes per-class mask mAP, precision, recall after validation
- ✅ Writes `validation_report.json` with detailed metrics
- ✅ Extracts metrics from Ultralytics results_dict

#### Model Export
- ✅ Added `--export` argument (supports: onnx, torchscript, tflite)
- ✅ Exports best model to specified formats at end of training
- ✅ Default: ONNX export

#### Class Failure Monitoring
- ✅ Added `--monitor-classes` flag
- ✅ Generates `class_failures.csv` with FN & FP examples
- ✅ Identifies images where classes failed (false negatives/positives)
- ✅ Includes confidence scores for false positives

---

### 3. New Utility: `check_manifest_and_license.py`

#### Features
- ✅ Processes dataset sources (local paths or URLs)
- ✅ Generates `dataset_manifest.csv` with:
  - Source name, URL, dataset name
  - File count, classes present
  - License information
  - License confidence (found/unknown)
  - Notes
- ✅ Generates `license_warnings.txt` for:
  - Non-permissive licenses
  - Unknown licenses
  - License conflicts

#### Supported Sources
- ✅ Local datasets (checks LICENSE files)
- ✅ Kaggle datasets (attempts API access)
- ✅ GitHub repositories (uses GitHub API)
- ✅ Generic URLs (marks as unknown)

#### License Detection
- ✅ Pattern matching for common licenses (MIT, Apache, CC-BY, etc.)
- ✅ Checks LICENSE, LICENSE.txt, LICENSE.md files
- ✅ Checks README for license information
- ✅ Categorizes as permissive/non-permissive/unknown

---

### 4. New Documentation: `docs/REVIEW_BEFORE_DOWNLOAD.md`

#### Contents
- ✅ Pre-download checklist:
  - Class minimums (suggested instances per class)
  - Perspective filter (ground vs aerial)
  - License requirements
  - Annotation tasks (polygon conversions, estimated counts)
  - Recommended augmentations per-class
  - Stratified split instructions
- ✅ Smoke-test commands with exact syntax
- ✅ Dataset source summary by category
- ✅ Preprocessing workflow steps
- ✅ Common issues and solutions
- ✅ Manual follow-ups checklist

---

### 5. Smoke Sample Test Results

#### Generated Files
- ✅ `preprocess_dryrun_log.txt` - Full dry-run log output
- ✅ `preprocess_report.json` - JSON report with statistics

#### Test Results
- ✅ Smoke sample created successfully (4 images, one per class)
- ✅ All validations passed (images, annotations, class distribution)
- ✅ No duplicates detected
- ✅ Ready for smoke training run

---

## Technical Assumptions Documented

### Preprocessing Assumptions
1. **Class Mapping:** Source class IDs are mapped deterministically to target classes (0-3)
2. **Polygon Validation:** Polygons must have ≥3 points and area > epsilon
3. **Image Format:** All images converted to 3-channel RGB (RGBA uses white background)
4. **Coordinate Normalization:** YOLO format uses normalized coordinates [0, 1]

### Training Assumptions
1. **Reproducibility:** Setting seed for Python, NumPy, PyTorch ensures deterministic behavior
2. **Per-Class Metrics:** Ultralytics provides per-class metrics in results_dict
3. **Failure Detection:** Comparing predictions with ground truth identifies FN/FP

### License Checking Assumptions
1. **License Files:** Common locations (LICENSE, LICENSE.txt, LICENSE.md)
2. **Pattern Matching:** License text contains recognizable patterns
3. **GitHub API:** GitHub API provides license information for repositories

---

## Manual Follow-Ups Required

### Annotation Tasks
1. **Fallen Trees Dataset:**
   - Convert 234 bounding boxes to polygons
   - Estimated time: 2-3 hours
   - Tool: Roboflow annotation interface
   - Process: Manual tracing following bbox guides

2. **Garbage Dataset:**
   - May require custom data collection
   - Manual annotation of roadside garbage images
   - Estimated: TBD based on dataset availability

### License Compliance
1. **Review `license_warnings.txt`:**
   - Check for any non-permissive licenses
   - Verify commercial use permissions
   - Document attribution requirements

2. **Dataset Attribution:**
   - Document CC-BY-4.0 attribution requirements
   - Include in project documentation

### Class Remapping
1. **Create Remapping JSON:**
   - Map EGY_PDD classes to unified scheme
   - Map RDD2022 classes to unified scheme
   - Test on sample data before full processing

---

## Files Modified/Created

### Modified Files
- `services/ml-service/preprocess_dataset.py` (391 → ~900 lines)
- `services/ml-service/train_yolov8_seg.py` (255 → ~450 lines)

### New Files
- `services/ml-service/check_manifest_and_license.py` (~400 lines)
- `docs/REVIEW_BEFORE_DOWNLOAD.md` (~500 lines)
- `services/ml-service/preprocess_dryrun_log.txt` (dry-run output)
- `services/ml-service/preprocess_report.json` (sample report)
- `docs/CHANGELOG_YOLOV8_PIPELINE.md` (this file)

---

## Dependencies Added

### Required
- `pyyaml` - YAML parsing for data.yaml
- `numpy` - Numerical operations

### Optional (for enhanced features)
- `imagehash` - Perceptual hashing for near-duplicate detection
- `shapely` - Polygon validation (self-intersection checks)

### Installation
```bash
pip install pyyaml imagehash shapely
```

---

## Testing Checklist

- [x] Smoke sample generation works
- [x] Dry-run mode generates report without modifying files
- [x] Image validation enforces minimum resolution
- [x] Annotation validation supports YOLO and COCO formats
- [x] Class distribution analysis works
- [x] No linting errors
- [ ] Full dataset preprocessing (pending dataset download)
- [ ] Smoke training run (pending dependencies)
- [ ] License checking on real datasets (pending sources)

---

## Next Steps

1. **Install Dependencies:**
   ```bash
   pip install pyyaml imagehash shapely ultralytics
   ```

2. **Run Smoke Tests:**
   ```bash
   python services/ml-service/preprocess_dataset.py --create-smoke-sample smoke_dataset
   python services/ml-service/preprocess_dataset.py smoke_dataset --all --dry-run
   python services/ml-service/train_yolov8_seg.py --data-yaml smoke_dataset/data.yaml --smoke-run
   ```

3. **Download Datasets:**
   - Follow `docs/REVIEW_BEFORE_DOWNLOAD.md` checklist
   - Run license checks on all sources
   - Verify class minimums

4. **Process Full Dataset:**
   - Run preprocessing with all enhancements
   - Create stratified splits
   - Train model with reproducibility enabled

---

**Status:** ✅ All enhancements implemented and documented  
**Ready for:** Dataset download and full preprocessing pipeline

