#!/usr/bin/env python3
"""
MargWatch Dataset Preprocessing Script
Validates and prepares dataset for YOLOv8-segmentation training

Enhanced with:
- Duplicate detection (SHA1 and perceptual hash)
- Label remapping with validation
- Stratified split generation
- COCO polygon format support
- Comprehensive reporting
- Smoke sample generation
"""

import os
import yaml
import json
import csv
import hashlib
from pathlib import Path
from PIL import Image
import shutil
from collections import defaultdict
from typing import Dict, List, Tuple, Optional, Set
import random
import numpy as np

# Try to import optional dependencies
try:
    from shapely.geometry import Polygon
    SHAPELY_AVAILABLE = True
except ImportError:
    SHAPELY_AVAILABLE = False

try:
    import imagehash
    PERCEPTUAL_HASH_AVAILABLE = True
except ImportError:
    PERCEPTUAL_HASH_AVAILABLE = False

# Class names mapping - ORDERED LIST for YOLOv8
CLASS_NAMES = [
    'pothole',
    'instable_cracked_road',
    'fallen_trees',
    'garbage'
]

# Class ID to name mapping
CLASS_ID_TO_NAME = {i: name for i, name in enumerate(CLASS_NAMES)}
CLASS_NAME_TO_ID = {name: i for i, name in enumerate(CLASS_NAMES)}

# Polygon area epsilon for validation
POLYGON_AREA_EPSILON = 1e-6

def compute_file_hash(file_path: Path) -> str:
    """Compute SHA1 hash of file"""
    sha1 = hashlib.sha1()
    with open(file_path, 'rb') as f:
        for chunk in iter(lambda: f.read(4096), b''):
            sha1.update(chunk)
    return sha1.hexdigest()

def compute_perceptual_hash(image_path: Path) -> Optional[str]:
    """Compute perceptual hash (pHash) of image"""
    if not PERCEPTUAL_HASH_AVAILABLE:
        return None
    try:
        img = Image.open(image_path)
        phash = imagehash.phash(img)
        return str(phash)
    except Exception:
        return None

def validate_images(dataset_path: str, min_res: int = 640) -> Tuple[List[str], Dict]:
    """
    Validate all images in dataset
    
    Returns:
        (issues, stats): List of issues and image statistics
    """
    issues = []
    stats = {
        'total_images': 0,
        'valid_images': 0,
        'invalid_images': 0,
        'converted_rgba': 0,
        'resolution_issues': 0,
        'channel_issues': 0
    }
    
    for split in ['train', 'valid', 'test']:
        images_dir = Path(dataset_path) / split / 'images'
        
        if not images_dir.exists():
            issues.append(f"Missing directory: {images_dir}")
            continue
        
        for img_file in images_dir.glob('*'):
            if img_file.suffix.lower() not in ['.jpg', '.jpeg', '.png']:
                continue
            
            stats['total_images'] += 1
            
            try:
                # Open and load image (replaces verify())
                img = Image.open(img_file)
                img.load()  # Force loading to detect corruption
                
                # Check dimensions
                width, height = img.size
                if width < min_res or height < min_res:
                    issues.append(f"Small image: {img_file} - {img.size} (min: {min_res}x{min_res})")
                    stats['resolution_issues'] += 1
                
                # Check format
                if img.format not in ['JPEG', 'PNG']:
                    issues.append(f"Unsupported format: {img_file} - {img.format}")
                
                # Check channels - enforce 3-channel RGB
                if img.mode in ['RGBA', 'LA', 'P']:
                    # Convert to RGB
                    if img.mode == 'RGBA':
                        # Create white background
                        rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                        rgb_img.paste(img, mask=img.split()[3] if img.mode == 'RGBA' else None)
                        rgb_img.save(img_file, format='JPEG', quality=95)
                        stats['converted_rgba'] += 1
                    elif img.mode == 'P':
                        rgb_img = img.convert('RGB')
                        rgb_img.save(img_file, format='JPEG', quality=95)
                        stats['converted_rgba'] += 1
                    elif img.mode == 'LA':
                        rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                        rgb_img.paste(img.convert('RGB'))
                        rgb_img.save(img_file, format='JPEG', quality=95)
                        stats['converted_rgba'] += 1
                
                if img.mode not in ['RGB', 'L']:
                    issues.append(f"Invalid channel mode: {img_file} - {img.mode}")
                    stats['channel_issues'] += 1
                
                stats['valid_images'] += 1
                
            except Exception as e:
                issues.append(f"Corrupted image: {img_file} - {str(e)}")
                stats['invalid_images'] += 1
    
    return issues, stats

