# Road Hazard Datasets Research for YOLOv8-Segmentation

**Research Date:** January 2025  
**Purpose:** Identify comprehensive image datasets suitable for training YOLOv8-seg models to detect five categories of road hazards:
1. Road potholes and cracks
2. Road instability, subsidence, or landslide impacts
3. Fallen trees or storm debris
4. Streetlight damage or utility pole issues
5. Roadside garbage, litter, or urban waste

---

## Executive Summary

This research identifies multiple datasets across public repositories, academic sources, and specialized collections. **No single dataset covers all five categories**, necessitating a multi-dataset merging strategy. The most comprehensive coverage exists for **potholes and cracks**, while **streetlight/utility pole** and **roadside garbage** categories have limited dedicated datasets.

---

## 1. Comprehensive Road Hazard Datasets

### 1.1 R²S100K Dataset
- **Description:** Large-scale road-region segmentation dataset with 100,000 diverse road images covering 1,000+ kilometers
- **Classes:** Road regions, distress, potholes, wet surfaces, gravel, unstructured roads
- **Annotations:** Pixel-level semantic segmentation masks
- **Format:** Not specified (likely COCO or custom)
- **Size:** 100,000 images (14,000 finely annotated)
- **License:** Research use (check publication)
- **Source:** [Springer Link](https://link.springer.com/article/10.1007/s11263-024-02207-3)
- **Suitability:** Excellent for road instability and general road conditions; may require label mapping

### 1.2 Road Damage Dataset (RDD2022)
- **Description:** Comprehensive collection from six countries (including China) with extensive road damage annotations
- **Classes:** 
  - D00: Longitudinal cracks
  - D10: Transverse cracks
  - D20: Alligator cracks
  - D40: Potholes
  - D43: Rutting
  - D44: Bumps/sags
  - Repairs
- **Annotations:** Bounding boxes (requires conversion to segmentation)
- **Format:** Not specified
- **Size:** 47,420 images with 55,000+ annotated instances
- **License:** Check publication/website
- **Source:** [arXiv](https://arxiv.org/abs/2209.08538)
- **Suitability:** Excellent for potholes/cracks; may include subsidence-related damage (rutting, bumps)

### 1.3 IDD-AW (Indian Driving Dataset - Adverse Weather)
- **Description:** High-quality images captured under adverse weather conditions in unstructured traffic environments
- **Classes:** Comprehensive 4-level label hierarchy covering various road conditions and obstacles
- **Annotations:** Pixel-level semantic segmentation masks
- **Format:** Not specified
- **Size:** 5,000 image pairs
- **License:** Check dataset website
- **Source:** [arXiv](https://arxiv.org/abs/2311.14459), [GitHub](http://iddaw.github.io)
- **Suitability:** Good for fallen trees/debris (adverse weather scenarios), general road hazards

---

## 2. Category-Specific Datasets

### 2.1 Road Potholes and Cracks

#### 2.1.1 Pothole Mix Dataset
- **Description:** Assembled from five publicly available datasets, focused on semantic segmentation
- **Classes:** Potholes, cracks
- **Annotations:** Semantic segmentation masks
- **Format:** Image-mask pairs
- **Size:** 4,340 image-mask pairs
  - Training: 3,340
  - Validation: 496
  - Test: 504
- **License:** CC BY 4.0
- **Source:** [Mendeley Data](https://data.mendeley.com/datasets/kfth5g2xk3)
- **Additional:** Includes RGB-D video clips for depth-aware models
- **Suitability:** ⭐⭐⭐⭐⭐ Excellent, ready for segmentation

#### 2.1.2 Cracks and Potholes in Road Images Dataset
- **Description:** Developed using images from Brazilian highways
- **Classes:** Road, cracks, potholes
- **Annotations:** Pixel-level semantic segmentation masks (three masks per image)
- **Format:** Images with corresponding masks
- **Size:** 2,235 images with 4,720 labeled objects
- **License:** CC BY 4.0
- **Source:** [Dataset Website](https://biankatpas.github.io/Cracks-and-Potholes-in-Road-Images-Dataset/), [Dataset Ninja](https://datasetninja.com/cracks-and-potholes-in-road)
- **Suitability:** ⭐⭐⭐⭐⭐ Excellent, pixel-level annotations

#### 2.1.3 RoadDefects-ISeg
- **Description:** Instance segmentation dataset for road surface defects
- **Classes:** Cracks, lanes, potholes, speed breakers
- **Annotations:** Instance segmentation labels
- **Format:** YOLO format (ready for YOLOv8)
- **Size:** 1,000 images
- **License:** CC BY 4.0
- **Source:** [Zenodo](https://zenodo.org/records/17194814)
- **Suitability:** ⭐⭐⭐⭐⭐ Excellent, already in YOLO format

#### 2.1.4 EGY_PDD Dataset
- **Description:** Collected in Port Said, Egypt, comprehensive road damage dataset
- **Classes:** 10 damage types:
  - Rutting
  - Reflective and transverse cracks
  - Block cracks
  - Longitudinal cracks
  - Alligator cracks
  - Patching
  - Potholes
  - Bleeding
  - Corrugation
  - Raveling and weathering
  - Bumps and sags
- **Annotations:** Instance annotations
- **Format:** YOLO format
- **Size:** 14,612 images with 19,528 annotated instances
- **Image Resolution:** 320×320 to 1280×1280 pixels
- **License:** Check publication
- **Source:** [Springer Link](https://link.springer.com/article/10.1007/s11554-025-01683-1)
- **Suitability:** ⭐⭐⭐⭐⭐ Excellent, YOLO format, includes subsidence-related (rutting, bumps)

#### 2.1.5 Road Damage Detection Dataset (Innovatiana)
- **Description:** Annotated images for predictive maintenance AI systems
- **Classes:** Potholes, cracks, sewer plates/manholes
- **Annotations:** Bounding boxes
- **Format:** COCO format (JPG images with JSON annotations)
- **Size:** 4,018 images
- **License:** MIT
- **Source:** [Innovatiana](https://www.innovatiana.com/en/datasets/road-damage-detection-dataset)
- **Suitability:** ⭐⭐⭐⭐ Good, requires conversion to segmentation

#### 2.1.6 T-CRACK and C-CRACK Datasets
- **Description:** Tiny crack detection across various surfaces (bituminous and cement roads)
- **Classes:** Cracks (various types)
- **Annotations:** Segmentation annotations
- **Format:** Not specified
- **Size:** Not specified
- **License:** Check GitHub repository
- **Source:** [GitHub](https://github.com/lartpang/awesome-segmentation-saliency-dataset)
- **Suitability:** ⭐⭐⭐⭐ Good for fine crack detection

#### 2.1.7 SHREC 2022 Dataset
- **Description:** Pothole and crack detection with RGB-D data
- **Classes:** Potholes, cracks
- **Annotations:** Segmentation masks
- **Format:** Not specified
- **Size:** 3,836 image/mask pairs, 797 RGB-D video clips
- **License:** Check publication
- **Source:** [arXiv](https://arxiv.org/abs/2205.13326)
- **Suitability:** ⭐⭐⭐⭐ Good, includes depth information

#### 2.1.8 Crack Segmentation Dataset (Ultralytics)
- **Description:** Focused on crack detection
- **Classes:** Cracks
- **Annotations:** Segmentation annotations
- **Format:** Compatible with YOLOv8
- **Size:** 4,029 images
- **License:** Check Ultralytics documentation
- **Source:** [Ultralytics Docs](https://docs.ultralytics.com/datasets/segment/crack-seg/)
- **Suitability:** ⭐⭐⭐⭐⭐ Excellent, YOLOv8-compatible

### 2.2 Road Instability, Subsidence, Landslide

#### 2.2.1 R²S100K Dataset
- **Coverage:** Includes unstructured roads, distress types, various road conditions
- **Suitability:** ⭐⭐⭐⭐ Good for general road instability

#### 2.2.2 EGY_PDD Dataset
- **Coverage:** Includes rutting, bumps, and sags (indicative of subsidence)
- **Suitability:** ⭐⭐⭐⭐ Good for subsidence-related damage

#### 2.2.3 IDD-AW Dataset
- **Coverage:** Adverse weather conditions may include road instability scenarios
- **Suitability:** ⭐⭐⭐ Moderate, indirect coverage

**Note:** Dedicated datasets for landslides/subsidence are scarce. Consider:
- Custom data collection
- Collaboration with geotechnical research institutions
- Extracting relevant images from disaster response datasets

### 2.3 Fallen Trees and Storm Debris

#### 2.3.1 RescueNet Dataset
- **Description:** High-resolution UAV semantic segmentation benchmark for natural disaster damage assessment
- **Classes:** Buildings, roads, pools, trees, debris, obstructed areas
- **Annotations:** Pixel-level semantic segmentation
- **Format:** Not specified
- **Size:** Not specified (check publication)
- **License:** Check publication
- **Source:** [arXiv](https://arxiv.org/abs/2202.12361)
- **Suitability:** ⭐⭐⭐⭐ Good for post-disaster debris

#### 2.3.2 DRespNeT Dataset
- **Description:** Post-earthquake search-and-rescue missions dataset
- **Classes:** 28 classes including debris levels, obstructed areas
- **Annotations:** Detailed annotations
- **Format:** Not specified
- **Size:** Not specified
- **License:** Check publication
- **Source:** [arXiv](https://arxiv.org/abs/2508.16016)
- **Suitability:** ⭐⭐⭐⭐ Good for disaster debris

#### 2.3.3 IDD-AW Dataset
- **Coverage:** Adverse weather conditions may include fallen trees/debris
- **Suitability:** ⭐⭐⭐ Moderate

#### 2.3.4 Cityscapes Dataset
- **Description:** Urban scene understanding dataset
- **Classes:** 30 classes including various objects and obstacles
- **Annotations:** Fine-grained pixel-level annotations
- **Format:** COCO format
- **Size:** Large-scale (check website)
- **License:** Non-commercial use
- **Source:** [Cityscapes Website](https://www.cityscapes-dataset.com/)
- **Suitability:** ⭐⭐⭐ Moderate, may contain relevant scenes

**Note:** Dedicated datasets for fallen trees/storm debris are limited. Consider disaster response archives and custom annotation of relevant images.

### 2.4 Streetlight Damage and Utility Pole Inspection

#### 2.4.1 Outdoor Hazard Detection Dataset
- **Description:** Comprehensive outdoor hazard detection
- **Classes:** 11 classes including bumps, weeds, vehicles, columns, walls, dents, traffic signs, traffic cones, fences
- **Annotations:** Bounding boxes
- **Format:** Not specified
- **Size:** 20,380 images with 394,100 labeled objects
- **License:** Check Dataset Ninja
- **Source:** [Dataset Ninja](https://datasetninja.com/outdoor-hazard-detection)
- **Suitability:** ⭐⭐ Limited, may include utility poles but not specifically streetlights

#### 2.4.2 Mapillary Vistas Dataset
- **Description:** Large-scale street-level imagery dataset
- **Classes:** Comprehensive urban object classes
- **Annotations:** Pixel-level segmentation
- **Format:** COCO format
- **Size:** Large-scale
- **License:** Check Mapillary website
- **Source:** [Mapillary Vistas](https://www.mapillary.com/dataset/vistas)
- **Suitability:** ⭐⭐⭐ Moderate, may contain streetlights/poles but not damage-specific

**Note:** **No dedicated datasets found** for streetlight damage or utility pole inspection. Recommendations:
- Custom data collection with municipal/utility partnerships
- Manual annotation of relevant images from urban scene datasets
- Collaboration with utility companies for proprietary datasets

### 2.5 Roadside Garbage, Litter, Urban Waste

#### 2.5.1 TACO (Trash Annotation in Context) Dataset
- **Description:** Trash annotation dataset (if available)
- **Classes:** Various trash/litter categories
- **Annotations:** COCO format annotations
- **Format:** COCO format
- **Size:** Check TACO website
- **License:** Check TACO website
- **Source:** TACO Dataset (verify availability)
- **Suitability:** ⭐⭐⭐⭐ Good if available

#### 2.5.2 Cityscapes Dataset
- **Coverage:** Urban scenes may contain litter/garbage
- **Suitability:** ⭐⭐ Limited, not specifically annotated for garbage

#### 2.5.3 Outdoor Hazard Detection Dataset
- **Coverage:** May include some waste-related hazards
- **Suitability:** ⭐⭐ Limited

**Note:** Dedicated datasets for roadside garbage are **very limited**. Recommendations:
- Custom data collection
- Manual annotation of urban scene datasets
- Collaboration with environmental agencies
- Citizen science projects focused on urban cleanliness

---

## 3. Public Dataset Repositories

### 3.1 Kaggle
- **Search Keywords:** "road damage", "pothole detection", "crack segmentation", "road hazard"
- **Notable Datasets:** Various road damage datasets (verify availability and formats)
- **Access:** [Kaggle Datasets](https://www.kaggle.com/datasets)

### 3.2 Roboflow Universe
- **Description:** Repository of computer vision datasets with format conversion tools
- **Features:** 
  - Pre-converted datasets in YOLO format
  - Format conversion tools (COCO ↔ YOLO ↔ Pascal VOC)
  - Dataset augmentation capabilities
- **Access:** [Roboflow Universe](https://universe.roboflow.com/)
- **Utility:** ⭐⭐⭐⭐⭐ Excellent for format conversion and dataset management

### 3.3 Papers with Code
- **Description:** Links academic papers with associated code and datasets
- **Search Keywords:** "road maintenance", "smart city", "autonomous driving", "road damage detection"
- **Access:** [Papers with Code](https://paperswithcode.com/)
- **Utility:** ⭐⭐⭐⭐ Good for finding academic datasets

### 3.4 Google Dataset Search
- **Description:** Search engine for datasets across the web
- **Search Keywords:** "road hazard", "infrastructure damage", "segmentation", "road maintenance"
- **Access:** [Google Dataset Search](https://datasetsearch.research.google.com/)
- **Utility:** ⭐⭐⭐⭐ Good for discovering datasets

### 3.5 Dataset Ninja
- **Description:** Curated dataset repository with detailed specifications
- **Access:** [Dataset Ninja](https://datasetninja.com/)
- **Utility:** ⭐⭐⭐⭐ Good for dataset discovery and specifications

### 3.6 Zenodo
- **Description:** Open-access repository for research datasets
- **Access:** [Zenodo](https://zenodo.org/)
- **Utility:** ⭐⭐⭐⭐ Good for academic datasets

### 3.7 Mendeley Data
- **Description:** Research data repository
- **Access:** [Mendeley Data](https://data.mendeley.com/)
- **Utility:** ⭐⭐⭐⭐ Good for academic datasets

---

## 4. Dataset Specifications Summary

### 4.1 Annotation Types

| Dataset | Annotation Type | Conversion Needed for YOLOv8-seg |
|---------|----------------|----------------------------------|
| Pothole Mix | Semantic segmentation masks | ✅ Ready |
| Cracks and Potholes in Road | Pixel-level semantic masks | ✅ Ready |
| RoadDefects-ISeg | Instance segmentation (YOLO) | ✅ Ready |
| EGY_PDD | Instance annotations (YOLO) | ✅ Ready |
| RDD2022 | Bounding boxes | ⚠️ Convert to segmentation |
| Road Damage Detection (Innovatiana) | Bounding boxes (COCO) | ⚠️ Convert to segmentation |
| IDD-AW | Semantic segmentation masks | ✅ Ready |
| RescueNet | Pixel-level semantic masks | ✅ Ready |
| Outdoor Hazard Detection | Bounding boxes | ⚠️ Convert to segmentation |

### 4.2 Dataset Formats

| Format | YOLOv8-seg Compatibility | Conversion Tools |
|--------|-------------------------|------------------|
| YOLO Format | ✅ Native support | N/A |
| COCO Format | ✅ Supported | Roboflow, pycocotools |
| Pascal VOC | ⚠️ Requires conversion | Roboflow, labelme |
| Semantic Masks | ⚠️ Requires conversion | Custom scripts |
| Bounding Boxes | ❌ Must convert to segmentation | LabelMe, VIA, custom tools |

### 4.3 Recommended Dataset Combinations

**Option 1: Maximum Coverage (Recommended)**
- **Potholes/Cracks:** Pothole Mix + RoadDefects-ISeg + EGY_PDD
- **Instability:** R²S100K + EGY_PDD (rutting/bumps)
- **Debris:** RescueNet + IDD-AW
- **Streetlights:** Custom collection required
- **Garbage:** Custom collection required

**Option 2: YOLO-Ready Focus**
- **Potholes/Cracks:** RoadDefects-ISeg + EGY_PDD
- **Instability:** EGY_PDD (rutting/bumps)
- **Debris:** Convert IDD-AW or RescueNet
- **Streetlights:** Custom collection
- **Garbage:** Custom collection

---

## 5. Merging Multiple Datasets

### 5.1 Class Label Mapping Strategy

Create a unified label mapping scheme:

```python
# Example label mapping
UNIFIED_LABELS = {
    # Category 1: Potholes and Cracks
    "pothole": ["pothole", "potholes", "D40"],
    "crack": ["crack", "cracks", "longitudinal_crack", "transverse_crack", 
              "alligator_crack", "D00", "D10", "D20"],
    
    # Category 2: Road Instability
    "instability": ["rutting", "bump", "sag", "subsidence", "D43", "D44"],
    
    # Category 3: Fallen Trees/Debris
    "debris": ["fallen_tree", "tree", "debris", "obstruction", "storm_debris"],
    
    # Category 4: Streetlight/Pole Damage
    "streetlight": ["streetlight", "utility_pole", "pole", "light_pole"],
    
    # Category 5: Garbage
    "garbage": ["garbage", "litter", "trash", "waste", "rubbish"]
}
```

### 5.2 Annotation Format Conversion

#### 5.2.1 Using Roboflow
1. Upload datasets to Roboflow
2. Use format conversion tools (COCO → YOLO, Pascal VOC → YOLO)
3. Export in unified YOLO format
4. Merge datasets using Roboflow's dataset management

#### 5.2.2 Using Python Tools

**COCO to YOLO Conversion:**
```python
# Using pycocotools and custom scripts
from pycocotools.coco import COCO
import json

# Convert COCO annotations to YOLO format
# (Implementation details depend on specific requirements)
```

**Bounding Box to Segmentation:**
- Use tools like LabelMe or VGG Image Annotator (VIA) for manual conversion
- Or use automated methods (e.g., expand bounding boxes to approximate masks)

#### 5.2.3 Custom Conversion Scripts
- Develop scripts to:
  - Read different annotation formats
  - Map class labels to unified scheme
  - Convert to YOLO segmentation format
  - Validate annotations

### 5.3 Dataset Merging Workflow

1. **Data Collection**
   - Download all selected datasets
   - Verify licenses and usage terms

2. **Format Standardization**
   - Convert all annotations to YOLO segmentation format
   - Ensure consistent image formats (e.g., JPG, PNG)

3. **Label Mapping**
   - Map all class labels to unified scheme
   - Handle class conflicts and overlaps

4. **Quality Assurance**
   - Validate annotation accuracy
   - Check for duplicate images
   - Ensure balanced class distribution

5. **Dataset Splitting**
   - Create train/validation/test splits (e.g., 70/15/15)
   - Ensure class balance across splits

6. **Data Augmentation**
   - Apply augmentation to balance classes
   - Techniques: rotation, scaling, color jitter, etc.

---

## 6. Academic Papers and Projects

### 6.1 Key Papers Referenced

1. **R²S100K Dataset Paper**
   - Focus: Road-region segmentation in unstructured roadways
   - Publication: Springer (2024)
   - [Link](https://link.springer.com/article/10.1007/s11263-024-02207-3)

2. **RDD2022 Paper**
   - Focus: Road damage detection across multiple countries
   - Publication: arXiv (2022)
   - [Link](https://arxiv.org/abs/2209.08538)

3. **IDD-AW Paper**
   - Focus: Safe segmentation in adverse weather
   - Publication: arXiv (2023)
   - [Link](https://arxiv.org/abs/2311.14459)

4. **RescueNet Paper**
   - Focus: Natural disaster damage assessment
   - Publication: arXiv (2022)
   - [Link](https://arxiv.org/abs/2202.12361)

5. **EGY_PDD Paper**
   - Focus: Comprehensive road damage detection in Egypt
   - Publication: Springer (2025)
   - [Link](https://link.springer.com/article/10.1007/s11554-025-01683-1)

### 6.2 Research Areas to Explore

- **Smart City Projects:** Often release infrastructure monitoring datasets
- **Autonomous Driving Research:** May include road condition datasets
- **Disaster Response Research:** Source for debris/storm damage datasets
- **Municipal Infrastructure Monitoring:** Potential partnerships for custom data

---

## 7. Licensing and Usage Considerations

### 7.1 License Types Found

- **CC BY 4.0:** Permissive, allows commercial use with attribution
- **MIT:** Very permissive, allows commercial use
- **Non-commercial:** Research/academic use only
- **Custom/Unspecified:** Requires verification

### 7.2 Important Considerations

1. **Verify licenses** before commercial use
2. **Check attribution requirements** (CC BY 4.0)
3. **Review terms of use** for each dataset
4. **Consider data privacy** regulations (GDPR, etc.)
5. **Document dataset sources** for compliance

---

## 8. Recommendations

### 8.1 Immediate Actions

1. **Download and evaluate:**
   - Pothole Mix Dataset (ready for segmentation)
   - RoadDefects-ISeg (YOLO format, ready)
   - EGY_PDD (YOLO format, comprehensive)

2. **Set up conversion pipeline:**
   - Install Roboflow or prepare conversion scripts
   - Test COCO → YOLO conversion
   - Test bounding box → segmentation conversion

3. **Plan custom data collection:**
   - Streetlight/utility pole damage
   - Roadside garbage/litter

### 8.2 Long-term Strategy

1. **Establish partnerships:**
   - Municipal agencies for infrastructure data
   - Utility companies for pole/streetlight data
   - Environmental agencies for garbage data

2. **Develop annotation pipeline:**
   - Manual annotation tools
   - Quality assurance processes
   - Annotation guidelines

3. **Create unified dataset:**
   - Merge all collected datasets
   - Standardize annotations
   - Maintain version control

### 8.3 Priority Dataset List

**High Priority (Ready to Use):**
1. RoadDefects-ISeg (YOLO format, 1,000 images)
2. EGY_PDD (YOLO format, 14,612 images, 10 damage types)
3. Pothole Mix (Segmentation masks, 4,340 images)

**Medium Priority (Requires Conversion):**
1. RDD2022 (Bounding boxes, 47,420 images)
2. IDD-AW (Segmentation, 5,000 images, adverse weather)
3. RescueNet (Segmentation, disaster debris)

**Custom Collection Required:**
1. Streetlight/utility pole damage
2. Roadside garbage/litter

---

## 9. Tools and Resources

### 9.1 Annotation Tools
- **LabelMe:** Polygon annotation, format conversion
- **VIA (VGG Image Annotator):** Web-based annotation
- **Roboflow:** Dataset management and conversion
- **CVAT:** Computer Vision Annotation Tool

### 9.2 Conversion Tools
- **Roboflow:** Multi-format conversion
- **pycocotools:** COCO format handling
- **labelme2coco:** LabelMe to COCO conversion
- **Custom Python scripts:** For specific conversions

### 9.3 Dataset Management
- **Roboflow:** Dataset versioning, augmentation, management
- **DVC (Data Version Control):** Version control for datasets
- **Git LFS:** Large file storage for datasets

---

## 10. Next Steps

1. **Download Priority Datasets:**
   - Start with YOLO-ready datasets (RoadDefects-ISeg, EGY_PDD)
   - Download Pothole Mix for segmentation reference

2. **Set Up Conversion Environment:**
   - Install Roboflow or prepare conversion scripts
   - Test format conversions on sample data

3. **Evaluate Dataset Quality:**
   - Inspect annotation accuracy
   - Check class balance
   - Verify image quality

4. **Plan Custom Collection:**
   - Define annotation guidelines
   - Set up data collection pipeline
   - Establish quality assurance processes

5. **Begin Dataset Merging:**
   - Start with compatible datasets
   - Test label mapping
   - Validate merged dataset

---

## Appendix A: Dataset Quick Reference

| Dataset | Size | Format | License | Ready for YOLOv8-seg |
|---------|------|--------|---------|---------------------|
| RoadDefects-ISeg | 1,000 | YOLO | CC BY 4.0 | ✅ Yes |
| EGY_PDD | 14,612 | YOLO | Check | ✅ Yes |
| Pothole Mix | 4,340 | Masks | CC BY 4.0 | ✅ Yes |
| Cracks and Potholes | 2,235 | Masks | CC BY 4.0 | ✅ Yes |
| RDD2022 | 47,420 | BBoxes | Check | ⚠️ Convert |
| IDD-AW | 5,000 | Masks | Check | ✅ Yes |
| RescueNet | Variable | Masks | Check | ✅ Yes |
| R²S100K | 100,000 | Masks | Check | ✅ Yes |

---

## Appendix B: Contact Information and Links

### Dataset Sources
- **Pothole Mix:** [Mendeley Data](https://data.mendeley.com/datasets/kfth5g2xk3)
- **Cracks and Potholes:** [Dataset Website](https://biankatpas.github.io/Cracks-and-Potholes-in-Road-Images-Dataset/)
- **RoadDefects-ISeg:** [Zenodo](https://zenodo.org/records/17194814)
- **EGY_PDD:** [Springer Link](https://link.springer.com/article/10.1007/s11554-025-01683-1)
- **RDD2022:** [arXiv](https://arxiv.org/abs/2209.08538)
- **IDD-AW:** [GitHub](http://iddaw.github.io), [arXiv](https://arxiv.org/abs/2311.14459)
- **RescueNet:** [arXiv](https://arxiv.org/abs/2202.12361)
- **R²S100K:** [Springer Link](https://link.springer.com/article/10.1007/s11263-024-02207-3)

### Tools and Repositories
- **Roboflow:** [universe.roboflow.com](https://universe.roboflow.com/)
- **Kaggle:** [kaggle.com/datasets](https://www.kaggle.com/datasets)
- **Papers with Code:** [paperswithcode.com](https://paperswithcode.com/)
- **Google Dataset Search:** [datasetsearch.research.google.com](https://datasetsearch.research.google.com/)
- **Dataset Ninja:** [datasetninja.com](https://datasetninja.com/)

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Maintained By:** MargWatch Development Team

