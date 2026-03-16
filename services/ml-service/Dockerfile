FROM python:3.10-slim

WORKDIR /workspace

# More reliable apt-get with retry and no recommends
RUN apt-get update || apt-get update && \
    apt-get install -y --no-install-recommends \
      build-essential \
      curl \
      git \
      libgl1 \
      libglib2.0-0 && \
    rm -rf /var/lib/apt/lists/*

RUN python -m pip install --upgrade pip setuptools wheel

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/outputs /app/data /app/models

ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

CMD ["bash"]
