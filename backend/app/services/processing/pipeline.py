"""
Processing pipeline orchestrator for NETHRA AI Module 2.

This module contains the Celery task that drives the full evidence
processing lifecycle from QUEUED → PROCESSED (or FAILED / INTEGRITY_FAILED).

Workflow:
  1. Verify SHA-256 integrity of stored file.
  2. Classify file type.
  3. Extract metadata.
  4. Extract text via OCR or direct read.
  5. Run Named Entity Recognition on all extracted text.
  6. Persist all results to the database.
  7. Update evidence status.

FORENSIC CONTRACT:
  - Original evidence files are NEVER modified.
  - SHA-256 hashes are NEVER altered.
  - All intelligence maintains provenance via evidence_id FK.
  - Any exception is logged and partial results are preserved.
"""
from __future__ import annotations

import hashlib
import logging
from datetime import datetime, timezone
from typing import Any

from app.core.celery_app import celery_app
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.config import settings
from app.models.evidence import Evidence, EvidenceStatus
from app.models.intelligence import (
    EvidenceMetadata,
    OCRResult,
    ExtractedEntity,
    ProcessingLog,
)
from app.services.processing.classifier import classify_file, FileCategory
from app.services.processing.metadata import extract_metadata
from app.services.processing.ner import extract_entities
from app.graph.builder import build_graph_for_evidence

logger = logging.getLogger(__name__)


# ── Helpers ─────────────────────────────────────────────────────────────────────

def _now() -> datetime:
    return datetime.now(tz=timezone.utc)


def _compute_sha256(file_path: str) -> str:
    """Compute SHA-256 hash of a file without loading it entirely into memory."""
    h = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def _write_log(
    db: Session,
    evidence_id: str,
    step: str,
    status: str,
    message: str | None = None,
    notes: str | None = None,
) -> None:
    """Persist a processing log entry."""
    log = ProcessingLog(
        evidence_id=evidence_id,
        step=step,
        status=status,
        message=message,
        processing_version=settings.PROCESSING_VERSION,
        processing_notes=notes,
        timestamp=_now(),
    )
    db.add(log)
    db.commit()


def _write_audit(db: Session, evidence_id: str, action: str, details: str) -> None:
    """Persist an audit log entry for significant forensic events."""
    from app.models.audit import AuditLog

    entry = AuditLog(
        action=action,
        entity_type="evidence",
        entity_id=evidence_id,
        details=details,
        performed_by="processing_pipeline",
        timestamp=_now(),
    )
    db.add(entry)
    db.commit()


def _set_status(db: Session, evidence: Evidence, status: EvidenceStatus) -> None:
    """Update the evidence processing status."""
    evidence.status = status
    db.commit()


# ── OCR Dispatch ────────────────────────────────────────────────────────────────

def _run_ocr(file_path: str, category: FileCategory) -> list[dict[str, Any]]:
    """
    Dispatch to the correct OCR/text-extraction function based on file category.

    Returns a list of page-level text extraction result dicts.
    """
    from app.services.processing.ocr import (
        process_image_ocr,
        process_pdf_ocr,
        process_text_file,
    )

    if category == FileCategory.IMAGE:
        return process_image_ocr(file_path)
    elif category == FileCategory.PDF:
        return process_pdf_ocr(file_path)
    elif category in (FileCategory.PLAIN_TEXT, FileCategory.CHAT_EXPORT):
        return process_text_file(file_path)
    else:
        # Audio, Video, Office, Archive – no OCR at this time
        return []


# ── Main Celery Task ─────────────────────────────────────────────────────────────

