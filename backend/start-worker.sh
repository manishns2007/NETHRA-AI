#!/bin/bash
set -e

echo "Starting Celery worker..."
exec celery -A app.core.celery_app worker --loglevel=info --queues=processing,celery --concurrency=2
