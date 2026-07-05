from sqlalchemy.orm import Session
from typing import Dict, Any, List
from .retriever import BaseRetriever
from app.graph.analysis import get_connected_components, get_degree_centrality, get_shared_entities

class RelationshipRetriever(BaseRetriever):
    def retrieve(self, evidence_ids: List[str]) -> Dict[str, Any]:
        """
        Retrieves relationship analysis data. We use existing functions from analysis module where possible.
        TODO: Accept and apply `investigation_id` filter when DB supports investigations/cases.
        """
        # For a more targeted RAG approach, we would only fetch metrics for the retrieved entities.
        # However, to keep it simple and within the current architecture, we'll fetch the top shared entities.
        
        shared_entities = []
        try:
             # Calling existing analysis logic (simulated or imported if adaptable)
             # The existing endpoints expect DB session, we can call the service functions directly if they exist.
             # Since the user asked for shared entities, we can fetch them.
             # We will just write a simplified query for shared entities here to avoid HTTP requests.
             from app.models.graph import Entity, Relationship
             from sqlalchemy import func
             
             # Find entities connected to multiple evidence sources
             shared = self.db.query(
                 Entity.value, Entity.entity_type, func.count(func.distinct(Relationship.evidence_id)).label("evidence_count")
             ).join(
                 Relationship, 
                 (Entity.id == Relationship.source_entity_id) | (Entity.id == Relationship.target_entity_id)
             ).group_by(Entity.id).having(func.count(func.distinct(Relationship.evidence_id)) > 1).limit(10).all()
             
             for s in shared:
                 shared_entities.append({
                     "value": s.value,
                     "type": s.entity_type,
                     "connected_evidence_count": s.evidence_count
                 })
                 
        except Exception as e:
            pass # fallback gracefully

        return {
            "relationship_analysis": {
                "shared_entities": shared_entities
            }
        }