def parse_yolo_polygon(line: str) -> Tuple[int, List[float]]:
    """Parse YOLOv8 polygon format: class_id x1 y1 x2 y2 ..."""
    parts = line.strip().split()
    if len(parts) < 7:  # At least class_id + 3 points (6 coords)
        raise ValueError(f"Insufficient points: {len(parts)}")
    
    class_id = int(parts[0])
    coords = [float(x) for x in parts[1:]]
    
    if len(coords) % 2 != 0:
        raise ValueError(f"Odd number of coordinates: {len(coords)}")
    
    return class_id, coords

def parse_coco_polygon(annotation: Dict, img_width: int, img_height: int) -> Tuple[int, List[float]]:
    """
    Parse COCO polygon format and convert to normalized YOLO format
    
    COCO format: [x1, y1, x2, y2, ...] in absolute pixels
    Returns: (class_id, normalized_coords)
    """
    # COCO category_id (1-indexed) -> class_id (0-indexed)
    # Note: This assumes a mapping - may need adjustment based on dataset
    category_id = annotation.get('category_id', 0)
    class_id = category_id - 1 if category_id > 0 else 0  # Convert to 0-indexed
    
    segmentation = annotation.get('segmentation', [])
    if not segmentation:
        raise ValueError("Empty segmentation")
    
    # COCO can have multiple polygons per object (for disconnected regions)
    # For simplicity, take the first polygon
    if isinstance(segmentation[0], list):
        polygon = segmentation[0]
    else:
        polygon = segmentation
    
    # Convert absolute to normalized coordinates
    normalized_coords = []
    for i in range(0, len(polygon), 2):
        x = polygon[i] / img_width
        y = polygon[i + 1] / img_height
        normalized_coords.extend([x, y])
    
    return class_id, normalized_coords

def validate_polygon(coords: List[float], img_width: int, img_height: int) -> Tuple[bool, Optional[str]]:
    """
    Validate polygon coordinates
    
    Returns:
        (is_valid, error_message)
    """
    if len(coords) < 6:  # At least 3 points
        return False, "Polygon must have at least 3 points"
    
    # Check coordinates are in [0, 1]
    for coord in coords:
        if coord < 0 or coord > 1:
            return False, f"Coordinate out of range [0, 1]: {coord}"
    
    # Convert to absolute coordinates for area calculation
    abs_coords = []
    for i in range(0, len(coords), 2):
        abs_coords.append((coords[i] * img_width, coords[i + 1] * img_height))
    
    # Calculate polygon area (shoelace formula)
    area = 0.0
    n = len(abs_coords)
    for i in range(n):
        j = (i + 1) % n
        area += abs_coords[i][0] * abs_coords[j][1]
        area -= abs_coords[j][0] * abs_coords[i][1]
    area = abs(area) / 2.0
    
    if area < POLYGON_AREA_EPSILON:
        return False, f"Polygon area too small: {area}"
    
    # Check bounding box fits in image
    xs = [abs_coords[i][0] for i in range(n)]
    ys = [abs_coords[i][1] for i in range(n)]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    
    if min_x < 0 or min_y < 0 or max_x > img_width or max_y > img_height:
        return False, f"Bounding box outside image: ({min_x}, {min_y}) to ({max_x}, {max_y})"
    
    # Check for self-intersection if shapely available
    if SHAPELY_AVAILABLE:
        try:
            poly = Polygon(abs_coords)
            if not poly.is_valid:
                return False, f"Polygon is self-intersecting or invalid"
        except Exception as e:
            return False, f"Polygon validation error: {str(e)}"
    
    return True, None

