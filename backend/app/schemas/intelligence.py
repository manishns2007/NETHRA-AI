"""
Pydantic schemas for Module 2 intelligence API responses.

All schemas use model_validate (Pydantic v2) for ORM compatibility.
"""
from pydantic import BaseModel
from typing import Any, Optional
from datetime import datetime


class ProcessingLogResponse(BaseModel):
    id: str
    evidence_id: str
    step: str
    status: str
    message: Optional[str] = None
    processing_version: Optional[str] = None
    processing_notes: Optional[str] = None
    timestamp: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ProcessingStatusResponse(BaseModel):
    evidence_id: str
    status: str
    logs: list[ProcessingLogResponse]


class MetadataResponse(BaseModel):
    id: str
    evidence_id: str
    metadata_type: str
    data: dict[str, Any]
    extracted_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class OCRResultResponse(BaseModel):
    id: str
    evidence_id: str
    page_number: Optional[int] = None
    extracted_text: str
    confidence_score: Optional[float] = None
    bounding_boxes: Optional[Any] = None
    language: Optional[str] = None
    extraction_method: str
    processing_version: str
    extracted_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ExtractedEntityResponse(BaseModel):
    id: str
    evidence_id: str
    entity_type: str
    entity_value: str
    normalized_value: Optional[str] = None
    context_snippet: Optional[str] = None
    confidence: Optional[float] = None
    extraction_method: str
    extracted_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

class AIInsightResponse(BaseModel):
    id: str
    type: str  # e.g., 'lead', 'timeline', 'info'
    text: str
    confidence: Optional[float] = None
    evidence_id: str

class TimelineEventResponse(BaseModel):
    id: str
    type: str # 'PROCESSING' or 'EVIDENCE'
    event_name: str
    timestamp: datetime
    details: Optional[str] = None

class TimelineResponse(BaseModel):
    evidence_id: str
    events: list[TimelineEventResponse]

class ReportSectionPreview(BaseModel):
    id: str
    title: str
    status: str # 'ready', 'processing', 'missing_data'
    summary_placeholder: Optional[str] = None

class ReportPreviewResponse(BaseModel):
    evidence_id: str
    sections: list[ReportSectionPreview]
