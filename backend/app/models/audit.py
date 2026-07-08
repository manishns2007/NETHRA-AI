from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(100), nullable=False)
    evidence_id = Column(String(36), index=True) # Explicitly linking to evidence
    entity_type = Column(String(50), nullable=False) # e.g. "EVIDENCE", "REPORT"
    entity_id = Column(String(36), nullable=False) 
    details = Column(Text)
    previous_state = Column(String(255))
    current_state = Column(String(255))
    hash_verification_status = Column(String(50))
    performed_by = Column(String(100), default="System")
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