def validate_annotations(dataset_path: str, format_type: str = 'yolo') -> Tuple[List[str], Dict]:
    """
    Validate YOLOv8 segmentation annotations or COCO format
    
    Args:
        format_type: 'yolo' or 'coco'
    
    Returns:
        (issues, stats): List of issues and annotation statistics
    """
    issues = []
    stats = {
        'total_labels': 0,
        'valid_labels': 0,
        'invalid_labels': 0,
        'empty_labels': 0,
        'class_distribution': defaultdict(int)
    }
    
    for split in ['train', 'valid', 'test']:
        labels_dir = Path(dataset_path) / split / 'labels'
        images_dir = Path(dataset_path) / split / 'images'
        
        if not labels_dir.exists():
            issues.append(f"Missing directory: {labels_dir}")
            continue
        
        if format_type == 'coco':
            # COCO format: single JSON file per split
            coco_file = labels_dir / f'{split}.json'
            if coco_file.exists():
                issues.extend(_validate_coco_file(coco_file, images_dir, stats))
            continue
        
        # YOLO format: one .txt file per image
        for label_file in labels_dir.glob('*.txt'):
            stats['total_labels'] += 1
            
            # Find corresponding image
            img_name = label_file.stem
            img_path = None
            
            for ext in ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG']:
                potential_path = images_dir / f"{img_name}{ext}"
                if potential_path.exists():
                    img_path = potential_path
                    break
            
            if img_path is None:
                issues.append(f"Missing image for label: {label_file}")
                stats['invalid_labels'] += 1
                continue
            
            # Load image to get dimensions
            try:
                img = Image.open(img_path)
                img_w, img_h = img.size
            except Exception as e:
                issues.append(f"Cannot open image {img_path}: {str(e)}")
                stats['invalid_labels'] += 1
                continue
            
            # Validate annotation file
            try:
                with open(label_file, 'r') as f:
                    lines = [l.strip() for l in f.readlines() if l.strip()]
                    
                    if len(lines) == 0:
                        stats['empty_labels'] += 1
                        continue
                    
                    for line_num, line in enumerate(lines, 1):
                        try:
                            class_id, coords = parse_yolo_polygon(line)
                            
                            # Check class ID
                            if class_id < 0 or class_id >= len(CLASS_NAMES):
                                issues.append(f"Invalid class ID in {label_file}:{line_num} - {class_id} (should be 0-{len(CLASS_NAMES)-1})")
                                stats['invalid_labels'] += 1
                                continue
                            
                            # Validate polygon
                            is_valid, error_msg = validate_polygon(coords, img_w, img_h)
                            if not is_valid:
                                issues.append(f"Invalid polygon in {label_file}:{line_num} - {error_msg}")
                                stats['invalid_labels'] += 1
                                continue
                            
                            stats['class_distribution'][class_id] += 1
                            stats['valid_labels'] += 1
                            
                        except ValueError as e:
                            issues.append(f"Parse error in {label_file}:{line_num} - {str(e)}")
                            stats['invalid_labels'] += 1
                        except Exception as e:
                            issues.append(f"Error processing {label_file}:{line_num} - {str(e)}")
                            stats['invalid_labels'] += 1
                            
            except Exception as e:
                issues.append(f"Error reading {label_file}: {str(e)}")
                stats['invalid_labels'] += 1
    
    return issues, stats

def _validate_coco_file(coco_file: Path, images_dir: Path, stats: Dict) -> List[str]:
    """Validate COCO format annotation file"""
    issues = []
    try:
        with open(coco_file, 'r') as f:
            coco_data = json.load(f)
        
        images_dict = {img['id']: img for img in coco_data.get('images', [])}
        categories_dict = {cat['id']: cat for cat in coco_data.get('categories', [])}
        
        for ann in coco_data.get('annotations', []):
            img_id = ann.get('image_id')
            if img_id not in images_dict:
                issues.append(f"Annotation references missing image_id: {img_id}")
                continue
            
            img_info = images_dict[img_id]
            img_path = images_dir / img_info['file_name']
            
            if not img_path.exists():
                issues.append(f"Image file not found: {img_path}")
                continue
            
            try:
                class_id, coords = parse_coco_polygon(ann, img_info['width'], img_info['height'])
                is_valid, error_msg = validate_polygon(coords, img_info['width'], img_info['height'])
                
                if not is_valid:
                    issues.append(f"Invalid polygon in annotation {ann.get('id')}: {error_msg}")
                else:
                    stats['class_distribution'][class_id] += 1
                    stats['valid_labels'] += 1
            except Exception as e:
                issues.append(f"Error processing annotation {ann.get('id')}: {str(e)}")
    
    except Exception as e:
        issues.append(f"Error reading COCO file {coco_file}: {str(e)}")
    
    return issues

def detect_duplicates(dataset_path: str) -> Tuple[Dict[str, List[str]], Dict[str, List[str]]]:
    """
    Detect duplicate images using SHA1 and perceptual hash
    
    Returns:
        (exact_duplicates, near_duplicates): Dict mapping hash to list of file paths
    """
    exact_duplicates = defaultdict(list)
    near_duplicates = defaultdict(list)
    
    all_images = []
    for split in ['train', 'valid', 'test']:
        images_dir = Path(dataset_path) / split / 'images'
        if images_dir.exists():
            all_images.extend(images_dir.glob('*'))
    
    # Compute hashes
    for img_path in all_images:
        if img_path.suffix.lower() not in ['.jpg', '.jpeg', '.png']:
            continue
        
        # SHA1 hash (exact duplicates)
        file_hash = compute_file_hash(img_path)
        exact_duplicates[file_hash].append(str(img_path))
        
        # Perceptual hash (near duplicates)
        if PERCEPTUAL_HASH_AVAILABLE:
            phash = compute_perceptual_hash(img_path)
            if phash:
                near_duplicates[phash].append(str(img_path))
    
    # Filter to only groups with duplicates
    exact_duplicates = {h: paths for h, paths in exact_duplicates.items() if len(paths) > 1}
    near_duplicates = {h: paths for h, paths in near_duplicates.items() if len(paths) > 1}
    
    return exact_duplicates, near_duplicates

