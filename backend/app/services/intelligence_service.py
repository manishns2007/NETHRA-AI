import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.intelligence import ExtractedEntity, EntityType, ProcessingLog
from app.schemas.intelligence import AIInsightResponse, TimelineEventResponse, TimelineResponse, ReportSectionPreview, ReportPreviewResponse

class IntelligenceService:
    @staticmethod
    def get_insights(db: Session, evidence_id: str) -> list[AIInsightResponse]:
        entities = db.query(ExtractedEntity).filter(ExtractedEntity.evidence_id == evidence_id).all()
        
        if not entities:
            return []
            
        persons = [e for e in entities if e.entity_type == EntityType.PERSON]
        orgs = [e for e in entities if e.entity_type == EntityType.ORG]
        locations = [e for e in entities if e.entity_type == EntityType.LOC]
        dates = [e for e in entities if e.entity_type == EntityType.DATE or e.entity_type == EntityType.TIME]

        insights = []
        if persons:
            insights.append(AIInsightResponse(
                id=str(uuid.uuid4()), type="lead", evidence_id=evidence_id,
                text=f"Detected {len(persons)} key individuals mentioned in this evidence.",
                confidence=0.92
            ))
        if orgs:
            insights.append(AIInsightResponse(
                id=str(uuid.uuid4()), type="lead", evidence_id=evidence_id,
                text=f"Extracted {len(orgs)} organizations which may be tied to external networks.",
                confidence=0.88
            ))
        if locations:
            insights.append(AIInsightResponse(
                id=str(uuid.uuid4()), type="lead", evidence_id=evidence_id,
                text=f"Found {len(locations)} geolocation references indicating physical movement.",
                confidence=0.85
            ))
        if dates:
            insights.append(AIInsightResponse(
                id=str(uuid.uuid4()), type="timeline", evidence_id=evidence_id,
                text=f"Extracted {len(dates)} temporal metadata points mapped to evidence timeline.",
                confidence=0.99
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
