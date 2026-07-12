from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class ExtractionMethodOCR(str, enum.Enum):
    OCR = "OCR"
    DIRECT_TEXT = "DIRECT_TEXT"

class ExtractionMethodNER(str, enum.Enum):
    SPACY = "SPACY"
    REGEX = "REGEX"
    STRUCTURED = "STRUCTURED"
    LLM = "LLM"

class EntityType(str, enum.Enum):
    PERSON = "PERSON"
    ORG = "ORG"
    LOC = "LOC"
    EMAIL = "EMAIL"
    PHONE = "PHONE"
    URL = "URL"
    DOMAIN = "DOMAIN"
    IP = "IP"
    USERNAME = "USERNAME"
    DATE = "DATE"
    TIME = "TIME"
    DEVICE = "DEVICE"
    FILE_HASH = "FILE_HASH"
    SOCIAL_HANDLE = "SOCIAL_HANDLE"
    CRYPTO_WALLET = "CRYPTO_WALLET"
    EVENT = "EVENT"

class ProcessingStatus(str, enum.Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"

class EvidenceMetadata(Base):
    __tablename__ = "evidence_metadata"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    evidence_id = Column(String(36), ForeignKey("evidence.evidence_id"), nullable=False, index=True)
    metadata_type = Column(String(100), nullable=False, index=True) # 'EXIF', 'FILE_SYSTEM', 'DOCUMENT_PROPERTIES'
    data = Column(JSON, nullable=False)
    extracted_at = Column(DateTime(timezone=True), server_default=func.now())

    evidence = relationship("Evidence", back_populates="metadata_entries")

class OCRResult(Base):
    __tablename__ = "ocr_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    evidence_id = Column(String(36), ForeignKey("evidence.evidence_id"), nullable=False, index=True)
    page_number = Column(Integer, nullable=True)
    extracted_text = Column(Text, nullable=False)
    confidence_score = Column(Float, nullable=True)
    bounding_boxes = Column(JSON, nullable=True)
    language = Column(String(50), nullable=True)
    extraction_method = Column(SQLEnum(ExtractionMethodOCR), nullable=False)
    processing_version = Column(String(50), nullable=False)
    extracted_at = Column(DateTime(timezone=True), server_default=func.now())

    evidence = relationship("Evidence", back_populates="ocr_results")

class ExtractedEntity(Base):
    __tablename__ = "extracted_entities"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    evidence_id = Column(String(36), ForeignKey("evidence.evidence_id"), nullable=False, index=True)
    entity_type = Column(SQLEnum(EntityType), nullable=False, index=True)
    entity_value = Column(String(500), nullable=False)
    normalized_value = Column(String(500), nullable=True, index=True)
    context_snippet = Column(Text, nullable=True)
    confidence = Column(Float, nullable=True)
    extraction_method = Column(SQLEnum(ExtractionMethodNER), nullable=False)
    extracted_at = Column(DateTime(timezone=True), server_default=func.now())

    evidence = relationship("Evidence", back_populates="extracted_entities")

class ProcessingLog(Base):
    __tablename__ = "processing_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    evidence_id = Column(String(36), ForeignKey("evidence.evidence_id"), nullable=False, index=True)
    step = Column(String(100), nullable=False, index=True) # 'CLASSIFICATION', 'OCR', 'NER'
    status = Column(SQLEnum(ProcessingStatus), nullable=False, index=True)
    message = Column(Text, nullable=True)
    processing_version = Column(String(50), nullable=True)
    processing_notes = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    evidence = relationship("Evidence", back_populates="processing_logs")