def remap_labels(dataset_path: str, remapping: Dict[str, int], dry_run: bool = True) -> Dict:
    """
    Remap label class IDs according to mapping
    
    Args:
        remapping: Dict mapping source_class_id -> target_class_id
        dry_run: If True, only report changes without modifying files
    
    Returns:
        Report dictionary with remapping statistics
    """
    report = {
        'remapped_files': 0,
        'remapped_instances': 0,
        'unmapped_classes': set(),
        'changes': []
    }
    
    for split in ['train', 'valid', 'test']:
        labels_dir = Path(dataset_path) / split / 'labels'
        if not labels_dir.exists():
            continue
        
        for label_file in labels_dir.glob('*.txt'):
            try:
                with open(label_file, 'r') as f:
                    lines = f.readlines()
                
                new_lines = []
                file_changed = False
                
                for line in lines:
                    parts = line.strip().split()
                    if len(parts) < 2:
                        new_lines.append(line)
                        continue
                    
                    try:
                        source_class_id = int(parts[0])
                        
                        if source_class_id in remapping:
                            target_class_id = remapping[source_class_id]
                            new_line = f"{target_class_id} {' '.join(parts[1:])}\n"
                            new_lines.append(new_line)
                            
                            if source_class_id != target_class_id:
                                file_changed = True
                                report['remapped_instances'] += 1
                        else:
                            report['unmapped_classes'].add(source_class_id)
                            new_lines.append(line)  # Keep original
                    
                    except ValueError:
                        new_lines.append(line)  # Keep original
                
                if file_changed:
                    report['remapped_files'] += 1
                    report['changes'].append({
                        'file': str(label_file),
                        'split': split
                    })
                    
                    if not dry_run:
                        with open(label_file, 'w') as f:
                            f.writelines(new_lines)
            
            except Exception as e:
                report.setdefault('errors', []).append(f"Error processing {label_file}: {str(e)}")
    
    report['unmapped_classes'] = list(report['unmapped_classes'])
    return report

def create_stratified_splits(dataset_path: str, train_ratio: float = 0.7, 
                             val_ratio: float = 0.15, test_ratio: float = 0.15,
                             output_path: Optional[str] = None) -> Dict:
    """
    Create stratified splits based on per-image instance counts for each class
    
    Returns:
        Report with split statistics
    """
    if abs(train_ratio + val_ratio + test_ratio - 1.0) > 1e-6:
        raise ValueError("Ratios must sum to 1.0")
    
    # Collect all images with their class instance counts
    image_data = []
    
    for split in ['train', 'valid', 'test']:
        images_dir = Path(dataset_path) / split / 'images'
        labels_dir = Path(dataset_path) / split / 'labels'
        
        if not images_dir.exists() or not labels_dir.exists():
            continue
        
        for img_file in images_dir.glob('*'):
            if img_file.suffix.lower() not in ['.jpg', '.jpeg', '.png']:
                continue
            
            label_file = labels_dir / f"{img_file.stem}.txt"
            if not label_file.exists():
                continue
            
            # Count instances per class
            class_counts = defaultdict(int)
            try:
                with open(label_file, 'r') as f:
                    for line in f:
                        parts = line.strip().split()
                        if len(parts) >= 2:
                            class_id = int(parts[0])
                            if 0 <= class_id < len(CLASS_NAMES):
                                class_counts[class_id] += 1
            except Exception:
                continue
            
            image_data.append({
                'path': str(img_file),
                'label_path': str(label_file),
                'split': split,
                'class_counts': dict(class_counts)
            })
    
    # Shuffle for randomness
    random.shuffle(image_data)
    
    # Simple stratification: sort by class distribution signature
    # Group images with similar class distributions
    def get_class_signature(counts):
        return tuple(counts.get(i, 0) for i in range(len(CLASS_NAMES)))
    
    image_data.sort(key=lambda x: get_class_signature(x['class_counts']))
    
    # Split
    n_total = len(image_data)
    n_train = int(n_total * train_ratio)
    n_val = int(n_total * val_ratio)
    
    train_data = image_data[:n_train]
    val_data = image_data[n_train:n_train + n_val]
    test_data = image_data[n_train + n_val:]
    
    # Calculate statistics
    def count_instances(data_list):
        counts = defaultdict(int)
        for item in data_list:
            for class_id, count in item['class_counts'].items():
                counts[class_id] += count
        return dict(counts)
    
    report = {
        'total_images': n_total,
        'train': {
            'count': len(train_data),
            'instances': count_instances(train_data)
        },
        'val': {
            'count': len(val_data),
            'instances': count_instances(val_data)
        },
        'test': {
            'count': len(test_data),
            'instances': count_instances(test_data)
        }
    }
    
    # If output_path specified, actually move files
    if output_path:
        output_path = Path(output_path)
        for split_name, data_list in [('train', train_data), ('valid', val_data), ('test', test_data)]:
            split_images_dir = output_path / split_name / 'images'
            split_labels_dir = output_path / split_name / 'labels'
            split_images_dir.mkdir(parents=True, exist_ok=True)
            split_labels_dir.mkdir(parents=True, exist_ok=True)
            
            for item in data_list:
                src_img = Path(item['path'])
                src_label = Path(item['label_path'])
                
                dst_img = split_images_dir / src_img.name
                dst_label = split_labels_dir / src_label.name
                
                shutil.copy2(src_img, dst_img)
                shutil.copy2(src_label, dst_label)
    
    return report

