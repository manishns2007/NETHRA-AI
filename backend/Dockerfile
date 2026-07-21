FROM python:3.11-slim-bookworm

# Prevent Python from writing pyc files to disc and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set the working directory
WORKDIR /app

# Install system dependencies required for OCR, PDF processing, and python-magic
# Use HTTPS for apt to prevent 403 Forbidden errors on some network proxies
RUN sed -i 's/http:/https:/g' /etc/apt/sources.list.d/debian.sources && \
    apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    poppler-utils \
    libmagic1 \
    build-essential \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Fix Windows CRLF line endings and ensure start.sh is executable
RUN apt-get update && apt-get install -y dos2unix \
    && dos2unix start.sh start-worker.sh \
    && chmod +x start.sh start-worker.sh

# Create a non-root user and set permissions
RUN useradd -m -d /app appuser && \
    mkdir -p /app/uploads && \
    chown -R appuser:appuser /app

# Switch to the non-root user
USER appuser

# Expose the port that the application listens on
EXPOSE 8000

# Add a healthcheck to ensure the service is running
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl --fail http://localhost:${PORT:-8000}/health || exit 1

# Default command for the Web Service
# This can be overridden by the orchestrator for the Celery worker
CMD ["sh", "-c", "./start.sh"]
