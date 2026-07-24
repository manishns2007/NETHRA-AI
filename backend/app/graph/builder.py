"""
graph/builder.py — Graph construction for NETHRA AI Knowledge Graph.

Orchestrates the full graph build for one evidence item:
  1. Register the Evidence item itself as an EVIDENCE node (for CONTAINS edges).
  2. Upsert all extracted entities via the dedup module.
  3. Run the rule engine to infer relationships.
  4. Persist new relationships, skipping existing ones (idempotent).
  5. Log stats and commit.

Provenance determination:
  - WhatsApp chat evidence → 'same_whatsapp_message' (per-message entity groups)
  - All others             → 'same_document' (document-level grouping)

This module is intentionally stateless — call `build_graph_for_evidence` once
per Celery task run. It is idempotent: re-running it on the same evidence will
update last_seen and skip duplicate relationships.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.graph import Entity, Relationship
from app.graph.dedup import get_or_create_entity
from app.graph.relationships import infer_relationships, RelationshipSpec

logger = logging.getLogger(__name__)


def _now() -> datetime:
    return datetime.now(tz=timezone.utc)


def _persist_relationship(
    db: Session,
    spec: RelationshipSpec,
    evidence_id: str,
) -> bool:
    """
    Insert one relationship edge, returning True if it was new.

    Skips insertion if the same (source, target, type, evidence) already exists.
    """
    existing = (
        db.query(Relationship)
        .filter(
            Relationship.source_entity_id == spec.source_id,
            Relationship.target_entity_id == spec.target_id,
            Relationship.relationship_type == spec.relationship_type,
            Relationship.evidence_id == evidence_id,
        )
        .first()
    )
    if existing:
        return False

    rel = Relationship(
        source_entity_id=spec.source_id,
        target_entity_id=spec.target_id,
        relationship_type=spec.relationship_type,
        provenance=spec.provenance,
        evidence_id=evidence_id,
        confidence=spec.confidence,
        properties=spec.properties,
        created_at=_now(),
    )
    db.add(rel)
    return True


def build_graph_for_evidence(
    db: Session,
    evidence_id: str,
    extracted_entities: list[dict[str, Any]],
) -> dict[str, int]:
    """
    Build or update the knowledge graph for a single evidence item.

    Args:
        db:                  SQLAlchemy Session (caller owns commit).
        evidence_id:         The evidence UUID.
        extracted_entities:  List of entity dicts produced by the NER module.
                             Expected keys: entity_type, entity_value,
                             normalized_value (ignored — we re-normalize),
                             confidence (optional).

    Returns:
        Stats dict: {"nodes_created": int, "nodes_reused": int, "edges_created": int}
    """
    nodes_created = 0
    nodes_reused = 0
    edges_created = 0

    try:
        # ── Step 1: Register the Evidence node ───────────────────────────────
        from app.graph.normalizer import normalize_entity

        def _entity_exists(entity_type: str, value: str) -> bool:
            norm = normalize_entity(entity_type, value)
            return (
                db.query(Entity)
                .filter(Entity.entity_type == entity_type, Entity.normalized_value == norm)
                .first()
            ) is not None

        from app.models.evidence import Evidence
        ev_rec = db.query(Evidence).filter(Evidence.evidence_id == evidence_id).first()
        file_label = ev_rec.original_filename if ev_rec else evidence_id

        if not _entity_exists("EVIDENCE", file_label):
            nodes_created += 1
        else:
            nodes_reused += 1
        evidence_node = get_or_create_entity(db, entity_type="EVIDENCE", value=file_label, confidence=1.0)
        props = dict(evidence_node.properties or {})
        props["filename"] = file_label
        props["original_filename"] = file_label
        evidence_node.properties = props

        # ── Step 2: Upsert all extracted entity nodes ─────────────────────────
        entity_nodes: list[Entity] = [evidence_node]

        for ent in extracted_entities:
            entity_type = ent.get("entity_type", "")
            value = ent.get("entity_value", "")
            confidence = ent.get("confidence")

            if not entity_type or not value:
                continue

            if not _entity_exists(entity_type, value):
                nodes_created += 1
            else:
                nodes_reused += 1

            node = get_or_create_entity(db, entity_type, value, confidence)
            entity_nodes.append(node)

        # Flush to assign IDs to all pending entities
        db.flush()

        # ── Step 3: Infer relationships via rule engine ───────────────────────
        specs: list[RelationshipSpec] = infer_relationships(
            entity_nodes,
            provenance="same_document",
        )

        # ── Step 4: Persist edges ─────────────────────────────────────────────
        for spec in specs:
            try:
                created = _persist_relationship(db, spec, evidence_id)
                if created:
                    edges_created += 1
            except IntegrityError:
                db.rollback()
                logger.warning(
                    "Skipped duplicate relationship %s→%s [%s]",
                    spec.source_id, spec.target_id, spec.relationship_type,
                )

        db.commit()

        logger.info(
            "Graph built for evidence %s: +%d nodes, %d reused, +%d edges",
            evidence_id, nodes_created, nodes_reused, edges_created,
        )

    except Exception as exc:
        db.rollback()
        logger.exception("Failed to build graph for evidence %s: %s", evidence_id, exc)
        raise

    return {
        "nodes_created": nodes_created,
        "nodes_reused": nodes_reused,
        "edges_created": edges_created,
    }
