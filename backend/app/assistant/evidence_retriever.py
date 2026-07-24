"""
Hybrid Evidence Retriever for NETHRA AI Assistant.

Retrieval pipeline (in order):
  1. Entity-first: query ExtractedEntity table by indicator type+value (deterministic, +100 pts)
  2. Named-entity DB lookup: search ExtractedEntity.entity_value ILIKE for keywords
     that survived stopword removal — catches PERSON/ORG names without capitalisation
     heuristics (+80 pts per match)
  3. Relationship lookup: if entities found, trace their relationships in the
     Relationship table to surface evidence connected via graph edges (+80 pts)
  4. Keyword search: ILIKE on OCRResult.extracted_text (+40 pts per keyword hit)
  5. Filename search: ILIKE on Evidence.original_filename (+60 pts per keyword hit)

All results are merged by evidence_id, scores accumulated, then ranked descending.
"""

from __future__ import annotations

import logging
from typing import Any

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.evidence import Evidence
from app.models.graph import Entity, Relationship
from app.models.intelligence import ExtractedEntity, OCRResult
from .retriever import BaseRetriever

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Retrieval weights
# ---------------------------------------------------------------------------
W_EXACT_INDICATOR   = 100   # regex-detected indicator found in ExtractedEntity
W_NAMED_ENTITY_DB   = 80    # keyword matched in ExtractedEntity.entity_value
W_RELATIONSHIP      = 80    # entity appears in a Relationship linked to evidence
W_FILENAME          = 60    # keyword in Evidence.original_filename
W_KEYWORD_OCR       = 40    # keyword in OCRResult.extracted_text
# W_SEMANTIC (+30) and W_THREAT (+20) are added by service.py after separate retrieval