@celery_app.task(
    bind=True,
    name="app.services.processing.pipeline.process_evidence",
    max_retries=0,  # No auto-retry – failures must be investigated by the operator
    acks_late=True,
)
def process_evidence(self, evidence_id: str, file_bytes_hex: str | None = None) -> dict[str, Any]:
    """
    Celery task: orchestrate full evidence processing for a single evidence_id.
    """
    db: Session = SessionLocal()
    evidence: Evidence | None = None

    try:
        # ── Load evidence record ──────────────────────────────────────────────
        evidence = db.query(Evidence).filter(
            Evidence.evidence_id == evidence_id
        ).first()

        if not evidence:
            logger.error("process_evidence: evidence_id=%s not found", evidence_id)
            return {"status": "ERROR", "reason": "evidence_not_found"}

        # Reconstruct file locally on worker if missing from disk
        import os
        if not os.path.exists(evidence.file_path):
            os.makedirs(os.path.dirname(evidence.file_path), exist_ok=True)
            if file_bytes_hex:
                with open(evidence.file_path, "wb") as f:
                    f.write(bytes.fromhex(file_bytes_hex))

        # ── Step 1: Mark as QUEUED ────────────────────────────────────────────
        _set_status(db, evidence, EvidenceStatus.QUEUED)
        _write_log(db, evidence_id, "QUEUE", "SUCCESS", "Evidence queued for processing")
        logger.info("Evidence %s queued", evidence_id)

        # ── Step 2: SHA-256 Integrity Verification ────────────────────────────
        _write_log(db, evidence_id, "INTEGRITY_CHECK", "PENDING")
        computed_hash = _compute_sha256(evidence.file_path)

        if computed_hash != evidence.sha256_hash:
            # Integrity failure – halt all processing
            _set_status(db, evidence, EvidenceStatus.INTEGRITY_FAILED)
            msg = (
                f"Integrity check FAILED. "
                f"Stored hash: {evidence.sha256_hash} | "
                f"Computed hash: {computed_hash}"
            )
            _write_log(db, evidence_id, "INTEGRITY_CHECK", "FAILED", msg)
            _write_audit(db, evidence_id, "INTEGRITY_FAILED", msg)
            logger.error("Integrity check failed for evidence %s", evidence_id)
            return {"status": "INTEGRITY_FAILED", "evidence_id": evidence_id}

        _write_log(db, evidence_id, "INTEGRITY_CHECK", "SUCCESS", "SHA-256 hash verified")
        logger.info("Integrity verified for evidence %s", evidence_id)

        # ── Step 3: Begin Processing ──────────────────────────────────────────
        _set_status(db, evidence, EvidenceStatus.PROCESSING)

        # ── Step 4: File Classification ───────────────────────────────────────
        category = classify_file(evidence.file_path)
        _write_log(
            db, evidence_id, "CLASSIFICATION", "SUCCESS",
            f"Classified as {category.value}"
        )
        logger.info("Evidence %s classified as %s", evidence_id, category.value)

        # ── Step 5: Metadata Extraction ───────────────────────────────────────
        metadata_records = extract_metadata(evidence.file_path, category)
        for meta in metadata_records:
            db.add(
                EvidenceMetadata(
                    evidence_id=evidence_id,
                    metadata_type=meta["metadata_type"],
                    data=meta["data"],
                )
            )
        db.commit()
        _write_log(
            db, evidence_id, "METADATA_EXTRACTION", "SUCCESS",
            f"Extracted {len(metadata_records)} metadata record(s)"
        )

        # ── Step 6: Text / OCR Extraction ─────────────────────────────────────
        ocr_records = _run_ocr(evidence.file_path, category)
        all_text_parts: list[str] = []

        for ocr_data in ocr_records:
            db.add(
                OCRResult(
                    evidence_id=evidence_id,
                    page_number=ocr_data.get("page_number"),
                    extracted_text=ocr_data["extracted_text"],
                    confidence_score=ocr_data.get("confidence_score"),
                    bounding_boxes=ocr_data.get("bounding_boxes"),
                    language=ocr_data.get("language"),
                    extraction_method=ocr_data["extraction_method"],
                    processing_version=ocr_data["processing_version"],
                )
            )
            if ocr_data["extracted_text"]:
                all_text_parts.append(ocr_data["extracted_text"])

        db.commit()
        _write_log(
            db, evidence_id, "TEXT_EXTRACTION", "SUCCESS",
            f"Extracted text from {len(ocr_records)} page(s) "
            f"using method: {ocr_records[0]['extraction_method'] if ocr_records else 'N/A'}"
        )

        # ── Step 7: Named Entity Recognition ─────────────────────────────────
        full_text = "\n".join(all_text_parts)
        entities = extract_entities(full_text)

        for entity in entities:
            db.add(
                ExtractedEntity(
                    evidence_id=evidence_id,
                    entity_type=entity["entity_type"],
                    entity_value=entity["entity_value"],
                    normalized_value=entity["normalized_value"],
                    context_snippet=entity.get("context_snippet"),
                    confidence=entity.get("confidence"),
                    extraction_method=entity["extraction_method"],
                )
            )
        db.commit()
        _write_log(
            db, evidence_id, "NER", "SUCCESS",
            f"Extracted {len(entities)} entit(ies)"
        )

        # ── Step 8: Build Knowledge Graph ─────────────────────────────────────
        try:
            graph_stats = build_graph_for_evidence(db, evidence_id, entities)
            _write_log(
                db, evidence_id, "GRAPH_BUILD", "SUCCESS",
                f"Graph: +{graph_stats['nodes_created']} nodes, "
                f"{graph_stats['nodes_reused']} reused, "
                f"+{graph_stats['edges_created']} edges"
            )
            logger.info(
                "Graph built for evidence %s: %s",
                evidence_id, graph_stats,
            )
        except Exception as graph_exc:
            # Graph build errors are non-fatal — partial results are preserved
            logger.exception(
                "Graph build failed for evidence %s (non-fatal): %s",
                evidence_id, graph_exc,
            )
            _write_log(
                db, evidence_id, "GRAPH_BUILD", "FAILED",
                f"Graph build error (non-fatal): {graph_exc}",
            )

        # ── Step 9: Mark PROCESSED ────────────────────────────────────────────
        _set_status(db, evidence, EvidenceStatus.PROCESSED)
        logger.info(
            "Evidence %s processed: %d metadata, %d pages, %d entities",
            evidence_id, len(metadata_records), len(ocr_records), len(entities)
        )

        return {
            "status": "PROCESSED",
            "evidence_id": evidence_id,
            "metadata_count": len(metadata_records),
            "ocr_pages": len(ocr_records),
            "entity_count": len(entities),
        }

    except Exception as exc:
        # ── Failure Handler ───────────────────────────────────────────────────
        logger.exception("Unexpected error processing evidence %s: %s", evidence_id, exc)

        if evidence is not None:
            try:
                _set_status(db, evidence, EvidenceStatus.FAILED)
                _write_log(
                    db, evidence_id, "PIPELINE", "FAILED",
                    f"Unhandled exception: {type(exc).__name__}: {exc}",
                    notes="Partial intelligence may have been preserved.",
                )
            except Exception as inner:
                logger.exception("Failed to write failure log: %s", inner)

        return {
            "status": "FAILED",
            "evidence_id": evidence_id,
            "error": str(exc),
        }

    finally:
        db.close()