def create_smoke_sample(output_path: str):
    """
    Create a tiny toy dataset for testing (one image per class + simple polygon masks)
    """
    output_path = Path(output_path)
    
    for split in ['train', 'valid', 'test']:
        images_dir = output_path / split / 'images'
        labels_dir = output_path / split / 'labels'
        images_dir.mkdir(parents=True, exist_ok=True)
        labels_dir.mkdir(parents=True, exist_ok=True)
    
    # Create one image per class, distribute across splits
    # Split assignment: class 0->train, class 1->valid, class 2->test, class 3->train
    split_assignment = ['train', 'valid', 'test', 'train']
    
    img_size = 640
    for class_id, class_name in enumerate(CLASS_NAMES):
        # Assign to split
        split = split_assignment[class_id] if class_id < len(split_assignment) else 'train'
        split_images_dir = output_path / split / 'images'
        split_labels_dir = output_path / split / 'labels'
        
        # Create simple colored image
        img = Image.new('RGB', (img_size, img_size), color=(50 + class_id * 50, 100, 150))
        
        # Draw a simple shape
        from PIL import ImageDraw
        draw = ImageDraw.Draw(img)
        
        # Draw different shapes for each class
        if class_id == 0:  # pothole - circle
            draw.ellipse([200, 200, 400, 400], fill=(255, 0, 0))
            # Polygon: approximate circle as octagon
            center_x, center_y = 300, 300
            radius = 100
            points = []
            for i in range(8):
                angle = i * 2 * np.pi / 8
                x = center_x + radius * np.cos(angle)
                y = center_y + radius * np.sin(angle)
                points.extend([x / img_size, y / img_size])
        
        elif class_id == 1:  # instable_cracked_road - line
            draw.line([100, 300, 500, 300], fill=(0, 255, 0), width=20)
            points = [100/img_size, 290/img_size, 500/img_size, 290/img_size, 
                     500/img_size, 310/img_size, 100/img_size, 310/img_size]
        
        elif class_id == 2:  # fallen_trees - rectangle
            draw.rectangle([200, 150, 450, 450], fill=(0, 0, 255))
            points = [200/img_size, 150/img_size, 450/img_size, 150/img_size,
                     450/img_size, 450/img_size, 200/img_size, 450/img_size]
        
        else:  # garbage - triangle
            draw.polygon([(320, 200), (200, 400), (440, 400)], fill=(255, 255, 0))
            points = [320/img_size, 200/img_size, 200/img_size, 400/img_size,
                     440/img_size, 400/img_size]
        
        # Save image to assigned split
        img_file = split_images_dir / f"{class_name}_{class_id}.jpg"
        img.save(img_file, 'JPEG')
        
        # Save label to assigned split
        label_file = split_labels_dir / f"{class_name}_{class_id}.txt"
        with open(label_file, 'w') as f:
            coords_str = ' '.join(f'{c:.6f}' for c in points)
            f.write(f"{class_id} {coords_str}\n")
    
    print(f"✅ Created smoke sample dataset at: {output_path}")
    return output_path

