# Docker Setup Guide for MargWatch ML Pipeline

## Overview

The ML pipeline now uses Docker for a completely isolated, reproducible environment that eliminates:
- SSL certificate issues
- Python version conflicts
- Dependency installation problems
- Platform-specific differences

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (usually included with Docker Desktop)

## Quick Start

### 1. Build the Docker Image

```bash
cd services/ml-service
docker-compose build
```

This will:
- Create a Python 3.10-slim base image
- Install all dependencies from `requirements.txt`
- Set up the working environment

### 2. Start the Container

```bash
docker-compose up -d
```

The container will run in the background and stay alive.

### 3. Verify Setup

```bash
docker exec -it margwatch-ml-pipeline python --version
docker exec -it margwatch-ml-pipeline pip list | grep -E "(ultralytics|pyyaml|Pillow)"
```

## Running Pipeline Steps

### Option A: Using Helper Scripts

**Linux/Mac/Git Bash:**
```bash
cd services/ml-service
./run_in_docker.sh "python services/ml-service/preprocess_dataset.py --create-smoke-sample smoke_dataset"
```

**Windows PowerShell:**
```powershell
cd services/ml-service
.\run_in_docker.ps1 "python services/ml-service/preprocess_dataset.py --create-smoke-sample smoke_dataset"
```

### Option B: Direct Docker Commands

```bash
docker exec -it margwatch-ml-pipeline bash -c "cd /workspace && python services/ml-service/preprocess_dataset.py --create-smoke-sample smoke_dataset"
```

### Option C: Interactive Shell

```bash
docker exec -it margwatch-ml-pipeline bash
# Then run commands normally
cd /workspace
python services/ml-service/preprocess_dataset.py --create-smoke-sample smoke_dataset
```

## Complete Pipeline Verification

Run the automated verification script:

```bash
cd services/ml-service
./verify_pipeline.sh
```

This will:
1. Create smoke sample dataset
2. Validate smoke sample (dry-run)
3. Run smoke training
4. Generate all output files

## File Locations

### Inside Container
- Project root: `/workspace`
- ML service: `/workspace/services/ml-service`
- Outputs: `/app/outputs`
- Data: `/app/data`
- Models: `/app/models`

### On Host Machine
- Project root: `D:/code/VCS/MargWatch`
- Outputs: `services/ml-service/outputs/`
- Data: `services/ml-service/data/`
- Models: `services/ml-service/models/`

## Common Tasks

### Check Manifest and Licenses
```bash
docker exec -it margwatch-ml-pipeline bash -c "cd /workspace && python services/ml-service/check_manifest_and_license.py --sources 'dataset1,dataset2'"
```

### Preprocess Dataset (Dry-Run)
```bash
docker exec -it margwatch-ml-pipeline bash -c "cd /workspace && python services/ml-service/preprocess_dataset.py /path/to/dataset --all --dry-run"
```

### Train Model
```bash
docker exec -it margwatch-ml-pipeline bash -c "cd /workspace && python services/ml-service/train_yolov8_seg.py --data-yaml data.yaml --epochs 200 --seed 42"
```

### View Logs
```bash
docker-compose logs -f
```

### Stop Container
```bash
docker-compose down
```

### Rebuild After Changes
```bash
docker-compose build --no-cache
docker-compose up -d
```

## Troubleshooting

### Container Won't Start
```bash
docker-compose logs
docker-compose down
docker-compose up -d
```

### Permission Issues
If you get permission errors, ensure Docker has access to the mounted volumes.

### Out of Disk Space
```bash
docker system prune -a  # Remove unused images/containers
```

### Update Dependencies
1. Edit `requirements.txt`
2. Rebuild: `docker-compose build --no-cache`
3. Restart: `docker-compose up -d`

## Benefits Over Venv

✅ **No SSL Issues** - Docker handles all networking
✅ **Consistent Environment** - Same on all machines
✅ **Isolated** - No conflicts with system Python
✅ **Reproducible** - Exact same dependencies every time
✅ **Easy Cleanup** - Just remove container/image
✅ **Cross-Platform** - Works identically on Windows/Mac/Linux

## Migration from Venv

The old `dev/` venv has been removed. All commands now run in Docker.

**Old way:**
```bash
dev/bin/python.exe services/ml-service/preprocess_dataset.py ...
```

**New way:**
```bash
docker exec -it margwatch-ml-pipeline bash -c "cd /workspace && python services/ml-service/preprocess_dataset.py ..."
```

Or use the helper scripts for convenience.


