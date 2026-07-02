"""
Service layer for coordinating database updates for enrichment.
"""
import logging
from sqlalchemy.orm import Session
from fastapi.encoders import jsonable_encoder

from app.models.graph import Entity, Relationship
from app.enrichment import dispatcher

logger = logging.getLogger(__name__)


def process_entity_enrichment(db: Session, entity_id: str) -> bool:
    """
    Fetch the entity, run all applicable providers, and merge the results
    into Entity.properties.
    
    Returns True if updated, False if entity not found or no new data.
    """
    entity = db.query(Entity).filter(Entity.id == entity_id).first()
    if not entity:
        logger.warning(f"process_entity_enrichment: Entity {entity_id} not found")
        return False
        
    new_data = dispatcher.run_enrichment(entity)
    if not new_data:
        logger.info(f"process_entity_enrichment: No enrichment data found for entity {entity_id}")
        return False
        
    # Merge new data into existing properties
    # We create a copy of the dict to ensure SQLAlchemy detects the change
    current_properties = dict(entity.properties) if entity.properties else {}
    
    for provider_name, provider_data in new_data.items():
        # Overwrite only this provider's namespace
        current_properties[provider_name] = provider_data
        
    # We must assign a new dict reference so SQLAlchemy knows to UPDATE the JSON column
    entity.properties = jsonable_encoder(current_properties)
    
    db.commit()
    logger.info(f"Successfully updated enrichment for entity {entity_id}")
    return True


def get_entities_for_evidence(db: Session, evidence_id: str) -> list[str]:
    """
    Find all entity IDs associated with a specific evidence item.
    """
    edges = db.query(Relationship).filter(Relationship.evidence_id == evidence_id).all()
    
    entity_ids = set()
    for edge in edges:
        entity_ids.add(edge.source_entity_id)
        entity_ids.add(edge.target_entity_id)
        
    return list(entity_ids)
