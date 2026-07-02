"""
REST API routes for Threat Intelligence Enrichment.

Endpoints:
  GET  /api/v1/enrichment/providers                  – registered providers list
  GET  /api/v1/enrichment/entity/{entity_id}         – enrichment data for entity
  GET  /api/v1/enrichment/entity/{entity_id}/status  – enrichment status
  POST /api/v1/enrichment/entity/{entity_id}/refresh – queue enrichment for entity
  POST /api/v1/enrichment/evidence/{evidence_id}/refresh – queue enrichment for entire evidence
"""
from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.graph import Entity
from app.enrichment import dispatcher
from app.enrichment.tasks import enrich_entity_task, enrich_evidence_task
from app.enrichment.service import get_entities_for_evidence

logger = logging.getLogger(__name__)

router = APIRouter()

# Keys that are structural or non-enrichment metadata in Entity.properties
_NON_ENRICHMENT_KEYS: set[str] = set()


def _extract_enrichment(entity: Entity) -> dict[str, Any]:
    """Return only enrichment provider namespaces from entity.properties."""
    props = entity.properties or {}
    return {k: v for k, v in props.items() if k not in _NON_ENRICHMENT_KEYS}


@router.get("/providers", summary="List registered enrichment providers")
def list_providers():
    """Return all registered providers and their supported entity types."""
    return dispatcher.get_registered_providers()


@router.get(
    "/entity/{entity_id}",
    summary="Get enrichment data for an entity",
)
def get_entity_enrichment(entity_id: str, db: Session = Depends(get_db)):
    """
    Return the current enrichment data stored in Entity.properties.
    If no enrichment has run yet, returns empty data with NOT_ENRICHED status.
    """
    entity = db.query(Entity).filter(Entity.id == entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail=f"Entity {entity_id!r} not found")

    enrichment_data = _extract_enrichment(entity)
    status = "ENRICHED" if enrichment_data else "NOT_ENRICHED"

    return {
        "entity_id": entity_id,
        "entity_type": entity.entity_type,
        "value": entity.value,
        "status": status,
        "enrichment": enrichment_data,
    }


@router.get(
    "/entity/{entity_id}/status",
    summary="Get enrichment status for an entity",
)
def get_entity_enrichment_status(entity_id: str, db: Session = Depends(get_db)):
    """
    Returns the enrichment status and which providers have data for this entity.
    """
    entity = db.query(Entity).filter(Entity.id == entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail=f"Entity {entity_id!r} not found")

    enrichment_data = _extract_enrichment(entity)
    enriched_providers = list(enrichment_data.keys())

    return {
        "entity_id": entity_id,
        "entity_type": entity.entity_type,
        "value": entity.value,
        "status": "ENRICHED" if enriched_providers else "NOT_ENRICHED",
        "enriched_providers": enriched_providers,
    }


@router.post(
    "/entity/{entity_id}/refresh",
    status_code=202,
    summary="Queue enrichment for an entity",
)
def refresh_entity_enrichment(entity_id: str, db: Session = Depends(get_db)):
    """
    Enqueues a Celery enrichment task for the specified entity.
    Returns immediately with 202 Accepted.
    """
    entity = db.query(Entity).filter(Entity.id == entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail=f"Entity {entity_id!r} not found")

    task = enrich_entity_task.delay(entity_id)
    logger.info(f"Enrichment queued for entity {entity_id} (task_id={task.id})")

    return {
        "status": "QUEUED",
        "entity_id": entity_id,
        "task_id": task.id,
        "message": f"Enrichment task queued for entity {entity_id!r}",
    }


@router.post(
    "/evidence/{evidence_id}/refresh",
    status_code=202,
    summary="Queue enrichment for all entities in an evidence item",
)
def refresh_evidence_enrichment(evidence_id: str, db: Session = Depends(get_db)):
    """
    Enqueues a Celery enrichment task for every entity extracted from this evidence.
    Returns immediately with 202 Accepted.
    """
    entity_ids = get_entities_for_evidence(db, evidence_id)
    if not entity_ids:
        raise HTTPException(
            status_code=404,
            detail=f"No entities found for evidence {evidence_id!r}"
        )

    task = enrich_evidence_task.delay(evidence_id)
    logger.info(f"Enrichment queued for evidence {evidence_id} (task_id={task.id})")

    return {
        "status": "QUEUED",
        "evidence_id": evidence_id,
        "task_id": task.id,
        "entity_count": len(entity_ids),
        "message": f"Enrichment tasks queued for {len(entity_ids)} entities from evidence {evidence_id!r}",
    }
