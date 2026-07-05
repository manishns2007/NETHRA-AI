from sqlalchemy.orm import Session
from typing import Dict, Any, List, Set
from .retriever import BaseRetriever
from app.models.graph import Entity, Relationship
from app.models.intelligence import ExtractedEntity

class GraphRetriever(BaseRetriever):
    def retrieve(self, evidence_ids: List[str], max_entities: int = 20) -> Dict[str, Any]:
        # TODO: Accept and apply `investigation_id` filter when DB supports investigations/cases.
        entities_data = []
        relationships_data = []
        
        # 1. Get extracted entities from the evidence
        extracted_entities = self.db.query(ExtractedEntity).filter(
            ExtractedEntity.evidence_id.in_(evidence_ids)
        ).limit(max_entities).all()
        
        normalized_values = {ee.normalized_value for ee in extracted_entities if ee.normalized_value}
        
        if normalized_values:
            # 2. Get the actual Graph Entities for these values
            graph_entities = self.db.query(Entity).filter(
                Entity.normalized_value.in_(list(normalized_values))
            ).limit(max_entities).all()
            
            entity_ids = [e.id for e in graph_entities]
            
            # 3. Get relationships where these entities are source or target
            relationships = self.db.query(Relationship).filter(
                (Relationship.source_entity_id.in_(entity_ids)) | 
                (Relationship.target_entity_id.in_(entity_ids))
            ).limit(20).all() # max 20 relationships
            
            for e in graph_entities:
                entities_data.append({
                    "id": e.id,
                    "type": e.entity_type,
                    "value": e.value
                })
                
            for r in relationships:
                relationships_data.append({
                    "id": r.id,
                    "source": r.source_entity.value if r.source_entity else r.source_entity_id,
                    "target": r.target_entity.value if r.target_entity else r.target_entity_id,
                    "type": r.relationship_type,
                    "provenance": r.provenance
                })

        return {
            "entities": entities_data,
            "relationships": relationships_data
        }
