from sqlalchemy import Column, String, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON
from sqlalchemy.sql import func
import uuid

from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Entity(Base):
    __tablename__ = "entities"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    entity_type = Column(String(100), nullable=False, index=True)
    value = Column(String(500), nullable=False)
    normalized_value = Column(String(500), nullable=False, index=True)
    confidence = Column(Float, nullable=True)
    first_seen = Column(DateTime(timezone=True), server_default=func.now())
    last_seen = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    properties = Column(JSON, default=dict, nullable=False)

    __table_args__ = (
        UniqueConstraint("entity_type", "normalized_value", name="uq_entity_type_normalized_value"),
    )

    # Relationships
    source_relationships = relationship(
        "Relationship",
        foreign_keys="[Relationship.source_entity_id]",
        back_populates="source_entity",
        cascade="all, delete-orphan"
    )
    target_relationships = relationship(
        "Relationship",
        foreign_keys="[Relationship.target_entity_id]",
        back_populates="target_entity",
        cascade="all, delete-orphan"
    )


class Relationship(Base):
    __tablename__ = "relationships"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    source_entity_id = Column(String(36), ForeignKey("entities.id", ondelete="CASCADE"), nullable=False, index=True)
    target_entity_id = Column(String(36), ForeignKey("entities.id", ondelete="CASCADE"), nullable=False, index=True)
    relationship_type = Column(String(100), nullable=False, index=True)
    provenance = Column(String(100), nullable=False, index=True) # e.g. 'same_whatsapp_message', 'same_sentence', 'same_page', 'same_document'
    evidence_id = Column(String(36), ForeignKey("evidence.evidence_id", ondelete="CASCADE"), nullable=False, index=True)
    confidence = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    properties = Column(JSON, default=dict, nullable=False)

    __table_args__ = (
        UniqueConstraint("source_entity_id", "target_entity_id", "relationship_type", "evidence_id", name="uq_source_target_type_evidence"),
    )

    # Relationships
    source_entity = relationship("Entity", foreign_keys=[source_entity_id], back_populates="source_relationships")
    target_entity = relationship("Entity", foreign_keys=[target_entity_id], back_populates="target_relationships")
