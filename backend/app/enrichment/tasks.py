"""
Celery tasks for asynchronous Threat Intelligence enrichment.
"""
import logging
from celery import shared_task
from sqlalchemy.orm import Session

from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.enrichment import service

logger = logging.getLogger(__name__)


@celery_app.task(
    name="enrichment.enrich_entity",
    bind=True,
    max_retries=3,
    default_retry_delay=30,
    acks_late=True,
)
def enrich_entity_task(self, entity_id: str):
    """
    Background task to enrich a single entity by running all applicable providers.
    """
    logger.info(f"Enrichment queued for entity {entity_id}")
    db: Session = SessionLocal()
    try:
        updated = service.process_entity_enrichment(db, entity_id)
        if updated:
            logger.info(f"Enrichment completed for entity {entity_id}")
        else:
            logger.info(f"No enrichment data produced for entity {entity_id}")
        return {"entity_id": entity_id, "enriched": updated}
    except Exception as exc:
        logger.error(f"Enrichment task failed for entity {entity_id}: {exc}")
        try:
            raise self.retry(exc=exc)
        except self.MaxRetriesExceededError:
            logger.error(f"Max retries exceeded for enrichment of entity {entity_id}")
            return {"entity_id": entity_id, "enriched": False, "error": str(exc)}
    finally:
        db.close()


@celery_app.task(
    name="enrichment.enrich_evidence",
    bind=True,
    acks_late=True,
)
def enrich_evidence_task(self, evidence_id: str):
    """
    Background task to queue enrichment for every entity in a given evidence item.
    """
    logger.info(f"Enrichment queued for evidence {evidence_id}")
    db: Session = SessionLocal()
    try:
        entity_ids = service.get_entities_for_evidence(db, evidence_id)
        logger.info(f"Found {len(entity_ids)} entities for evidence {evidence_id}")

        for entity_id in entity_ids:
            enrich_entity_task.delay(entity_id)
            logger.info(f"Queued enrichment task for entity {entity_id} (evidence {evidence_id})")

        return {"evidence_id": evidence_id, "queued_entities": len(entity_ids)}
    except Exception as exc:
        logger.error(f"Enrichment evidence task failed for {evidence_id}: {exc}")
        return {"evidence_id": evidence_id, "error": str(exc)}
    finally:
        db.close()
