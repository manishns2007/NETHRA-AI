import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.intelligence import ExtractedEntity, EntityType, ProcessingLog
from app.schemas.intelligence import AIInsightResponse, TimelineEventResponse, TimelineResponse, ReportSectionPreview, ReportPreviewResponse

class IntelligenceService:
    def get_insights(db: Session, evidence_id: str) -> list[AIInsightResponse]:
        entities = db.query(ExtractedEntity).filter(ExtractedEntity.evidence_id == evidence_id).all()
        
        if not entities:
            return []
            
        # Group by entity type dynamically
        type_counts = {}
        for e in entities:
            type_counts[e.entity_type] = type_counts.get(e.entity_type, 0) + 1

        insights = []
        
        # Pre-defined insight templates for all supported EntityTypes
        insight_templates = {
            EntityType.PERSON: {"type": "lead", "text": "Detected {count} key individuals mentioned in this evidence.", "conf": 0.92},
            EntityType.ORG: {"type": "lead", "text": "Extracted {count} organizations which may be tied to external networks.", "conf": 0.88},
            EntityType.LOC: {"type": "lead", "text": "Found {count} geolocation references indicating physical movement.", "conf": 0.85},
            EntityType.EMAIL: {"type": "lead", "text": "Identified {count} email addresses for communication tracing.", "conf": 0.95},
            EntityType.PHONE: {"type": "lead", "text": "Extracted {count} phone numbers, potential targets for subscriber lookups.", "conf": 0.95},
            EntityType.URL: {"type": "info", "text": "Found {count} URLs pointing to external web resources.", "conf": 0.90},
            EntityType.DOMAIN: {"type": "info", "text": "Detected {count} domains which could be investigated for registration details.", "conf": 0.90},
            EntityType.IP: {"type": "lead", "text": "Extracted {count} IP addresses. Recommend cross-referencing with threat intel.", "conf": 0.98},
            EntityType.USERNAME: {"type": "lead", "text": "Found {count} usernames potentially linking to social media profiles.", "conf": 0.80},
            EntityType.DATE: {"type": "timeline", "text": "Extracted {count} dates mapped to the evidence timeline.", "conf": 0.99},
            EntityType.TIME: {"type": "timeline", "text": "Extracted {count} temporal metadata points mapped to timeline.", "conf": 0.99},
            EntityType.DEVICE: {"type": "info", "text": "Detected {count} hardware devices or software products.", "conf": 0.82},
            EntityType.FILE_HASH: {"type": "lead", "text": "Extracted {count} cryptographic hashes. Ready for malware sandbox verification.", "conf": 0.99},
            EntityType.SOCIAL_HANDLE: {"type": "lead", "text": "Found {count} social media handles for OSINT pivot.", "conf": 0.90},
            EntityType.CRYPTO_WALLET: {"type": "lead", "text": "Detected {count} cryptocurrency wallets. Recommended for blockchain tracing.", "conf": 0.99},
            EntityType.EVENT: {"type": "info", "text": "Identified {count} distinct events or activities within the text.", "conf": 0.85},
        }

        # Generate insights based on counts
        for ent_type, count in type_counts.items():
            if ent_type in insight_templates:
                t = insight_templates[ent_type]
                insights.append(AIInsightResponse(
                    id=str(uuid.uuid4()), type=t["type"], evidence_id=evidence_id,
                    text=t["text"].format(count=count),
                    confidence=t["conf"]
                ))
            else:
                # Fallback for any unexpected/new entity types
                insights.append(AIInsightResponse(
                    id=str(uuid.uuid4()), type="info", evidence_id=evidence_id,
                    text=f"Extracted {count} entities of type {ent_type.value if hasattr(ent_type, 'value') else str(ent_type)}.",
                    confidence=0.70
                ))

        if not insights and entities:
            insights.append(AIInsightResponse(
                id=str(uuid.uuid4()), type="info", evidence_id=evidence_id,
                text="Entities found, but no critical AI patterns detected yet.",
                confidence=0.5
            ))
            
        return insights

    @staticmethod
    def get_timeline(db: Session, evidence_id: str) -> TimelineResponse:
        events = []
        
        # 1. Processing Timeline
        processing_logs = db.query(ProcessingLog).filter(ProcessingLog.evidence_id == evidence_id).order_by(ProcessingLog.timestamp.asc()).all()
        for log in processing_logs:
            events.append(TimelineEventResponse(
                id=str(uuid.uuid4()),
                type="PROCESSING",
                event_name=log.step,
                timestamp=log.timestamp,
                details=log.message
            ))
            
        # 2. Evidence Timeline (from DATE/TIME entities)
        time_entities = db.query(ExtractedEntity).filter(
            ExtractedEntity.evidence_id == evidence_id,
            ExtractedEntity.entity_type.in_([EntityType.DATE, EntityType.TIME])
        ).all()
        
        for entity in time_entities:
            events.append(TimelineEventResponse(
                id=str(uuid.uuid4()),
                type="EVIDENCE",
                event_name=f"Extracted Event: {entity.entity_value}",
                timestamp=entity.extracted_at, 
                details=f"Context: {entity.context_snippet or 'None'}"
            ))
            
        events.sort(key=lambda x: x.timestamp)
        return TimelineResponse(evidence_id=evidence_id, events=events)

    @staticmethod
    def get_report_preview(db: Session, evidence_id: str) -> ReportPreviewResponse:
        sections = [
            ReportSectionPreview(id="exec_summary", title="Executive Summary", status="ready", summary_placeholder="AI-generated executive summary will appear here."),
            ReportSectionPreview(id="evidence_inventory", title="Evidence Inventory", status="ready", summary_placeholder="List of processed items related to this evidence."),
            ReportSectionPreview(id="timeline", title="Timeline", status="ready", summary_placeholder="Chronological event reconstruction."),
            ReportSectionPreview(id="knowledge_graph", title="Knowledge Graph Snapshot", status="ready", summary_placeholder="Visual graph of extracted relationships."),
            ReportSectionPreview(id="entity_analysis", title="Entity Analysis", status="processing", summary_placeholder="Detailed breakdown of detected entities."),
            ReportSectionPreview(id="ai_findings", title="AI Findings", status="ready", summary_placeholder="Key intelligence insights identified by NETHRA AI."),
            ReportSectionPreview(id="chain_of_custody", title="Chain of Custody", status="ready", summary_placeholder="Full audit trail and hash verifications."),
            ReportSectionPreview(id="recommendations", title="Recommendations", status="processing", summary_placeholder="Suggested next investigative steps.")
        ]
        return ReportPreviewResponse(evidence_id=evidence_id, sections=sections)
