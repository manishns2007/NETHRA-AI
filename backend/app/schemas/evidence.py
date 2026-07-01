from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class EvidenceBase(BaseModel):
    original_filename: str
    file_size_bytes: int
    mime_type: Optional[str] = None
    source_type: Optional[str] = None
    sha256_hash: str
    status: str
    is_deleted: bool

class EvidenceCreate(EvidenceBase):
    stored_filename: str
    file_path: str

class EvidenceResponse(EvidenceBase):
    evidence_id: str
    uploaded_at: datetime
    uploaded_by: str

    class Config:
        from_attributes = True
