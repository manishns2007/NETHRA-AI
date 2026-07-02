"""
Pydantic schemas for the Knowledge Graph Analysis API.
"""
from __future__ import annotations

from typing import Any, Generic, TypeVar
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.graph import EntityResponse

T = TypeVar("T")

class AnalysisMetadata(BaseModel):
    """Metadata included in all analysis responses."""
    execution_time_ms: float
    graph_node_count: int
    graph_edge_count: int
    algorithm_used: str

class AnalysisResponse(BaseModel, Generic[T]):
    """Generic wrapper for analysis responses with metadata."""
    data: T
    metadata: AnalysisMetadata

class SharedEntitiesRequest(BaseModel):
    evidence_ids: list[str] = Field(..., min_length=2, description="List of evidence IDs to find shared entities across")

class CentralityItem(BaseModel):
    entity: EntityResponse
    score: float

class ShortestPathResponse(BaseModel):
    path: list[EntityResponse]

class CorrelationResponse(BaseModel):
    source_entity: EntityResponse
    connected_evidence: list[dict[str, Any]] # e.g. [{"evidence_id": "...", "entities": [...]}]

class GraphStatsResponse(BaseModel):
    density: float
    average_degree: float
    num_connected_components: int