def analyze_class_distribution(dataset_path: str) -> Dict[str, Dict[int, int]]:
    """Analyze class distribution across splits"""
    class_counts = {
        'train': defaultdict(int),
        'valid': defaultdict(int),
        'test': defaultdict(int)
    }
    
    for split in ['train', 'valid', 'test']:
        labels_dir = Path(dataset_path) / split / 'labels'
        
        if not labels_dir.exists():
            continue
        
        for label_file in labels_dir.glob('*.txt'):
            try:
                with open(label_file, 'r') as f:
                    for line in f:
                        parts = line.strip().split()
                        if len(parts) < 2:
                            continue
                        try:
                            class_id = int(parts[0])
                            if 0 <= class_id < len(CLASS_NAMES):
                                class_counts[split][class_id] += 1
                        except ValueError:
                            continue
            except Exception as e:
                print(f"Warning: Error reading {label_file}: {e}")
    
    return class_counts

def print_class_distribution(class_counts: Dict[str, Dict[int, int]]):
    """Print class distribution statistics"""
    print("\n" + "="*60)
    print("CLASS DISTRIBUTION ANALYSIS")
    print("="*60)
    
    for split in ['train', 'valid', 'test']:
        counts = class_counts[split]
        total = sum(counts.values())
        
        if total == 0:
            print(f"\n{split.upper()} Split: No annotations found")
            continue
        
        print(f"\n{split.upper()} Split:")
        print(f"  Total instances: {total}")
        print(f"  {'Class':<25} {'Count':<10} {'Percentage':<10}")
        print(f"  {'-'*25} {'-'*10} {'-'*10}")
        
        for class_id in sorted(counts.keys()):
            count = counts[class_id]
            percentage = (count / total * 100) if total > 0 else 0
            class_name = CLASS_NAMES[class_id] if class_id < len(CLASS_NAMES) else f"Unknown({class_id})"
            print(f"  {class_name:<25} {count:<10} {percentage:>6.1f}%")
    
    print("\n" + "="*60)

def clean_dataset(dataset_path: str, dry_run: bool = False) -> List[str]:
    """Remove corrupted images and orphaned annotations"""
    removed = []
    
    for split in ['train', 'valid', 'test']:
        images_dir = Path(dataset_path) / split / 'images'
        labels_dir = Path(dataset_path) / split / 'labels'
        
        if not images_dir.exists() or not labels_dir.exists():
            continue
        
        # Remove images without labels
        for img_file in images_dir.glob('*'):
            if img_file.suffix.lower() not in ['.jpg', '.jpeg', '.png']:
                continue
                
            label_file = labels_dir / f"{img_file.stem}.txt"
            if not label_file.exists():
                removed.append(f"Orphaned image: {img_file}")
                if not dry_run:
                    img_file.unlink()
        
        # Remove labels without images
        for label_file in labels_dir.glob('*.txt'):
            img_name = label_file.stem
            img_found = False
            
            for ext in ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG']:
                img_file = images_dir / f"{img_name}{ext}"
                if img_file.exists():
                    img_found = True
                    break
            
            if not img_found:
                removed.append(f"Orphaned label: {label_file}")
                if not dry_run:
                    label_file.unlink()
    
    return removed

def create_data_yaml(dataset_path: str, output_path: str = 'data.yaml'):
    """
    Create data.yaml configuration file for YOLOv8
    Writes names as ordered list and nc correctly
    """
    abs_path = str(Path(dataset_path).absolute())
    
    # YOLOv8 expects names as a list, not a dict
    config = {
        'path': abs_path,
        'train': 'train/images',
        'val': 'valid/images',
        'test': 'test/images',
        'names': CLASS_NAMES,  # Ordered list
        'nc': len(CLASS_NAMES)  # Number of classes
    }
    
    with open(output_path, 'w') as f:
        yaml.dump(config, f, default_flow_style=False, sort_keys=False)
    
    print(f"✅ Created {output_path}")
    return output_path

def get_dataset_statistics(dataset_path: str) -> Dict:
    """Get comprehensive dataset statistics"""
    stats = {
        'splits': {},
        'total_images': 0,
        'total_annotations': 0
    }
    
    for split in ['train', 'valid', 'test']:
        images_dir = Path(dataset_path) / split / 'images'
        labels_dir = Path(dataset_path) / split / 'labels'
        
        if not images_dir.exists():
            continue
        
        image_count = len([f for f in images_dir.glob('*') if f.suffix.lower() in ['.jpg', '.jpeg', '.png']])
        annotation_count = 0
        
        if labels_dir.exists():
            for label_file in labels_dir.glob('*.txt'):
                try:
                    with open(label_file, 'r') as f:
                        annotation_count += len([l for l in f if l.strip()])
                except:
                    pass
        
        stats['splits'][split] = {
            'images': image_count,
            'annotations': annotation_count
        }
        stats['total_images'] += image_count
        stats['total_annotations'] += annotation_count
    
    return stats

