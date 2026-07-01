"""
graph/queries.py — Read-side queries for the NETHRA AI Knowledge Graph.

All queries operate against SQLite (source of truth).
NetworkX graph construction is available on-demand for algorithms.
"""
from __future__ import annotations

import logging
from typing import Any

from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.models.graph import Entity, Relationship

logger = logging.getLogger(__name__)


# ── Full graph ────────────────────────────────────────────────────────────────

def get_full_graph(
    db: Session,
    limit_nodes: int = 500,
    limit_edges: int = 2000,
) -> dict[str, Any]:
    """Return all nodes and edges (with safe upper limits)."""
    nodes = db.query(Entity).limit(limit_nodes).all()
    edges = db.query(Relationship).limit(limit_edges).all()
    return {"nodes": nodes, "edges": edges}


# ── Single entity subgraph ────────────────────────────────────────────────────

def get_entity_subgraph(db: Session, entity_id: str) -> dict[str, Any] | None:
    """
    Return an entity and all relationships where it is source or target,
    along with the adjacent entity nodes.
    """
    entity = db.query(Entity).filter(Entity.id == entity_id).first()
    if not entity:
        return None

    edges = (
        db.query(Relationship)
        .filter(
            or_(
                Relationship.source_entity_id == entity_id,
                Relationship.target_entity_id == entity_id,
            )
        )
        .all()
    )

    # Collect adjacent node IDs
    adjacent_ids: set[str] = set()
    for edge in edges:
        adjacent_ids.add(edge.source_entity_id)
        adjacent_ids.add(edge.target_entity_id)
    adjacent_ids.discard(entity_id)

    adjacent_nodes = (
        db.query(Entity).filter(Entity.id.in_(adjacent_ids)).all()
        if adjacent_ids else []
    )

    return {
        "nodes": [entity] + adjacent_nodes,
        "edges": edges,
    }


# ── Evidence subgraph ─────────────────────────────────────────────────────────

def get_evidence_subgraph(db: Session, evidence_id: str) -> dict[str, Any]:
    """
    Return all relationships (and their entities) for a specific evidence item.
    """
    edges = (
        db.query(Relationship)
        .filter(Relationship.evidence_id == evidence_id)
        .all()
    )

    # Gather all entity IDs referenced in this evidence's edges
    entity_ids: set[str] = set()
    for edge in edges:
        entity_ids.add(edge.source_entity_id)
        entity_ids.add(edge.target_entity_id)

    nodes = (
        db.query(Entity).filter(Entity.id.in_(entity_ids)).all()
        if entity_ids else []
    )

    return {"nodes": nodes, "edges": edges}


# ── Search ────────────────────────────────────────────────────────────────────

def search_entities(db: Session, q: str, limit: int = 50) -> list[Entity]:
    """
    Full-text search over entity value and normalized_value.
    Returns up to *limit* matching Entity rows.
    """
    pattern = f"%{q}%"
    return (
        db.query(Entity)
        .filter(
            or_(
                Entity.value.ilike(pattern),
                Entity.normalized_value.ilike(pattern),
            )
        )
        .limit(limit)
        .all()
    )


# ── Graph summary ─────────────────────────────────────────────────────────────

def get_graph_summary(db: Session) -> dict[str, Any]:
    """
    Return high-level statistics about the graph.
    Used by the investigation dashboard.
    """
    total_nodes = db.query(func.count(Entity.id)).scalar() or 0
    total_edges = db.query(func.count(Relationship.id)).scalar() or 0

    # Count by entity type
    type_counts_raw = (
        db.query(Entity.entity_type, func.count(Entity.id))
        .group_by(Entity.entity_type)
        .all()
    )
    entity_counts_by_type = {row[0]: row[1] for row in type_counts_raw}

    # Count by relationship type
    rel_type_counts_raw = (
        db.query(Relationship.relationship_type, func.count(Relationship.id))
        .group_by(Relationship.relationship_type)
        .all()
    )
    relationship_counts_by_type = {row[0]: row[1] for row in rel_type_counts_raw}

    return {
        "total_nodes": total_nodes,
        "total_edges": total_edges,
        "entity_counts_by_type": entity_counts_by_type,
        "relationship_counts_by_type": relationship_counts_by_type,
    }


# ── NetworkX (on-demand) ──────────────────────────────────────────────────────

def build_networkx_graph(db: Session):
    """
    Build a NetworkX DiGraph from SQLite on-demand.
    Used for graph algorithms (centrality, shortest paths, community detection).
    Returns None if networkx is not installed.
    """
    try:
        import networkx as nx
    except ImportError:
        logger.warning("networkx not installed; skipping nx graph construction")
        return None

    G = nx.DiGraph()
    nodes = db.query(Entity).all()
    edges = db.query(Relationship).all()

    for node in nodes:
        G.add_node(node.id, entity_type=node.entity_type, value=node.value, normalized_value=node.normalized_value)

    for edge in edges:
        G.add_edge(
            edge.source_entity_id,
            edge.target_entity_id,
            relationship_type=edge.relationship_type,
            provenance=edge.provenance,
            confidence=edge.confidence,
            evidence_id=edge.evidence_id,
        )

    logger.info("NetworkX graph built: %d nodes, %d edges", G.number_of_nodes(), G.number_of_edges())
    return G
