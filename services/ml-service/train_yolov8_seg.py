#!/usr/bin/env python3
"""
YOLOv8-segmentation Training Script for MargWatch Road Hazards

Enhanced with:
- Reproducibility (seed setting, deterministic cudnn)
- Per-class metric logging
- Smoke run mode
- Model export (ONNX, TorchScript)
- Class failure monitoring
"""

from ultralytics import YOLO
import torch
import torch.backends.cudnn as cudnn
import os
import json
import csv
import random
import numpy as np
from pathlib import Path
from typing import Dict, List, Optional
import yaml

# Configuration
CONFIG = {
    'model_size': 'n',  # Options: n (nano), s (small), m (medium), l (large), x (xlarge)
    'data_yaml': 'data.yaml',
    'epochs': 200,
    'imgsz': 640,
    'batch': 16,  # Adjust based on GPU memory
    'device': None,  # Auto-detect: 'cuda', 'cpu', or device ID
    'workers': 8,
    'project': 'runs/segment',
    'name': 'margwatch-hazards',
    'patience': 50,  # Early stopping patience
    'save_period': 10,  # Save checkpoint every N epochs
    'seed': None,  # Random seed for reproducibility
}

# Class names for reference
CLASS_NAMES = [
    'pothole',
    'instable_cracked_road',
    'fallen_trees',
    'garbage'
]

CLASS_ID_TO_NAME = {i: name for i, name in enumerate(CLASS_NAMES)}

def set_seed(seed: int):
    """
    Set random seed for reproducibility
    
    Assumption: We set seeds for Python random, NumPy, and PyTorch
    to ensure deterministic behavior across runs.
    """
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    
    # Set deterministic cudnn flags
    cudnn.deterministic = True
    cudnn.benchmark = False
    
    # Additional PyTorch deterministic settings
    os.environ['PYTHONHASHSEED'] = str(seed)
    torch.use_deterministic_algorithms(True, warn_only=True)
    
    print(f"✅ Seed set to {seed} (deterministic mode)")

def check_environment():
    """Check training environment"""
    print("🔍 Checking environment...")
    
    # Check GPU availability
    if torch.cuda.is_available():
        device = 'cuda'
        gpu_name = torch.cuda.get_device_name(0)
        gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1e9
        print(f"✅ GPU detected: {gpu_name}")
        print(f"   Memory: {gpu_memory:.2f} GB")
        print(f"   CUDA version: {torch.version.cuda}")
    else:
        device = 'cpu'
        print("⚠️  No GPU detected, using CPU (training will be slower)")
    
    # Check data.yaml exists
    if not os.path.exists(CONFIG['data_yaml']):
        print(f"❌ data.yaml not found: {CONFIG['data_yaml']}")
        print("   Run preprocess_dataset.py first to create data.yaml")
        return False
    
    # Check dataset structure
    with open(CONFIG['data_yaml'], 'r') as f:
        data_config = yaml.safe_load(f)
        dataset_path = data_config.get('path', '')
        
        if not os.path.exists(dataset_path):
            print(f"❌ Dataset path does not exist: {dataset_path}")
            return False
        
        # Check splits exist
        for split in ['train', 'valid', 'test']:
            split_path = Path(dataset_path) / split / 'images'
            if not split_path.exists():
                print(f"⚠️  Warning: {split} split not found at {split_path}")
    
    print("✅ Environment check passed")
    return True

def load_model(model_size: str = 'n'):
    """Load YOLOv8-seg model"""
    model_name = f'yolov8{model_size}-seg.pt'
    print(f"📦 Loading model: {model_name}")
    
    try:
        model = YOLO(model_name)
        print(f"✅ Model loaded successfully")
        return model
    except Exception as e:
        print(f"❌ Failed to load model: {e}")
        print("   Make sure ultralytics is installed: pip install ultralytics")
        return None

