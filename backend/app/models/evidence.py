from sqlalchemy import Column, Integer, String, DateTime, Boolean, BigInteger, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import uuid
import enum

def generate_uuid():
    return str(uuid.uuid4())

class EvidenceStatus(str, enum.Enum):
    UPLOADED = "UPLOADED"
    QUEUED = "QUEUED"
    PROCESSING = "PROCESSING"
    PROCESSED = "PROCESSED"
    FAILED = "FAILED"
    INTEGRITY_FAILED = "INTEGRITY_FAILED"

class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True)
    evidence_id = Column(String(36), unique=True, index=True, default=generate_uuid)
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False, unique=True)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(BigInteger, nullable=False)
    mime_type = Column(String(100))
    source_type = Column(String(100))
    sha256_hash = Column(String(64), unique=True, nullable=False, index=True)
    status = Column(SQLEnum(EvidenceStatus), default=EvidenceStatus.UPLOADED, index=True)
    is_deleted = Column(Boolean, default=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    uploaded_by = Column(String(100), default="System")

    # Relationships to intelligence data
    metadata_entries = relationship("EvidenceMetadata", back_populates="evidence")
    ocr_results = relationship("OCRResult", back_populates="evidence")
    extracted_entities = relationship("ExtractedEntity", back_populates="evidence")
    processing_logs = relationship("ProcessingLog", back_populates="evidence")
