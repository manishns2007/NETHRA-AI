"""
graph/dedup.py — Entity deduplication for NETHRA AI Knowledge Graph.

All entity uniqueness is determined by (entity_type, normalized_value).
- If the entity already exists: update last_seen, update confidence if the
  new confidence is higher.
- If the entity is new: insert it.

This module never calls db.commit() — callers own the transaction boundary.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.graph import Entity
from app.graph.normalizer import normalize_entity

logger = logging.getLogger(__name__)


def _now() -> datetime:
    return datetime.now(tz=timezone.utc)


def get_or_create_entity(
    db: Session,
    entity_type: str,
    value: str,
    confidence: float | None = None,
    properties: dict | None = None,
) -> Entity:
    """
    Return an existing Entity node or create a new one.

    Uses (entity_type, normalized_value) as the uniqueness key so that
    identical entities extracted from different evidence items share the
    same graph node.

    - first_seen is set only on creation.
    - last_seen is always updated to now.
    - confidence is updated only if the incoming value is higher.
    - properties dict is merged (new keys win) on collision.

    Args:
        db:          SQLAlchemy Session (caller manages commit).
        entity_type: Entity type string (e.g. 'PERSON', 'EMAIL').
        value:       Raw extracted text.
        confidence:  Extraction confidence score (0.0 – 1.0).
        properties:  Optional extra key/value pairs (for OSINT enrichment).

    Returns:
        The resolved or newly created Entity ORM object.
    """
    normalized = normalize_entity(entity_type, value)

    existing: Entity | None = (
        db.query(Entity)
        .filter(
            Entity.entity_type == entity_type,
            Entity.normalized_value == normalized,
        )
        .first()
    )

    if existing:
        # Update last_seen
        existing.last_seen = _now()

        # Confidence: keep the highest seen value
        if confidence is not None:
            if existing.confidence is None or confidence > existing.confidence:
                existing.confidence = confidence

        # Merge properties (new keys overwrite existing ones)
        if properties:
            merged = dict(existing.properties or {})
            merged.update(properties)
            existing.properties = merged

        logger.debug(
            "dedup: reused entity [%s] %r (id=%s)", entity_type, normalized, existing.id
        )
        return existing

    # Create new entity
    now = _now()
    entity = Entity(
        entity_type=entity_type,
        value=value,
        normalized_value=normalized,
        confidence=confidence,
        first_seen=now,
        last_seen=now,
        properties=properties or {},
    )
    db.add(entity)
    db.flush()  # Flush to get the auto-generated id without committing

    logger.debug(
        "dedup: created entity [%s] %r (id=%s)", entity_type, normalized, entity.id
    )
    return entity