def train_model(model, config: dict, smoke_run: bool = False):
    """
    Train the model
    
    Args:
        smoke_run: If True, use fraction of data and fewer epochs for quick testing
    """
    print("\n🎯 Starting training...")
    print(f"   Model: yolov8{config['model_size']}-seg")
    print(f"   Epochs: {config['epochs']}")
    print(f"   Image size: {config['imgsz']}")
    print(f"   Batch size: {config['batch']}")
    print(f"   Device: {config['device']}")
    print(f"   Classes: {len(CLASS_NAMES)}")
    for class_id, class_name in enumerate(CLASS_NAMES):
        print(f"     {class_id}: {class_name}")
    
    if smoke_run:
        print("   ⚠️  SMOKE RUN MODE: Using reduced data and epochs")
    
    train_kwargs = {
        'data': config['data_yaml'],
        'epochs': config['epochs'],
        'imgsz': config['imgsz'],
        'batch': config['batch'],
        'device': config['device'],
        'workers': config['workers'],
        'project': config['project'],
        'name': config['name'],
        'exist_ok': True,
        'patience': config['patience'],
        'save_period': config['save_period'],
        'val': True,
        'plots': True,
        'amp': config['device'] != 'cpu',  # AMP only on GPU
    }
    
    # Smoke run: use fraction of data
    if smoke_run:
        train_kwargs['fraction'] = 0.1  # Use 10% of data
        train_kwargs['epochs'] = min(5, config['epochs'])  # Max 5 epochs
        train_kwargs['patience'] = 3
    
    try:
        results = model.train(**train_kwargs)
        
        print("\n✅ Training complete!")
        print(f"   Best model: {results.save_dir}/weights/best.pt")
        print(f"   Last model: {results.save_dir}/weights/last.pt")
        
        return results
        
    except Exception as e:
        print(f"\n❌ Training failed: {e}")
        import traceback
        traceback.print_exc()
        return None

def compute_per_class_metrics(metrics, results_dir: str) -> Dict:
    """
    Compute per-class metrics from validation results
    
    Assumption: Ultralytics provides per-class metrics in results_dict
    We extract mask mAP, precision, and recall for each class.
    """
    per_class_metrics = {}
    
    if not hasattr(metrics, 'results_dict'):
        print("⚠️  results_dict not available, skipping per-class metrics")
        return per_class_metrics
    
    results_dict = metrics.results_dict
    
    for class_id, class_name in enumerate(CLASS_NAMES):
        class_metrics = {
            'class_id': class_id,
            'class_name': class_name,
            'mask_mAP50': None,
            'mask_mAP50_95': None,
            'precision': None,
            'recall': None,
        }
        
        # Try to extract per-class metrics
        # Note: Metric keys may vary by Ultralytics version
        prefix = f'metrics/seg/mAP50(M)(class_{class_id})'
        if prefix in results_dict:
            class_metrics['mask_mAP50'] = float(results_dict[prefix])
        
        prefix = f'metrics/seg/mAP50-95(M)(class_{class_id})'
        if prefix in results_dict:
            class_metrics['mask_mAP50_95'] = float(results_dict[prefix])
        
        # Box metrics (may be more reliable)
        prefix = f'metrics/precision(B)(class_{class_id})'
        if prefix in results_dict:
            class_metrics['precision'] = float(results_dict[prefix])
        
        prefix = f'metrics/recall(B)(class_{class_id})'
        if prefix in results_dict:
            class_metrics['recall'] = float(results_dict[prefix])
        
        per_class_metrics[class_id] = class_metrics
    
    return per_class_metrics

def validate_model(model, config: dict, results_dir: str) -> Dict:
    """
    Validate model on test set and compute per-class metrics
    
    Returns:
        Dictionary with validation metrics
    """
    print("\n📊 Running validation on test set...")
    
    try:
        metrics = model.val(
            data=config['data_yaml'],
            split='test'
        )
        
        print("\n📈 Validation Results:")
        print(f"   mAP50 (boxes): {metrics.seg.map50:.4f}")
        print(f"   mAP50-95 (boxes): {metrics.seg.map:.4f}")
        
        # Compute per-class metrics
        per_class_metrics = compute_per_class_metrics(metrics, results_dir)
        
        if per_class_metrics:
            print("\n   Per-Class Metrics:")
            for class_id, class_metrics in per_class_metrics.items():
                class_name = class_metrics['class_name']
                print(f"     {class_name}:")
                if class_metrics['mask_mAP50'] is not None:
                    print(f"       Mask mAP50: {class_metrics['mask_mAP50']:.4f}")
                if class_metrics['mask_mAP50_95'] is not None:
                    print(f"       Mask mAP50-95: {class_metrics['mask_mAP50_95']:.4f}")
                if class_metrics['precision'] is not None:
                    print(f"       Precision: {class_metrics['precision']:.4f}")
                if class_metrics['recall'] is not None:
                    print(f"       Recall: {class_metrics['recall']:.4f}")
        
        # Save validation report
        validation_report = {
            'overall': {
                'mask_mAP50': float(metrics.seg.map50),
                'mask_mAP50_95': float(metrics.seg.map),
            },
            'per_class': per_class_metrics,
            'results_dict': {k: float(v) for k, v in metrics.results_dict.items() if isinstance(v, (int, float, np.number))}
        }
        
        report_path = Path(results_dir) / 'validation_report.json'
        with open(report_path, 'w') as f:
            json.dump(validation_report, f, indent=2, default=str)
        print(f"\n✅ Validation report saved to: {report_path}")
        
        return validation_report
        
    except Exception as e:
        print(f"❌ Validation failed: {e}")
        import traceback
        traceback.print_exc()
        return None

