"""
Pydantic schemas for the Knowledge Graph REST API.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class EntityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    entity_type: str
    value: str
    normalized_value: str
    confidence: float | None
    first_seen: datetime | None
    last_seen: datetime | None
    created_at: datetime | None
    properties: dict[str, Any]


class RelationshipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    source_entity_id: str
    target_entity_id: str
    relationship_type: str
    provenance: str
    evidence_id: str
    confidence: float | None
    created_at: datetime | None
    properties: dict[str, Any]


class GraphResponse(BaseModel):
    nodes: list[EntityResponse]
    edges: list[RelationshipResponse]


class GraphSummaryResponse(BaseModel):
    total_nodes: int
    total_edges: int
    entity_counts_by_type: dict[str, int]
    relationship_counts_by_type: dict[str, int]
