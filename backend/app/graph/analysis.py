"""
graph/analysis.py — Advanced graph algorithms using NetworkX.

This module provides read-only analysis functions for the NETHRA AI Knowledge Graph.
It expects a NetworkX DiGraph (typically constructed by queries.build_networkx_graph).
Functions return node IDs or structural data, which can be hydrated by the API layer.
"""
from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)

try:
    import networkx as nx
except ImportError:
    nx = None


def _ensure_nx():
    if nx is None:
        raise RuntimeError("networkx is required for graph analysis but is not installed.")


def get_shared_entities(G: Any, evidence_ids: list[str]) -> list[str]:
    """
    Find entities that are shared across ALL specified evidence IDs.
    Returns a list of entity IDs.
    """
    _ensure_nx()
    if not evidence_ids:
        return []

    # For each evidence_id, find all entities connected to it via edges 
    # where the edge has evidence_id attribute equal to the target.
    # Alternatively, since Evidence is a node and there are CONTAINS edges...
    # Wait, the rule EvidenceContainsRule emits:
    #   source_id=evidence_node.id, target_id=content_node.id, relationship_type="CONTAINS"
    # But wait, edges also have an `evidence_id` attribute (from Relationship model).
    # We can just iterate over edges and check the `evidence_id` attribute.
    
    entities_per_evidence = []
    for ev_id in evidence_ids:
        connected_entities = set()
        for u, v, data in G.edges(data=True):
            if data.get("evidence_id") == ev_id:
                connected_entities.add(u)
                connected_entities.add(v)
        entities_per_evidence.append(connected_entities)

    # Intersection
    if not entities_per_evidence:
        return []
    
    shared = set.intersection(*entities_per_evidence)
    # Remove EVIDENCE nodes from the result if we want only content entities
    # But let's return all node IDs, API can filter. Or we can filter here.
    return [node_id for node_id in shared if G.nodes[node_id].get("entity_type") != "EVIDENCE"]


def get_connected_components(G: Any) -> list[list[str]]:
    """
    Find weakly connected components in the directed graph.
    Returns a list of lists of entity IDs, sorted by component size (largest first).
    """
    _ensure_nx()
    if len(G) == 0:
        return []
        
    components = list(nx.weakly_connected_components(G))
    components.sort(key=len, reverse=True)
    return [list(c) for c in components]


def get_degree_centrality(G: Any, top_k: int = 10) -> list[tuple[str, float]]:
    """
    Calculate degree centrality for all nodes (using undirected view).
    Returns a list of (entity_id, score) tuples for the top K entities.
    """
    _ensure_nx()
    if len(G) == 0:
        return []
        
    # Use undirected view as requested for general connectedness
    G_undirected = G.to_undirected(as_view=True)
    centrality = nx.degree_centrality(G_undirected)
    
    # Filter out EVIDENCE nodes so we rank actual entities
    filtered_centrality = {
        node: score for node, score in centrality.items()
        if G.nodes[node].get("entity_type") != "EVIDENCE"
    }
    
    sorted_nodes = sorted(filtered_centrality.items(), key=lambda x: x[1], reverse=True)
    return sorted_nodes[:top_k]


def get_shortest_path(G: Any, source_id: str, target_id: str) -> list[str] | None:
    """
    Find the shortest path between two entities using an undirected view.
    Returns a list of entity IDs representing the path, or None if no path exists.
    """
    _ensure_nx()
    if source_id not in G or target_id not in G:
        return None
        
    G_undirected = G.to_undirected(as_view=True)
    try:
        path = nx.shortest_path(G_undirected, source=source_id, target=target_id)
        return path
    except nx.NetworkXNoPath:
        return None


def get_cross_evidence_correlation(G: Any, entity_id: str) -> list[dict[str, Any]]:
    """
    Find other evidence items connected to a given entity, and the other entities
    they connect to.
    Returns a list of dicts: {"evidence_id": "...", "entities": ["id1", "id2"]}
    """
    _ensure_nx()
    if entity_id not in G:
        return []
        
    # Find all evidence_ids this entity is associated with
    evidence_ids = set()
    
    # Check edges where this entity is source or target
    for _, _, data in G.edges(entity_id, data=True):
        if "evidence_id" in data:
            evidence_ids.add(data["evidence_id"])
    for _, _, data in G.in_edges(entity_id, data=True):
        if "evidence_id" in data:
            evidence_ids.add(data["evidence_id"])
            
    # For each evidence_id, find all other entities
    correlations = []
    for ev_id in evidence_ids:
        connected_entities = set()
        for u, v, data in G.edges(data=True):
            if data.get("evidence_id") == ev_id:
                if u != entity_id and G.nodes[u].get("entity_type") != "EVIDENCE":
                    connected_entities.add(u)
                if v != entity_id and G.nodes[v].get("entity_type") != "EVIDENCE":
                    connected_entities.add(v)
        
        correlations.append({
            "evidence_id": ev_id,
            "entities": list(connected_entities)
        })
        
    return correlations


def get_graph_stats(G: Any) -> dict[str, float]:
    """
    Calculate high-level statistical properties of the graph.
    """
    _ensure_nx()
    stats = {
        "density": 0.0,
        "average_degree": 0.0,
        "num_connected_components": 0
    }
    
    if len(G) == 0:
        return stats
        
    G_undirected = G.to_undirected(as_view=True)
    
    stats["density"] = nx.density(G)
    stats["num_connected_components"] = nx.number_weakly_connected_components(G)
    
    # Average degree in undirected graph = 2 * E / V
    stats["average_degree"] = (2.0 * G_undirected.number_of_edges()) / G.number_of_nodes()
    
    return stats
