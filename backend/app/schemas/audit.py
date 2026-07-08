# pyrefly: ignore [missing-import]
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AuditLogBase(BaseModel):
    action: str
    evidence_id: Optional[str] = None
    entity_type: str
    entity_id: str
    details: Optional[str] = None
    previous_state: Optional[str] = None
    current_state: Optional[str] = None
    hash_verification_status: Optional[str] = None
    performed_by: str = "System"

class AuditLogCreate(AuditLogBase):
    pass

class AuditLogResponse(AuditLogBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True
