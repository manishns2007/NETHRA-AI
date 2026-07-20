#!/bin/bash
set -e

echo "Running Alembic migrations..."
alembic upgrade head

echo "Starting Celery worker in the background..."
celery -A app.core.celery_app worker --loglevel=info &

echo "Starting Uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