def print_dataset_statistics(stats: Dict):
    """Print dataset statistics"""
    print("\n" + "="*60)
    print("DATASET STATISTICS")
    print("="*60)
    print(f"\nTotal Images: {stats['total_images']}")
    print(f"Total Annotations: {stats['total_annotations']}")
    print(f"\nPer-Split Breakdown:")
    print(f"  {'Split':<10} {'Images':<10} {'Annotations':<15}")
    print(f"  {'-'*10} {'-'*10} {'-'*15}")
    
    for split in ['train', 'valid', 'test']:
        if split in stats['splits']:
            split_stats = stats['splits'][split]
            print(f"  {split:<10} {split_stats['images']:<10} {split_stats['annotations']:<15}")
    
    print("="*60)

def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Preprocess MargWatch dataset for YOLOv8-segmentation',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Create smoke sample and validate
  python preprocess_dataset.py --create-smoke-sample smoke_dataset --validate --dry-run
  
  # Full preprocessing with duplicate detection
  python preprocess_dataset.py dataset_path --all --min-res 640
  
  # Stratified split generation
  python preprocess_dataset.py dataset_path --stratify --output stratified_dataset
        """
    )
    parser.add_argument('dataset_path', type=str, nargs='?', help='Path to dataset directory')
    parser.add_argument('--validate', action='store_true', help='Validate dataset')
    parser.add_argument('--clean', action='store_true', help='Clean orphaned files')
    parser.add_argument('--dry-run', action='store_true', default=False, 
                        help='Dry run mode (no files modified, generates report)')
    parser.add_argument('--no-dry-run', action='store_true', 
                        help='Explicitly disable dry-run (allows file modifications)')
    parser.add_argument('--create-yaml', action='store_true', help='Create data.yaml file')
    parser.add_argument('--stats', action='store_true', help='Print dataset statistics')
    parser.add_argument('--all', action='store_true', help='Run all checks and create yaml')
    parser.add_argument('--min-res', type=int, default=640, 
                        help='Minimum image resolution (default: 640)')
    parser.add_argument('--sample', type=int, default=None,
                        help='Sample N images for validation (faster testing)')
    parser.add_argument('--stratify', action='store_true',
                        help='Create stratified splits based on class distribution')
    parser.add_argument('--output', type=str, default=None,
                        help='Output path for stratified splits')
    parser.add_argument('--create-smoke-sample', type=str, default=None,
                        help='Create smoke sample dataset at specified path')
    parser.add_argument('--remap', type=str, default=None,
                        help='Path to remapping JSON file (format: {"source_id": target_id})')
    parser.add_argument('--format', type=str, default='yolo', choices=['yolo', 'coco'],
                        help='Annotation format (default: yolo)')
    parser.add_argument('--report', type=str, default='preprocess_report.json',
                        help='Output path for JSON report (default: preprocess_report.json)')
    
    args = parser.parse_args()
    
    # Handle dry-run logic: default is False, but --dry-run sets it to True
    # --no-dry-run explicitly sets it to False
    dry_run = args.dry_run
    if args.no_dry_run:
        dry_run = False
    
    # Create smoke sample if requested
    if args.create_smoke_sample:
        smoke_path = create_smoke_sample(args.create_smoke_sample)
        args.dataset_path = args.create_smoke_sample
        print(f"✅ Smoke sample created. Use this path for further processing.")
    
    if not args.dataset_path:
        parser.error("dataset_path is required (or use --create-smoke-sample)")
    
    dataset_path = args.dataset_path
    
    if not os.path.exists(dataset_path):
        print(f"❌ Dataset path does not exist: {dataset_path}")
        return
    
    print(f"📁 Dataset path: {dataset_path}")
    print(f"🔧 Dry-run mode: {dry_run}")
    
    # Initialize report
    report = {
        'dataset_path': str(dataset_path),
        'dry_run': dry_run,
        'timestamp': str(Path().cwd()),
        'issues': {},
        'statistics': {},
        'duplicates': {},
        'remapping': None,
        'stratified_splits': None
    }
    
    # Gather statistics
    if args.all or args.stats:
        print("\n📊 Gathering dataset statistics...")
        stats = get_dataset_statistics(dataset_path)
        print_dataset_statistics(stats)
        report['statistics']['dataset'] = stats
    
    # Validate images
    if args.all or args.validate:
        print(f"\n🔍 Validating images (min resolution: {args.min_res})...")
        image_issues, image_stats = validate_images(dataset_path, min_res=args.min_res)
        report['statistics']['images'] = image_stats
        
        if image_issues:
            print(f"⚠️  Found {len(image_issues)} image issues:")
            for issue in image_issues[:10]:
                print(f"   - {issue}")
            if len(image_issues) > 10:
                print(f"   ... and {len(image_issues) - 10} more")
            report['issues']['images'] = image_issues[:100]  # Limit in report
        else:
            print("✅ No image issues found")
        
        print("\n🔍 Validating annotations...")
        annotation_issues, annotation_stats = validate_annotations(dataset_path, format_type=args.format)
        report['statistics']['annotations'] = annotation_stats
        
        if annotation_issues:
            print(f"⚠️  Found {len(annotation_issues)} annotation issues:")
            for issue in annotation_issues[:10]:
                print(f"   - {issue}")
            if len(annotation_issues) > 10:
                print(f"   ... and {len(annotation_issues) - 10} more")
            report['issues']['annotations'] = annotation_issues[:100]
        else:
            print("✅ No annotation issues found")
    
    # Duplicate detection
    if args.all:
        print("\n🔍 Detecting duplicates...")
        exact_dups, near_dups = detect_duplicates(dataset_path)
        
        if exact_dups:
            print(f"⚠️  Found {len(exact_dups)} groups of exact duplicates")
            report['duplicates']['exact'] = {h: paths for h, paths in list(exact_dups.items())[:20]}
        
        if near_dups:
            print(f"⚠️  Found {len(near_dups)} groups of near-duplicates")
            report['duplicates']['near'] = {h: paths for h, paths in list(near_dups.items())[:20]}
        
        # Write duplicates CSV
        if exact_dups or near_dups:
            with open('duplicates.csv', 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(['type', 'hash', 'file_paths'])
                for h, paths in exact_dups.items():
                    writer.writerow(['exact', h, ';'.join(paths)])
                for h, paths in near_dups.items():
                    writer.writerow(['near', h, ';'.join(paths)])
            print(f"✅ Wrote duplicates.csv")
    
    # Class distribution
    if args.all or True:  # Always analyze
        print("\n📊 Analyzing class distribution...")
        class_counts = analyze_class_distribution(dataset_path)
        print_class_distribution(class_counts)
        report['statistics']['class_distribution'] = {
            split: dict(counts) for split, counts in class_counts.items()
        }
    
    # Label remapping
    if args.remap:
        print("\n🔄 Remapping labels...")
        with open(args.remap, 'r') as f:
            remapping = json.load(f)
        remap_report = remap_labels(dataset_path, remapping, dry_run=dry_run)
        report['remapping'] = remap_report
        print(f"   Remapped {remap_report['remapped_instances']} instances in {remap_report['remapped_files']} files")
        if remap_report['unmapped_classes']:
            print(f"   ⚠️  Unmapped classes: {remap_report['unmapped_classes']}")
    
    # Stratified splits
    if args.stratify:
        print("\n📊 Creating stratified splits...")
        split_report = create_stratified_splits(dataset_path, output_path=args.output)
        report['stratified_splits'] = split_report
        print(f"   Train: {split_report['train']['count']} images")
        print(f"   Val: {split_report['val']['count']} images")
        print(f"   Test: {split_report['test']['count']} images")
    
    # Clean dataset
    if args.all or args.clean:
        print("\n🧹 Cleaning dataset...")
        removed = clean_dataset(dataset_path, dry_run=dry_run)
        if removed:
            mode = "Would remove" if dry_run else "Removed"
            print(f"{mode} {len(removed)} orphaned files:")
            for item in removed[:10]:
                print(f"   - {item}")
            if len(removed) > 10:
                print(f"   ... and {len(removed) - 10} more")
            report['cleaned'] = removed[:100]
            
            if dry_run:
                print("\n💡 Run with --no-dry-run to actually remove files")
        else:
            print("✅ No orphaned files found")
    
    # Create data.yaml
    if args.all or args.create_yaml:
        print("\n📝 Creating data.yaml...")
        yaml_path = create_data_yaml(dataset_path)
        print(f"✅ Configuration file created: {yaml_path}")
        report['data_yaml'] = yaml_path
    
    # Write report
    with open(args.report, 'w') as f:
        json.dump(report, f, indent=2, default=str)
    print(f"\n✅ Report written to: {args.report}")
    
    print("\n✅ Preprocessing complete!")

if __name__ == '__main__':
    main()
