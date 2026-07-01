from app.core.database import Base
from app.models.evidence import Evidence, EvidenceStatus
from app.models.audit import AuditLog
from app.models.intelligence import EvidenceMetadata, OCRResult, ExtractedEntity, ProcessingLog, ExtractionMethodOCR, ExtractionMethodNER, EntityType, ProcessingStatus
from app.models.graph import Entity, Relationship

# This __init__.py ensures all models are imported and registered with SQLAlchemy's Base.metadata 
# before Alembic attempts to autogenerate migrations.
