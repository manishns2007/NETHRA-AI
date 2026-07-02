"""
REST API routes for Knowledge Graph Analysis.
Provides advanced graph algorithms via NetworkX.
"""
from __future__ import annotations

import time
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.graph import Entity
from app.graph import queries
from app.graph import analysis
from app.schemas.analysis import (
    AnalysisResponse, AnalysisMetadata, SharedEntitiesRequest,
    CentralityItem, ShortestPathResponse, CorrelationResponse,
    GraphStatsResponse
)
from app.schemas.graph import EntityResponse

router = APIRouter()


def _get_entities_by_ids(db: Session, entity_ids: list[str]) -> dict[str, Entity]:
    """Helper to bulk fetch entities by ID."""
    if not entity_ids:
        return {}
    entities = db.query(Entity).filter(Entity.id.in_(entity_ids)).all()
    return {e.id: e for e in entities}


def _build_metadata(start_time: float, G: any, algorithm_name: str) -> AnalysisMetadata:
    """Helper to construct standard metadata."""
    execution_time_ms = (time.time() - start_time) * 1000
    return AnalysisMetadata(
        execution_time_ms=execution_time_ms,
        graph_node_count=G.number_of_nodes() if G else 0,
        graph_edge_count=G.number_of_edges() if G else 0,
        algorithm_used=algorithm_name
    )


@router.post("/shared-entities", response_model=AnalysisResponse[list[EntityResponse]], summary="Find shared entities")
def shared_entities(
    request: SharedEntitiesRequest = Body(...),
    db: Session = Depends(get_db)
):
    """Find entities that appear in ALL specified evidence items."""
    start_time = time.time()
    
    G = queries.build_networkx_graph(db)
    if G is None:
        raise HTTPException(status_code=500, detail="Graph analysis unavailable (networkx not installed)")
        
    shared_ids = analysis.get_shared_entities(G, request.evidence_ids)
    
    entities_map = _get_entities_by_ids(db, shared_ids)
    result_entities = [entities_map[eid] for eid in shared_ids if eid in entities_map]
    
    metadata = _build_metadata(start_time, G, "shared_entity_intersection")
    
    return AnalysisResponse(data=result_entities, metadata=metadata)


@router.get("/components", response_model=AnalysisResponse[list[list[EntityResponse]]], summary="Connected components")
def connected_components(db: Session = Depends(get_db)):
    """Get all connected components in the graph."""
    start_time = time.time()
    
    G = queries.build_networkx_graph(db)
    if G is None:
        raise HTTPException(status_code=500, detail="Graph analysis unavailable")
        
    components = analysis.get_connected_components(G)
    
    # Collect all needed entity IDs
    all_ids = set()
    for comp in components:
        all_ids.update(comp)
        
    entities_map = _get_entities_by_ids(db, list(all_ids))
    
    result = []
    for comp in components:
        comp_entities = [entities_map[eid] for eid in comp if eid in entities_map]
        result.append(comp_entities)
        
    metadata = _build_metadata(start_time, G, "weakly_connected_components")
    
    return AnalysisResponse(data=result, metadata=metadata)


@router.get("/centrality", response_model=AnalysisResponse[list[CentralityItem]], summary="Degree centrality")
def degree_centrality(
    top_k: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get the most connected entities."""
    start_time = time.time()
    
    G = queries.build_networkx_graph(db)
    if G is None:
        raise HTTPException(status_code=500, detail="Graph analysis unavailable")
        
    centrality_results = analysis.get_degree_centrality(G, top_k=top_k)
    
    entity_ids = [item[0] for item in centrality_results]
    entities_map = _get_entities_by_ids(db, entity_ids)
    
    result = []
    for eid, score in centrality_results:
        if eid in entities_map:
            result.append(CentralityItem(entity=entities_map[eid], score=score))
            
    metadata = _build_metadata(start_time, G, "degree_centrality_undirected")
    
    return AnalysisResponse(data=result, metadata=metadata)


@router.get("/shortest-path", response_model=AnalysisResponse[ShortestPathResponse], summary="Shortest path")
def shortest_path(
    source_id: str = Query(..., description="Source entity ID"),
    target_id: str = Query(..., description="Target entity ID"),
    db: Session = Depends(get_db)
):
    """Find the shortest path between two entities (undirected)."""
    start_time = time.time()
    
    G = queries.build_networkx_graph(db)
    if G is None:
        raise HTTPException(status_code=500, detail="Graph analysis unavailable")
        
    path_ids = analysis.get_shortest_path(G, source_id, target_id)
    if path_ids is None:
        raise HTTPException(status_code=404, detail="No path found between the specified entities")
        
    entities_map = _get_entities_by_ids(db, path_ids)
    
    # Preserve path order
    path_entities = [entities_map[eid] for eid in path_ids if eid in entities_map]
    
    metadata = _build_metadata(start_time, G, "shortest_path_undirected")
    
    return AnalysisResponse(data=ShortestPathResponse(path=path_entities), metadata=metadata)


@router.get("/correlation/{entity_id}", response_model=AnalysisResponse[CorrelationResponse], summary="Cross-evidence correlation")
def cross_evidence_correlation(entity_id: str, db: Session = Depends(get_db)):
    """Find other evidence items connected to an entity and their other connections."""
    start_time = time.time()
    
    G = queries.build_networkx_graph(db)
    if G is None:
        raise HTTPException(status_code=500, detail="Graph analysis unavailable")
        
    source_entity = db.query(Entity).filter(Entity.id == entity_id).first()
    if not source_entity:
        raise HTTPException(status_code=404, detail="Source entity not found")
        
    correlations = analysis.get_cross_evidence_correlation(G, entity_id)
    
    # Collect all needed entity IDs
    all_ids = set()
    for corr in correlations:
        all_ids.update(corr["entities"])
        
    entities_map = _get_entities_by_ids(db, list(all_ids))
    
    result_correlations = []
    for corr in correlations:
        hydrated_entities = [entities_map[eid] for eid in corr["entities"] if eid in entities_map]
        result_correlations.append({
            "evidence_id": corr["evidence_id"],
            "entities": hydrated_entities
        })
        
    data = CorrelationResponse(source_entity=source_entity, connected_evidence=result_correlations)
    metadata = _build_metadata(start_time, G, "cross_evidence_correlation")
    
    return AnalysisResponse(data=data, metadata=metadata)


@router.get("/stats", response_model=AnalysisResponse[GraphStatsResponse], summary="Graph statistics")
def graph_stats(db: Session = Depends(get_db)):
    """Get high-level network statistics."""
    start_time = time.time()
    
    G = queries.build_networkx_graph(db)
    if G is None:
        raise HTTPException(status_code=500, detail="Graph analysis unavailable")
        
    stats = analysis.get_graph_stats(G)
    data = GraphStatsResponse(**stats)
    
    metadata = _build_metadata(start_time, G, "network_statistics")
    
    return AnalysisResponse(data=data, metadata=metadata)