class HybridEvidenceRetriever(BaseRetriever):
    """
    Replaces the original KeywordEvidenceRetriever.

    Public API is backward-compatible: retrieve(question, max_results, ...)
    Extended signature accepts optional intent + indicators from the new pipeline.
    """

    def retrieve(
        self,
        question: str,
        max_results: int = 5,
        intent: str | None = None,
        indicators: dict[str, list[str]] | None = None,
        clean_keywords: list[str] | None = None,
        evidence_id: str | None = None,
    ) -> dict[str, Any]:
        """
        Run the hybrid retrieval pipeline and return ranked evidence.

        Args:
            question:       Original (possibly pronoun-resolved) question.
            max_results:    Maximum number of evidence items to return.
            intent:         Classified intent string (optional, for future routing).
            indicators:     Pre-extracted regex indicators {type: [value, ...]}.
            clean_keywords: Stopword-free keyword list.
            evidence_id:    If set, BYPASS hybrid scoring and return ONLY this evidence.
                            This is used when the user has pinned a specific file in the UI.

        Returns:
            {"evidence": [...]}  compatible with the original contract.
        """
        # ------------------------------------------------------------------ #
        # PINNED MODE: If the caller specified an evidence_id, skip the full  #
        # corpus search entirely and return only that document.               #
        # ------------------------------------------------------------------ #
        if evidence_id:
            ev = (
                self.db.query(Evidence)
                .filter(Evidence.evidence_id == evidence_id)
                .first()
            )
            if not ev:
                logger.warning("Pinned evidence_id=%s not found in database.", evidence_id)
                return {"evidence": []}

            ocr_text = "\n".join(
                ocr.extracted_text for ocr in ev.ocr_results
                if ocr.extracted_text
            )
            logger.info(
                "HybridRetriever [PINNED MODE]: returning only evidence_id=%s title=%s",
                evidence_id, ev.original_filename,
            )
            return {
                "evidence": [{
                    "evidence_id": ev.evidence_id,
                    "title": ev.original_filename,
                    "uploaded_at": str(ev.uploaded_at),
                    "file_size": ev.file_size_bytes,
                    "extracted_text": ocr_text,
                    "retrieval_score": 200.0,  # Guaranteed highest score
                    "retrieval_reasons": ["pinned_by_investigator"],
                }]
            }
        indicators = indicators or {}
        clean_keywords = clean_keywords or _fallback_keywords(question)

        scores: dict[str, float] = {}  # evidence_id → cumulative score
        reason: dict[str, list[str]] = {}  # evidence_id → why it was retrieved

        def _add(eid: str, pts: float, label: str) -> None:
            scores[eid] = scores.get(eid, 0.0) + pts
            reason.setdefault(eid, []).append(label)

        # ------------------------------------------------------------------
        # Step 1 — Structured indicator lookup (DETERMINISTIC)
        # ------------------------------------------------------------------
        if indicators:
            from app.models.intelligence import EntityType
            for itype, values in indicators.items():
                try:
                    enum_itype = EntityType(itype)
                except ValueError:
                    continue  # Ignore invalid types just in case
                
                for val in values:
                    logger.debug(
                        "Structured Lookup | type=%s enum=%s value=%s",
                        itype,
                        enum_itype,
                        val,
                    )
                    rows = (
                        self.db.query(ExtractedEntity)
                        .filter(
                            ExtractedEntity.entity_type == enum_itype,
                            ExtractedEntity.normalized_value == val.lower(),
                        )
                        .all()
                    )
                    for row in rows:
                        _add(row.evidence_id, W_EXACT_INDICATOR,
                             f"indicator:{itype}={val}")

        # ------------------------------------------------------------------
        # Step 2 — Named-entity DB lookup via cleaned keywords
        #          (catches PERSON/ORG without capitalisation heuristics)
        # ------------------------------------------------------------------
        if clean_keywords:
            kw_filters = [
                ExtractedEntity.entity_value.ilike(f"%{kw}%")
                for kw in clean_keywords
            ]
            entity_rows = (
                self.db.query(ExtractedEntity)
                .filter(or_(*kw_filters))
                .limit(200)
                .all()
            )
            for row in entity_rows:
                # Weight by how many keywords matched this entity value
                val_lower = (row.entity_value or "").lower()
                hit_count = sum(1 for kw in clean_keywords if kw in val_lower)
                if hit_count:
                    _add(row.evidence_id, W_NAMED_ENTITY_DB * hit_count,
                         f"named_entity:{row.entity_type}={row.entity_value}")

        # ------------------------------------------------------------------
        # Step 3 — Relationship-linked evidence
        #          If entities were found in Steps 1+2, trace their graph
        #          connections to pull in relationship-adjacent evidence.
        # ------------------------------------------------------------------
        matched_eids = list(scores.keys())
        if matched_eids:
            # Get graph entity IDs for extracted entities we already found
            ext_entity_values = (
                self.db.query(ExtractedEntity.normalized_value)
                .filter(ExtractedEntity.evidence_id.in_(matched_eids))
                .distinct()
                .limit(50)
                .all()
            )
            norm_values = [r[0] for r in ext_entity_values if r[0]]
            if norm_values:
                graph_entities = (
                    self.db.query(Entity)
                    .filter(Entity.normalized_value.in_(norm_values))
                    .all()
                )
                graph_entity_ids = [e.id for e in graph_entities]
                if graph_entity_ids:
                    rels = (
                        self.db.query(Relationship)
                        .filter(
                            or_(
                                Relationship.source_entity_id.in_(graph_entity_ids),
                                Relationship.target_entity_id.in_(graph_entity_ids),
                            )
                        )
                        .limit(100)
                        .all()
                    )
                    for rel in rels:
                        if rel.evidence_id:
                            _add(rel.evidence_id, W_RELATIONSHIP,
                                 f"relationship:{rel.relationship_type}")

        # ------------------------------------------------------------------
        # Step 4 — Keyword search on OCR text
        # ------------------------------------------------------------------
        if clean_keywords:
            ocr_filters = [
                OCRResult.extracted_text.ilike(f"%{kw}%")
                for kw in clean_keywords
            ]
            ocr_rows = (
                self.db.query(OCRResult)
                .filter(or_(*ocr_filters))
                .limit(max_results * 10)
                .all()
            )
            for row in ocr_rows:
                text_lower = (row.extracted_text or "").lower()
                hit_count = sum(1 for kw in clean_keywords if kw in text_lower)
                if hit_count:
                    _add(row.evidence_id, W_KEYWORD_OCR * hit_count,
                         f"ocr_keyword:{hit_count}")

        # ------------------------------------------------------------------
        # Step 5 — Filename keyword match
        # ------------------------------------------------------------------
        if clean_keywords:
            fn_filters = [
                Evidence.original_filename.ilike(f"%{kw}%")
                for kw in clean_keywords
            ]
            fn_rows = (
                self.db.query(Evidence)
                .filter(or_(*fn_filters))
                .all()
            )
            for ev in fn_rows:
                name_lower = (ev.original_filename or "").lower()
                hit_count = sum(1 for kw in clean_keywords if kw in name_lower)
                if hit_count:
                    _add(ev.evidence_id, W_FILENAME * hit_count,
                         f"filename:{hit_count}")

        # ------------------------------------------------------------------
        # Step 6 — Fallback: most-recent evidence (when no keywords/indicators
        #          produced any search hits)
        # ------------------------------------------------------------------
        if not scores:
            recent = (
                self.db.query(Evidence)
                .order_by(Evidence.uploaded_at.desc())
                .limit(max_results)
                .all()
            )
            for ev in recent:
                _add(ev.evidence_id, 1.0, "fallback_recent")

        # ------------------------------------------------------------------
        # Step 7 — Rank, fetch full Evidence records, assemble result
        # ------------------------------------------------------------------
        ranked_ids = sorted(scores, key=lambda eid: scores[eid], reverse=True)
        top_ids = ranked_ids[:max_results]

        if not top_ids:
            logger.info("HybridRetriever: no evidence matched for question=%r", question)
            return {"evidence": []}

        evidence_rows = (
            self.db.query(Evidence)
            .filter(Evidence.evidence_id.in_(top_ids))
            .all()
        )
        # Preserve ranking order
        ev_map = {ev.evidence_id: ev for ev in evidence_rows}

        result = []
        for eid in top_ids:
            ev = ev_map.get(eid)
            if not ev:
                continue
            # Attach up to 3 OCR pages worth of text for context
            ocr_text = "\n".join(
                ocr.extracted_text for ocr in ev.ocr_results[:3]
                if ocr.extracted_text
            )
            result.append({
                "evidence_id": ev.evidence_id,
                "title": ev.original_filename,
                "uploaded_at": str(ev.uploaded_at),
                "file_size": ev.file_size_bytes,
                "extracted_text": ocr_text,
                "retrieval_score": round(scores[eid], 2),
                "retrieval_reasons": reason.get(eid, []),
            })

        logger.info(
            "HybridRetriever: found %d evidence items | top_score=%.1f | keywords=%s | indicators=%s",
            len(result),
            scores.get(top_ids[0], 0) if top_ids else 0,
            clean_keywords[:5],
            list(indicators.keys()),
        )
        return {"evidence": result}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _fallback_keywords(question: str) -> list[str]:
    """Minimal keyword extraction used only when the caller skips entity_detector."""
    import re
    _STOPWORDS = {
        "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
        "have", "has", "had", "do", "does", "did", "will", "would", "shall",
        "should", "may", "might", "must", "can", "could", "to", "of", "in",
        "on", "at", "by", "for", "with", "about", "and", "but", "or", "nor",
        "not", "who", "what", "when", "where", "how", "which", "that", "this",
        "there", "here", "tell", "me", "give", "show", "find", "any", "all",
        "it", "its", "he", "she", "they", "we", "you", "him", "her", "them",
    }
    text = re.sub(r"[^\w\s]", " ", question.lower())
    return [t for t in text.split() if len(t) >= 3 and t not in _STOPWORDS]


# Keep the old name as an alias so any other import doesn't break
KeywordEvidenceRetriever = HybridEvidenceRetriever
