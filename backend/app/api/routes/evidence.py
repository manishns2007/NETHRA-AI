import hashlib
import os
import tempfile
import uuid
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.models.evidence import Evidence, EvidenceStatus
from app.models.audit import AuditLog
from app.schemas.evidence import EvidenceResponse
from typing import List, Optional

router = APIRouter()

ALLOWED_EXTENSIONS_BY_SOURCE = {
    "pdf_document": [".pdf"],
    "image_evidence": [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff", ".gif"],
    "whatsapp_export": [".txt", ".zip"],
    "telegram_export": [".json", ".txt", ".html", ".zip", ".csv"],
}

def validate_file_format(filename: str, source_type: Optional[str]):
    if not source_type or source_type not in ALLOWED_EXTENSIONS_BY_SOURCE:
        return
    
    allowed_exts = ALLOWED_EXTENSIONS_BY_SOURCE[source_type]
    _, ext = os.path.splitext(filename.lower())
    
    if ext not in allowed_exts:
        readable_exts = ", ".join(allowed_exts)
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file extension '{ext}' for category '{source_type}'. Allowed extensions: {readable_exts}"
        )

@router.post("/upload")
async def upload_evidence(
    file: UploadFile = File(...), 
    source_type: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    validate_file_format(file.filename, source_type)
    try:
        upload_dir = settings.UPLOAD_DIR
        try:
            os.makedirs(upload_dir, exist_ok=True)
            test_file = os.path.join(upload_dir, f".perm_test_{uuid.uuid4().hex[:6]}")
            with open(test_file, "w") as f:
                f.write("1")
            os.remove(test_file)
        except (OSError, PermissionError):
            upload_dir = os.path.join(tempfile.gettempdir(), "nethra_uploads")
            os.makedirs(upload_dir, exist_ok=True)

        # Prevent collisions
        unique_prefix = str(uuid.uuid4())
        stored_filename = f"{unique_prefix}_{file.filename}"
        file_location = os.path.join(upload_dir, stored_filename)
        
        sha256_hash = hashlib.sha256()
        file_size = 0
        
        with open(file_location, "wb") as buffer:
            while chunk := await file.read(8192):
                buffer.write(chunk)
                sha256_hash.update(chunk)
                file_size += len(chunk)
                
        file_hash = sha256_hash.hexdigest()
        
        # Duplicate check
        if db.query(Evidence).filter(Evidence.sha256_hash == file_hash).first():
            try:
                os.remove(file_location)
            except OSError:
                pass
            raise HTTPException(status_code=409, detail="Evidence already exists")

        # Create Evidence Record with UPLOADED status
        new_evidence = Evidence(
            original_filename=file.filename,
            stored_filename=stored_filename,
            file_path=file_location,
            file_size_bytes=file_size,
            mime_type=file.content_type,
            source_type=source_type,
            sha256_hash=file_hash,
            status=EvidenceStatus.UPLOADED,
            is_deleted=False
        )
        db.add(new_evidence)
        db.flush()  # Get the generated evidence_id

        # Create Audit Log
        audit_entry = AuditLog(
            action="EVIDENCE_UPLOADED",
            entity_type="EVIDENCE",
            entity_id=new_evidence.evidence_id,
            evidence_id=new_evidence.evidence_id,
            details=f"Uploaded file {file.filename} with hash {file_hash}"
        )
        db.add(audit_entry)
        db.commit()

        evidence_id = new_evidence.evidence_id

        # Read uploaded file bytes to pass directly in Celery task payload
        # so processing works instantly without requiring a shared disk volume
        try:
            with open(file_location, "rb") as f:
                file_bytes = f.read()

            from app.core.celery_app import celery_app
            celery_app.send_task(
                "app.services.processing.pipeline.process_evidence",
                args=[evidence_id],
                kwargs={"file_bytes_hex": file_bytes.hex()}
            )
        except Exception as task_error:
            import logging
            logging.getLogger(__name__).warning(
                "Could not enqueue processing task for %s: %s", evidence_id, task_error
            )
        
        return {"evidence_id": evidence_id, "status": "UPLOADED"}

    except HTTPException:
        raise
    except Exception as e:
        import logging
        import traceback
        logging.getLogger(__name__).error(f"Error in upload_evidence: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[EvidenceResponse])
def list_evidence(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    evidence = db.query(Evidence).filter(Evidence.is_deleted == False).offset(skip).limit(limit).all()
    return evidence

@router.get("/{evidence_id}", response_model=EvidenceResponse)
def get_evidence(evidence_id: str, db: Session = Depends(get_db)):
    evidence = db.query(Evidence).filter(Evidence.evidence_id == evidence_id, Evidence.is_deleted == False).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    return evidence
