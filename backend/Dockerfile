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
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY backend/ .

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

# Expose the port that the application listens on.
# Only relevant for the web service; the worker binds no port.
EXPOSE 8000

# Default command — used only for local development (docker-compose).
# On Railway, each service overrides this via its dashboard Start Command:
#   web    -> sh -c "./start.sh"
#   worker -> sh -c "./start-worker.sh"
CMD ["sh", "-c", "./start.sh"]
