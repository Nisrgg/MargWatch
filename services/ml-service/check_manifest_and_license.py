#!/usr/bin/env python3
"""
Dataset Manifest and License Checker

Checks dataset sources for license information and generates manifest CSV.
Supports Kaggle, GitHub, and local dataset sources.
"""

import os
import json
import csv
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import urllib.request
import urllib.parse

# Common license patterns
LICENSE_PATTERNS = {
    'MIT': r'MIT\s+License|MIT License|The MIT License',
    'Apache-2.0': r'Apache\s+License\s+2\.0|Apache-2\.0',
    'CC-BY-4.0': r'Creative\s+Commons\s+Attribution\s+4\.0|CC\s+BY\s+4\.0|CC-BY-4\.0',
    'CC-BY-SA-4.0': r'CC\s+BY-SA\s+4\.0|CC-BY-SA-4\.0',
    'GPL-3.0': r'GPL\s+v?3|GNU\s+General\s+Public\s+License\s+v?3',
    'BSD-3-Clause': r'BSD\s+3-Clause|BSD-3-Clause',
    'Unlicense': r'Unlicense|Public Domain',
}

# Permissive licenses (generally safe for commercial use)
PERMISSIVE_LICENSES = {
    'MIT', 'Apache-2.0', 'CC-BY-4.0', 'BSD-3-Clause', 'Unlicense'
}

# Non-permissive licenses (may have restrictions)
NON_PERMISSIVE_LICENSES = {
    'GPL-3.0', 'CC-BY-SA-4.0'
}

def check_kaggle_license(dataset_url: str) -> Tuple[Optional[str], str]:
    """
    Check license for Kaggle dataset
    
    Assumption: Kaggle datasets have license info in their metadata
    We try to extract from URL or API if available.
    """
    # Extract dataset identifier from URL
    # Format: https://www.kaggle.com/datasets/{user}/{dataset}
    match = re.search(r'kaggle\.com/datasets/([^/]+)/([^/]+)', dataset_url)
    if not match:
        return None, 'unknown'
    
    user, dataset = match.groups()
    
    # Try to read LICENSE file from dataset (if downloaded)
    # In practice, would need Kaggle API access for full metadata
    # For now, return unknown and note in manifest
    return None, 'unknown'

def check_github_license(repo_url: str) -> Tuple[Optional[str], str]:
    """
    Check license for GitHub repository
    
    Assumption: GitHub repos typically have LICENSE file in root
    We check common license file names and patterns.
    """
    # Extract owner/repo from URL
    match = re.search(r'github\.com/([^/]+)/([^/]+)', repo_url)
    if not match:
        return None, 'unknown'
    
    owner, repo = match.groups()
    
    # Try GitHub API to get license info
    api_url = f"https://api.github.com/repos/{owner}/{repo}/license"
    
    try:
        with urllib.request.urlopen(api_url, timeout=5) as response:
            data = json.loads(response.read())
            license_info = data.get('license', {})
            license_name = license_info.get('spdx_id') or license_info.get('name', 'unknown')
            license_text = data.get('content', '')
            
            if license_text:
                # Decode base64 content if present
                import base64
                try:
                    license_text = base64.b64decode(license_text).decode('utf-8')
                except:
                    pass
            
            return license_text, license_name.lower() if license_name else 'unknown'
    
    except Exception as e:
        # Fallback: try to detect from common patterns
        return None, 'unknown'