def monitor_class_failures(model, config: dict, results_dir: str, iou_threshold: float = 0.5):
    """
    Generate class failure CSV with FN and FP examples
    
    Assumption: We run predictions on test set and compare with ground truth
    to identify false negatives (missed detections) and false positives (incorrect detections).
    """
    print("\n🔍 Monitoring class failures...")
    
    # Load test set
    with open(config['data_yaml'], 'r') as f:
        data_config = yaml.safe_load(f)
        dataset_path = Path(data_config['path'])
        test_images_dir = dataset_path / 'test' / 'images'
        test_labels_dir = dataset_path / 'test' / 'labels'
    
    if not test_images_dir.exists():
        print("⚠️  Test set not found, skipping class failure monitoring")
        return
    
    failures = []
    
    # Process test images
    test_images = list(test_images_dir.glob('*.jpg')) + list(test_images_dir.glob('*.png'))
    
    for img_path in test_images[:100]:  # Limit to 100 images for performance
        # Load ground truth
        label_path = test_labels_dir / f"{img_path.stem}.txt"
        if not label_path.exists():
            continue
        
        gt_classes = set()
        try:
            with open(label_path, 'r') as f:
                for line in f:
                    parts = line.strip().split()
                    if len(parts) >= 2:
                        gt_classes.add(int(parts[0]))
        except Exception:
            continue
        
        # Run prediction
        try:
            results = model(str(img_path), conf=0.25, iou=iou_threshold)
            if len(results) == 0:
                continue
            
            pred_classes = set()
            if results[0].boxes is not None and len(results[0].boxes) > 0:
                pred_classes = set(results[0].boxes.cls.cpu().int().tolist())
            
            # Find false negatives (classes in GT but not in predictions)
            for class_id in gt_classes:
                if class_id not in pred_classes:
                    failures.append({
                        'image': str(img_path.name),
                        'class_id': int(class_id),
                        'class_name': CLASS_NAMES[class_id] if class_id < len(CLASS_NAMES) else f"Unknown({class_id})",
                        'failure_type': 'FN',  # False Negative
                        'confidence': None
                    })
            
            # Find false positives (classes in predictions but not in GT)
            for class_id in pred_classes:
                if class_id not in gt_classes:
                    # Get confidence for this class
                    conf = None
                    if results[0].boxes is not None:
                        boxes = results[0].boxes
                        class_mask = boxes.cls.cpu().int() == class_id
                        if class_mask.any():
                            conf = float(boxes.conf[class_mask].max().cpu())
                    
                    failures.append({
                        'image': str(img_path.name),
                        'class_id': int(class_id),
                        'class_name': CLASS_NAMES[class_id] if class_id < len(CLASS_NAMES) else f"Unknown({class_id})",
                        'failure_type': 'FP',  # False Positive
                        'confidence': conf
                    })
        
        except Exception as e:
            print(f"⚠️  Error processing {img_path}: {e}")
            continue
    
    # Write failures CSV
    if failures:
        csv_path = Path(results_dir) / 'class_failures.csv'
        with open(csv_path, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=['image', 'class_id', 'class_name', 'failure_type', 'confidence'])
            writer.writeheader()
            writer.writerows(failures)
        print(f"✅ Class failures CSV saved to: {csv_path}")
        print(f"   Total failures: {len(failures)}")
        
        # Summary by class
        class_summary = {}
        for failure in failures:
            class_name = failure['class_name']
            if class_name not in class_summary:
                class_summary[class_name] = {'FN': 0, 'FP': 0}
            class_summary[class_name][failure['failure_type']] += 1
        
        print("\n   Failure Summary by Class:")
        for class_name, counts in class_summary.items():
            print(f"     {class_name}: FN={counts['FN']}, FP={counts['FP']}")
    else:
        print("✅ No failures detected (or test set too small)")

def export_model(model, model_path: str, formats: List[str] = ['onnx']):
    """Export model to different formats"""
    print(f"\n📤 Exporting model: {model_path}")
    
    exported = []
    for fmt in formats:
        try:
            print(f"   Exporting to {fmt.upper()}...")
            model.export(format=fmt)
            exported.append(fmt)
            print(f"   ✅ Exported to {fmt.upper()}")
        except Exception as e:
            print(f"   ❌ Failed to export to {fmt.upper()}: {e}")
    
    return exported

