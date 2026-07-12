"""
Intelligence API endpoints for NETHRA AI Module 2.

Provides read-only access to all extracted intelligence for a given evidence_id:
  - GET /intelligence/{evidence_id}/status       – processing status + logs
  - GET /intelligence/{evidence_id}/metadata     – extracted metadata records
  - GET /intelligence/{evidence_id}/ocr          – OCR / text extraction results
  - GET /intelligence/{evidence_id}/entities     – named entities (filterable)

All endpoints return 404 if the evidence_id does not exist.
No endpoint modifies evidence data (forensic integrity preserved).
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.evidence import Evidence
from app.models.intelligence import EvidenceMetadata, OCRResult, ExtractedEntity, ProcessingLog
from app.schemas.intelligence import (
    ProcessingStatusResponse,
    MetadataResponse,
    OCRResultResponse,
    ExtractedEntityResponse,
    ProcessingLogResponse,
)

router = APIRouter()


def _get_evidence_or_404(evidence_id: str, db: Session) -> Evidence:
    """Resolve evidence_id to an Evidence record or raise 404."""
    evidence = db.query(Evidence).filter(
        Evidence.evidence_id == evidence_id,
        Evidence.is_deleted == False,
    ).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    return evidence


@router.get("/{evidence_id}/status", response_model=ProcessingStatusResponse)
def get_processing_status(evidence_id: str, db: Session = Depends(get_db)):
    """
    Return the current processing status of an evidence item along with
    its most recent processing logs — used for UI polling.
    """
    evidence = _get_evidence_or_404(evidence_id, db)
    logs = (
        db.query(ProcessingLog)
        .filter(ProcessingLog.evidence_id == evidence_id)
        .order_by(ProcessingLog.timestamp.desc())
        .limit(20)
        .all()
    )
    return ProcessingStatusResponse(
        evidence_id=evidence_id,
        status=evidence.status.value if evidence.status else "UNKNOWN",
        logs=[ProcessingLogResponse.model_validate(l) for l in logs],
    )


@router.get("/{evidence_id}/metadata", response_model=List[MetadataResponse])
def get_metadata(evidence_id: str, db: Session = Depends(get_db)):
    """Return all extracted metadata records for the given evidence."""
    _get_evidence_or_404(evidence_id, db)
    records = (
        db.query(EvidenceMetadata)
        .filter(EvidenceMetadata.evidence_id == evidence_id)
        .all()
    )
    return [MetadataResponse.model_validate(r) for r in records]


@router.get("/{evidence_id}/ocr", response_model=List[OCRResultResponse])
def get_ocr_results(evidence_id: str, db: Session = Depends(get_db)):
    """Return all OCR / text extraction results for the given evidence, ordered by page."""
    _get_evidence_or_404(evidence_id, db)
    records = (
        db.query(OCRResult)
        .filter(OCRResult.evidence_id == evidence_id)
        .order_by(OCRResult.page_number)
        .all()
    )
    return [OCRResultResponse.model_validate(r) for r in records]


@router.get("/{evidence_id}/entities", response_model=List[ExtractedEntityResponse])
def get_entities(
    evidence_id: str,
    entity_type: Optional[str] = Query(
        default=None,
        description="Filter by entity type (e.g. PERSON, EMAIL, IP)",
    ),
    db: Session = Depends(get_db),
):
    """
    Return extracted entities for the given evidence.

    Optionally filter by entity_type to focus on a specific category.
    """
    _get_evidence_or_404(evidence_id, db)
    query = db.query(ExtractedEntity).filter(
        ExtractedEntity.evidence_id == evidence_id
    )
    if entity_type:
        query = query.filter(ExtractedEntity.entity_type == entity_type.upper())
    records = query.order_by(ExtractedEntity.entity_type).all()
    return [ExtractedEntityResponse.model_validate(r) for r in records]


from app.schemas.intelligence import AIInsightResponse, TimelineResponse, ReportPreviewResponse, FullReportResponse
from app.services.intelligence_service import IntelligenceService
from datetime import datetime

@router.get("/{evidence_id}/insights", response_model=List[AIInsightResponse])
def get_insights(evidence_id: str, db: Session = Depends(get_db)):
    """Return AI insights derived from the evidence."""
    _get_evidence_or_404(evidence_id, db)
    return IntelligenceService.get_insights(db, evidence_id)

@router.get("/{evidence_id}/timeline", response_model=TimelineResponse)
def get_timeline(evidence_id: str, db: Session = Depends(get_db)):
    """Return both processing and extracted evidence timeline events."""
    _get_evidence_or_404(evidence_id, db)
    return IntelligenceService.get_timeline(db, evidence_id)

@router.get("/{evidence_id}/report-preview", response_model=ReportPreviewResponse)
def get_report_preview(evidence_id: str, db: Session = Depends(get_db)):
    """Return structured report preview placeholder."""
    _get_evidence_or_404(evidence_id, db)
    return IntelligenceService.get_report_preview(db, evidence_id)

@router.get("/{evidence_id}/report", response_model=FullReportResponse)
def get_full_report(evidence_id: str, db: Session = Depends(get_db)):
    """Return the complete intelligence report data for a given evidence item."""
    _get_evidence_or_404(evidence_id, db)
    
    metadata = get_metadata(evidence_id, db)
    ocr = get_ocr_results(evidence_id, db)
    entities = get_entities(evidence_id=evidence_id, entity_type=None, db=db)
    insights = IntelligenceService.get_insights(db, evidence_id)
    timeline = IntelligenceService.get_timeline(db, evidence_id)
    
    return FullReportResponse(
        evidence_id=evidence_id,
        metadata=metadata,
        ocr=ocr,
        entities=entities,
        insights=insights,
        timeline=timeline.events,
        generated_at=datetime.utcnow()
    )