def check_local_license(dataset_path: str) -> Tuple[Optional[str], str]:
    """
    Check license for local dataset
    
    Assumption: Local datasets may have LICENSE, LICENSE.txt, or LICENSE.md files
    We check common locations and patterns.
    """
    dataset_path = Path(dataset_path)
    
    # Check common license file names
    license_files = [
        'LICENSE',
        'LICENSE.txt',
        'LICENSE.md',
        'LICENCE',
        'license',
        'COPYING',
    ]
    
    for license_file in license_files:
        license_path = dataset_path / license_file
        if license_path.exists():
            try:
                with open(license_path, 'r', encoding='utf-8', errors='ignore') as f:
                    license_text = f.read()
                
                # Try to detect license type
                license_type = detect_license_type(license_text)
                return license_text[:500], license_type  # Return first 500 chars
            except Exception as e:
                continue
    
    # Check README for license info
    readme_files = ['README.md', 'README.txt', 'README']
    for readme_file in readme_files:
        readme_path = dataset_path / readme_file
        if readme_path.exists():
            try:
                with open(readme_path, 'r', encoding='utf-8', errors='ignore') as f:
                    readme_text = f.read()
                
                # Look for license section
                license_match = re.search(r'license[:\s]+([^\n]+)', readme_text, re.IGNORECASE)
                if license_match:
                    license_type = detect_license_type(license_match.group(1))
                    return readme_match.group(1), license_type
            except Exception:
                continue
    
    return None, 'unknown'

def detect_license_type(text: str) -> str:
    """
    Detect license type from text using pattern matching
    
    Assumption: License text contains recognizable patterns
    We match against common license patterns.
    """
    text_upper = text.upper()
    
    for license_type, pattern in LICENSE_PATTERNS.items():
        if re.search(pattern, text_upper, re.IGNORECASE):
            return license_type.lower()
    
    return 'unknown'

def count_files_in_directory(directory: Path, extensions: List[str] = None) -> int:
    """Count files in directory (optionally filtered by extension)"""
    if not directory.exists():
        return 0
    
    count = 0
    for item in directory.rglob('*'):
        if item.is_file():
            if extensions is None or item.suffix.lower() in extensions:
                count += 1
    
    return count

def extract_classes_from_dataset(dataset_path: str) -> List[str]:
    """
    Extract class names from dataset
    
    Assumption: Dataset may have data.yaml, classes.txt, or labels directory
    We check common locations for class information.
    """
    dataset_path = Path(dataset_path)
    classes = []
    
    # Check data.yaml
    yaml_path = dataset_path / 'data.yaml'
    if yaml_path.exists():
        try:
            import yaml
            with open(yaml_path, 'r') as f:
                data = yaml.safe_load(f)
                if 'names' in data:
                    classes = data['names'] if isinstance(data['names'], list) else list(data['names'].values())
        except Exception:
            pass
    
    # Check classes.txt
    classes_txt = dataset_path / 'classes.txt'
    if classes_txt.exists():
        try:
            with open(classes_txt, 'r') as f:
                classes = [line.strip() for line in f if line.strip()]
        except Exception:
            pass
    
    return classes

def process_dataset_source(source: str, source_name: str = None) -> Dict:
    """
    Process a single dataset source and extract manifest information
    
    Args:
        source: URL or local path to dataset
        source_name: Optional name for the source
    
    Returns:
        Manifest row dictionary
    """
    if source_name is None:
        source_name = Path(source).name if os.path.exists(source) else source
    
    manifest_row = {
        'source_name': source_name,
        'url': source if not os.path.exists(source) else str(Path(source).absolute()),
        'dataset_name': '',
        'file_count': 0,
        'classes_present': [],
        'license': 'unknown',
        'license_confidence': 'unknown',
        'notes': ''
    }
    
    # Determine source type
    if os.path.exists(source):
        # Local dataset
        dataset_path = Path(source)
        manifest_row['dataset_name'] = dataset_path.name
        manifest_row['url'] = str(dataset_path.absolute())
        
        # Count files
        manifest_row['file_count'] = count_files_in_directory(dataset_path, ['.jpg', '.jpeg', '.png', '.txt'])
        
        # Extract classes
        manifest_row['classes_present'] = extract_classes_from_dataset(source)
        
        # Check license
        license_text, license_type = check_local_license(source)
        manifest_row['license'] = license_type
        manifest_row['license_confidence'] = 'found' if license_text else 'unknown'
        if license_text:
            manifest_row['notes'] = f"License file found: {license_type}"
    
    elif 'kaggle.com' in source:
        # Kaggle dataset
        manifest_row['dataset_name'] = source.split('/')[-1]
        license_text, license_type = check_kaggle_license(source)
        manifest_row['license'] = license_type
        manifest_row['license_confidence'] = 'unknown'
        manifest_row['notes'] = "Kaggle dataset - license check requires API access"
    
    elif 'github.com' in source:
        # GitHub repository
        manifest_row['dataset_name'] = source.split('/')[-1].replace('.git', '')
        license_text, license_type = check_github_license(source)
        manifest_row['license'] = license_type
        manifest_row['license_confidence'] = 'found' if license_text else 'unknown'
        if license_text:
            manifest_row['notes'] = f"License from GitHub API: {license_type}"
        else:
            manifest_row['notes'] = "GitHub repo - license not found via API"
    
    else:
        # Unknown/URL source
        manifest_row['dataset_name'] = source.split('/')[-1]
        manifest_row['notes'] = "Unknown source type - manual license check required"
    
    return manifest_row

