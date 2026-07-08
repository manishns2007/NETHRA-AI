"""
NETHRA AI — Assistant Orchestration Service.

Pipeline:
  1. Pronoun resolution (conversation-aware)
  2. Intent classification (7 intents)
  3. Forensic entity detection (regex indicators)
  4. Hybrid evidence retrieval (entity-first + keyword + relationship)
  5. Graph retrieval (entities + relationships from found evidence)
  6. Relationship analysis retrieval
  7. Threat intelligence retrieval
  8. Context assembly
  9. LLM generation
  10. Confidence-based source attribution (backend-determined)
"""

from __future__ import annotations

import logging
import time

from sqlalchemy.orm import Session

from .context_builder import ContextBuilder
from .entity_detector import detect as detect_entities
from .evidence_retriever import HybridEvidenceRetriever
from .graph_retriever import GraphRetriever
from .intent_classifier import Intent, classify as classify_intent
from .llm import LLMProvider
from .relationship_retriever import RelationshipRetriever
from .threat_retriever import ThreatRetriever
from app.schemas.assistant import AssistantRequest, AssistantResponse, SourceMetadata, ConfidenceTier, RelationshipCategory

logger = logging.getLogger(__name__)


def ask_assistant(db: Session, request: AssistantRequest) -> AssistantResponse:
    start_time = time.time()
    raw_question = request.question
    history = request.history[-5:] if request.history else []

    # 1. Pronoun resolution + entity detection
    detection = detect_entities(raw_question, history)
    question = detection.resolved_question
    indicators = detection.indicators
    clean_keywords = detection.clean_keywords

    if detection.resolved_entity:
        logger.info("Pronoun '%s' resolved to entity '%s'", raw_question, detection.resolved_entity)

    # 2. Intent classification
    classified = classify_intent(question)
    intent = classified.intent

    # 3. Hybrid evidence retrieval
    t0 = time.time()
    evidence_retriever = HybridEvidenceRetriever(db)
    evidence_data = evidence_retriever.retrieve(
        question=question,
        max_results=6,
        intent=intent.value,
        indicators=indicators,
        clean_keywords=clean_keywords,
        evidence_id=request.evidence_id,   # ← pin to selected evidence when set
    )
    evidence_items = evidence_data.get("evidence", [])
    evidence_ids = [ev["evidence_id"] for ev in evidence_items]

    # 4. Graph retrieval
    graph_retriever = GraphRetriever(db)
    graph_data: dict = {"entities": [], "relationships": []}
    if evidence_ids:
        graph_data = graph_retriever.retrieve(evidence_ids, max_entities=30)

    entities = graph_data.get("entities", [])
    entity_ids = [e["id"] for e in entities]

    # 5. Relationship analysis
    relationship_retriever = RelationshipRetriever(db)
    relationship_data: dict = {"relationship_analysis": {}}
    if evidence_ids:
        relationship_data = relationship_retriever.retrieve(evidence_ids)

    # 6. Threat intelligence
    threat_retriever = ThreatRetriever(db)
    threat_data: dict = {"threats": []}
    if entity_ids:
        threat_data = threat_retriever.retrieve(entity_ids, max_threats=10)

    retrieval_duration = time.time() - t0

    # 7. Classify Relationship Category
    # Figure out the overall relationship category of the retrieved context
    has_explicit = len(graph_data.get("relationships", [])) > 0
    has_shared = len(relationship_data.get("relationship_analysis", {}).get("shared_entities", [])) > 0
    
    if has_explicit:
        rel_category = RelationshipCategory.EXPLICIT_RELATIONSHIP
    elif has_shared:
        rel_category = RelationshipCategory.SHARED_INDICATOR
    elif len(evidence_items) > 0 and len(entities) > 1:
        rel_category = RelationshipCategory.CO_OCCURRENCE
    else:
        rel_category = RelationshipCategory.NONE

    # 8. Context assembly
    t0 = time.time()
    all_data = {
        "evidence": evidence_items,
        "entities": entities,
        "relationships": graph_data.get("relationships", []),
        "threats": threat_data.get("threats", []),
        "relationship_analysis": relationship_data.get("relationship_analysis", {}),
        "relationship_category": rel_category.value
    }
    empty_result = len(evidence_items) == 0
    context_str = ContextBuilder.build_context(
        all_data,
        intent=intent.value,
        detected_entities=indicators if indicators else None,
    )
    instructions_str = ContextBuilder.build_instructions(
        empty_result=empty_result,
        rel_category=rel_category,
        pinned_evidence_id=request.evidence_id,
        pinned_evidence_title=evidence_items[0]["title"] if request.evidence_id and evidence_items else None,
    )
    context_duration = time.time() - t0

    # 9. LLM generation
    t0 = time.time()
    llm = LLMProvider()
    answer = llm.generate_response(context_str, question, instructions_str, history)
    llm_duration = time.time() - t0

    # 10. Confidence-based source attribution
    sources: list[SourceMetadata] = []
    seen: set[tuple] = set()

    def _add_source(s: SourceMetadata) -> None:
        key = (s.type, s.id, s.name, s.title)
        if key not in seen:
            seen.add(key)
            sources.append(s)

    # Classify Evidence Tiers
    high_evidence = []
    medium_evidence = []
    low_evidence = []
    
    top_score = max((ev.get("retrieval_score", 0) for ev in evidence_items), default=0)

    for ev in evidence_items:
        score = ev.get("retrieval_score", 0)
        reasons = ev.get("retrieval_reasons", [])
        
        # Determine primary reason string
        primary_reason = reasons[0] if reasons else "Keyword/Semantic Fallback"
        if score >= 80:
            tier = ConfidenceTier.HIGH
            high_evidence.append((ev, tier, primary_reason))
        elif score >= 60:
            tier = ConfidenceTier.MEDIUM
            medium_evidence.append((ev, tier, primary_reason))
        else:
            tier = ConfidenceTier.LOW
            low_evidence.append((ev, tier, primary_reason))

    # Select Evidence Sources
    selected_evidence = high_evidence
    if not high_evidence:
        selected_evidence = medium_evidence
    # Optionally, include Medium if they complement High
    elif top_score >= 100:
        # If we have a deterministic 100 match, maybe include 80s, but here HIGH encompasses >=80.
        pass 

    logger.debug(f"Source Attribution | Top score: {top_score}")
    logger.debug("Selected sources:")
    for ev, tier, reason in selected_evidence:
        logger.debug(f"- {ev.get('title')} ({ev.get('retrieval_score')}) {tier.value} | {reason}")
        _add_source(SourceMetadata(
            type="Evidence",
            id=str(ev.get("evidence_id")),
            title=ev.get("title"),
            retrieval_score=ev.get("retrieval_score"),
            confidence_level=tier,
            retrieval_reason=reason
        ))

    logger.debug("Discarded sources:")
    discarded = [e for e in medium_evidence if e not in selected_evidence] + low_evidence
    for ev, tier, reason in discarded:
        logger.debug(f"- {ev.get('title')} ({ev.get('retrieval_score')}) {tier.value} | {reason}")

    # Select Entity Sources
    # Only cite entities that were specifically detected in the question or linked explicitly
    # We shouldn't blindly cite all 30 graph entities.
    detected_entity_names = set(v.lower() for vals in indicators.values() for v in vals)
    if detection.resolved_entity:
        detected_entity_names.add(detection.resolved_entity.lower())
    for kw in clean_keywords:
        detected_entity_names.add(kw.lower())

    for ent in entities:
        ent_val = str(ent.get("value")).lower()
        # Include if it matches a query keyword or is part of a relationship target
        is_relevant = any(k in ent_val for k in detected_entity_names)
        if is_relevant or intent == Intent.ENTITY_LOOKUP:
            _add_source(SourceMetadata(
                type="Entity",
                id=str(ent.get("id")),
                name=ent.get("value"),
                retrieval_reason="Detected in query/graph"
            ))

    # Select Threat Sources
    for t in threat_data.get("threats", []):
        _add_source(SourceMetadata(
            type="Threat Intelligence",
            name=t.get("entity"),
            retrieval_reason="Threat Intelligence Match"
        ))

    # 11. Confidence score
    confidence_score = 0.0
    if high_evidence:
        confidence_score += 0.60
    elif medium_evidence:
        confidence_score += 0.30
        
    if entities:
        confidence_score += 0.20
    if rel_category == RelationshipCategory.EXPLICIT_RELATIONSHIP:
        confidence_score += 0.20
    if threat_data.get("threats"):
        confidence_score += 0.10
    confidence = min(round(confidence_score, 2), 1.0)

    total_duration = time.time() - start_time
    logger.info(
        "Assistant | intent=%s | evidence=%d | entities=%d | "
        "retrieval=%.2fs | context=%.2fs | llm=%.2fs | total=%.2fs | confidence=%.2f",
        intent.value, len(evidence_ids), len(entity_ids),
        retrieval_duration, context_duration, llm_duration, total_duration, confidence,
    )

    return AssistantResponse(answer=answer, confidence=confidence, sources=sources)