def main():
    """Main training function"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Train YOLOv8-segmentation model for MargWatch',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic training
  python train_yolov8_seg.py --epochs 200
  
  # Smoke run (quick test)
  python train_yolov8_seg.py --smoke-run --epochs 5
  
  # Reproducible training with seed
  python train_yolov8_seg.py --seed 42 --epochs 200
  
  # Export to ONNX and TorchScript
  python train_yolov8_seg.py --export onnx torchscript
        """
    )
    parser.add_argument('--model-size', type=str, default='n', choices=['n', 's', 'm', 'l', 'x'],
                        help='Model size: n (nano), s (small), m (medium), l (large), x (xlarge)')
    parser.add_argument('--data-yaml', type=str, default='data.yaml',
                        help='Path to data.yaml configuration file')
    parser.add_argument('--epochs', type=int, default=200,
                        help='Number of training epochs')
    parser.add_argument('--batch', type=int, default=16,
                        help='Batch size')
    parser.add_argument('--imgsz', type=int, default=640,
                        help='Image size for training')
    parser.add_argument('--device', type=str, default=None,
                        help='Device: cuda, cpu, or device ID')
    parser.add_argument('--name', type=str, default='margwatch-hazards',
                        help='Experiment name')
    parser.add_argument('--seed', type=int, default=None,
                        help='Random seed for reproducibility')
    parser.add_argument('--smoke-run', action='store_true',
                        help='Smoke run mode: use fraction of data and fewer epochs')
    parser.add_argument('--export', type=str, nargs='+', default=['onnx'],
                        choices=['onnx', 'torchscript', 'tflite'],
                        help='Export formats (default: onnx)')
    parser.add_argument('--monitor-classes', action='store_true',
                        help='Generate class failure CSV with FN/FP examples')
    
    args = parser.parse_args()
    
    print("="*60)
    print("MargWatch YOLOv8-Segmentation Training")
    print("="*60)
    
    # Update config with command line arguments
    CONFIG['model_size'] = args.model_size
    CONFIG['data_yaml'] = args.data_yaml
    CONFIG['epochs'] = args.epochs
    CONFIG['batch'] = args.batch
    CONFIG['imgsz'] = args.imgsz
    CONFIG['device'] = args.device
    CONFIG['name'] = args.name
    CONFIG['seed'] = args.seed
    
    # Set seed if provided
    if CONFIG['seed'] is not None:
        set_seed(CONFIG['seed'])
        print(f"📌 Using seed: {CONFIG['seed']}")
    else:
        print("⚠️  No seed specified - training will not be reproducible")
    
    # Check environment
    if not check_environment():
        return
    
    # Auto-detect device
    if CONFIG['device'] is None:
        CONFIG['device'] = 'cuda' if torch.cuda.is_available() else 'cpu'
    
    # Adjust batch size for CPU
    if CONFIG['device'] == 'cpu':
        CONFIG['batch'] = max(4, CONFIG['batch'] // 2)
        CONFIG['workers'] = 4
        print(f"⚠️  Reduced batch size to {CONFIG['batch']} for CPU training")
    
    # Load model
    model = load_model(CONFIG['model_size'])
    if model is None:
        return
    
    # Train model
    results = train_model(model, CONFIG, smoke_run=args.smoke_run)
    if results is None:
        return
    
    # Validate model
    best_model_path = f"{results.save_dir}/weights/best.pt"
    if os.path.exists(best_model_path):
        best_model = YOLO(best_model_path)
        validation_report = validate_model(best_model, CONFIG, results.save_dir)
        
        # Monitor class failures if requested
        if args.monitor_classes:
            monitor_class_failures(best_model, CONFIG, results.save_dir)
        
        # Export model
        if args.export:
            exported = export_model(best_model, best_model_path, formats=args.export)
            if exported:
                print(f"\n✅ Exported formats: {', '.join(exported)}")
    
    print("\n" + "="*60)
    print("Training pipeline complete!")
    print("="*60)
    print(f"\nNext steps:")
    print(f"1. Review training results in: {results.save_dir}")
    print(f"2. Check validation_report.json for per-class metrics")
    if args.monitor_classes:
        print(f"3. Review class_failures.csv for failure analysis")
    print(f"4. Test model predictions on sample images")
    print(f"5. Integrate model into ML service")
    print(f"6. Deploy to production")

if __name__ == '__main__':
    main()