def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Check dataset manifest and licenses',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Check local datasets
  python check_manifest_and_license.py --sources dataset1 dataset2
  
  # Check URLs
  python check_manifest_and_license.py --sources https://github.com/user/repo https://www.kaggle.com/datasets/user/dataset
  
  # Use config file
  python check_manifest_and_license.py --config sources.json
        """
    )
    parser.add_argument('--sources', type=str, nargs='+',
                        help='List of dataset sources (paths or URLs)')
    parser.add_argument('--config', type=str,
                        help='JSON config file with sources list')
    parser.add_argument('--output-csv', type=str, default='dataset_manifest.csv',
                        help='Output CSV file (default: dataset_manifest.csv)')
    parser.add_argument('--output-warnings', type=str, default='license_warnings.txt',
                        help='Output warnings file (default: license_warnings.txt)')
    
    args = parser.parse_args()
    
    # Get sources
    sources = []
    if args.config:
        with open(args.config, 'r') as f:
            config = json.load(f)
            sources = config.get('sources', [])
    elif args.sources:
        sources = args.sources
    else:
        parser.error("Must provide --sources or --config")
    
    print(f"🔍 Processing {len(sources)} dataset sources...")
    
    # Process each source
    manifest_rows = []
    warnings = []
    
    for source in sources:
        print(f"\n📦 Processing: {source}")
        try:
            row = process_dataset_source(source)
            manifest_rows.append(row)
            
            # Check for license warnings
            license = row['license'].lower()
            if license == 'unknown':
                warnings.append(f"⚠️  {row['source_name']}: License unknown - manual check required")
            elif license not in PERMISSIVE_LICENSES and license not in NON_PERMISSIVE_LICENSES:
                warnings.append(f"⚠️  {row['source_name']}: License '{license}' - verify compatibility")
            elif license in NON_PERMISSIVE_LICENSES:
                warnings.append(f"⚠️  {row['source_name']}: Non-permissive license '{license}' - review restrictions")
            
            print(f"   License: {row['license']} ({row['license_confidence']})")
            print(f"   Classes: {', '.join(row['classes_present']) if row['classes_present'] else 'N/A'}")
            print(f"   Files: {row['file_count']}")
        
        except Exception as e:
            print(f"   ❌ Error processing {source}: {e}")
            warnings.append(f"❌ {source}: Error - {str(e)}")
    
    # Write manifest CSV
    if manifest_rows:
        with open(args.output_csv, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['source_name', 'url', 'dataset_name', 'file_count', 
                         'classes_present', 'license', 'license_confidence', 'notes']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            
            for row in manifest_rows:
                # Convert classes list to string
                row_copy = row.copy()
                row_copy['classes_present'] = ', '.join(row['classes_present']) if row['classes_present'] else ''
                writer.writerow(row_copy)
        
        print(f"\n✅ Manifest written to: {args.output_csv}")
    
    # Write warnings
    if warnings:
        with open(args.output_warnings, 'w', encoding='utf-8') as f:
            f.write("License Warnings\n")
            f.write("=" * 60 + "\n\n")
            for warning in warnings:
                f.write(warning + "\n")
        
        print(f"⚠️  Warnings written to: {args.output_warnings}")
        print(f"\n   Total warnings: {len(warnings)}")
    else:
        print("\n✅ No license warnings")
    
    print("\n✅ Manifest and license check complete!")

if __name__ == '__main__':
    main()

