"""
Celery application factory for NETHRA AI background task processing.

The Celery app uses Redis as both message broker and result backend.
All processing tasks are automatically discovered from the
`app.services.processing` package.

Redis connection details are injected via `app.core.config.Settings`,
so they can be overridden at runtime through environment variables
without touching source code.
"""
from celery import Celery

from app.core.config import settings


def create_celery_app() -> Celery:
    """
    Create and configure the Celery application instance.

    Returns:
        Celery: A fully configured Celery application ready to accept tasks.
    """
    celery_app = Celery(
        "nethra_ai",
        broker=settings.CELERY_BROKER_URL,
        backend=settings.CELERY_RESULT_BACKEND,
    )

    celery_app.conf.update(
        # Task serialization
        task_serializer="json",
        result_serializer="json",
        accept_content=["json"],

        # Timezone
        timezone="UTC",
        enable_utc=True,

        # Task routing – all processing tasks use the 'processing' queue
        task_default_queue="processing",

        # Retry configuration – avoid infinite loops on transient errors
        task_acks_late=True,
        task_reject_on_worker_lost=True,
        task_max_retries=3,

        # Result expiry – keep results for 24 h (sufficient for UI polling)
        result_expires=86400,

        # Autodiscover tasks from the processing services package
        # Additional task modules can be listed here as the platform grows
        include=["app.services.processing.pipeline"],
    )

    return celery_app


celery_app: Celery = create_celery_app()
