"""
REST API routes for the NETHRA AI Knowledge Graph.

Endpoints:
  GET /api/v1/graph                         – full graph (paginated)
  GET /api/v1/graph/summary                 – node/edge stats
  GET /api/v1/graph/search?q=               – entity search
  GET /api/v1/graph/evidence/{evidence_id}  – subgraph for one evidence
  GET /api/v1/graph/{entity_id}             – entity + adjacent nodes/edges

Note: /graph/summary and /graph/search and /graph/evidence/{id} are defined
BEFORE /graph/{entity_id} so FastAPI routes them correctly (specific before general).
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.graph import EntityResponse, GraphResponse, GraphSummaryResponse
from app.graph import queries

router = APIRouter()


@router.get("/summary", response_model=GraphSummaryResponse, summary="Graph statistics")
def graph_summary(db: Session = Depends(get_db)):
    """Return high-level statistics: total nodes, edges, counts by type."""
    return queries.get_graph_summary(db)


@router.get("/search", response_model=list[EntityResponse], summary="Search entities")
def search_entities(
    q: str = Query(..., min_length=1, description="Search term"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Full-text search over entity values and normalized values."""
    results = queries.search_entities(db, q=q, limit=limit)
    return results


@router.get(
    "/evidence/{evidence_id}",
    response_model=GraphResponse,
    summary="Subgraph for one evidence item",
)
def evidence_subgraph(evidence_id: str, db: Session = Depends(get_db)):
    """Return all nodes and edges linked to a specific evidence item."""
    result = queries.get_evidence_subgraph(db, evidence_id=evidence_id)
    return result


@router.get("/{entity_id}", response_model=GraphResponse, summary="Entity neighbourhood")
def entity_subgraph(entity_id: str, db: Session = Depends(get_db)):
    """Return an entity and all its directly connected nodes and edges."""
    result = queries.get_entity_subgraph(db, entity_id=entity_id)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Entity {entity_id!r} not found")
    return result


@router.get("", response_model=GraphResponse, summary="Full knowledge graph")
def full_graph(
    limit_nodes: int = Query(500, ge=1, le=5000),
    limit_edges: int = Query(2000, ge=1, le=10000),
    db: Session = Depends(get_db),
):
    """Return the full graph (with configurable safety limits)."""
    return queries.get_full_graph(db, limit_nodes=limit_nodes, limit_edges=limit_edges)
