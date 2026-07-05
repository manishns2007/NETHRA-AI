"""
NETHRA AI — Context Builder.

Builds the structured prompt context sent to the Gemini LLM.

Changes from v1:
  - Evidence sections now include retrieval_score so the LLM understands relevance.
  - Empty retrieval produces an explicit "No Evidence Found" block instead of silence.
  - Query intent and detected forensic entities are surfaced to the LLM.
  - System instruction is strengthened: LLM must ONLY discuss evidence listed in
    the context and must NOT generate source attributions (the backend handles that).
  - Explicit instructions and categories regarding relationships to prevent hallucination.
"""

from __future__ import annotations

from typing import Any
from app.schemas.assistant import RelationshipCategory


class ContextBuilder:
    @staticmethod
    def build_context(
        data: dict[str, Any],
        intent: str | None = None,
        detected_entities: dict[str, list[str]] | None = None,
    ) -> str:
        parts: list[str] = []

        # --- Header ---
        parts.append("=== NETHRA AI — Investigation Context ===")
        if intent:
            parts.append(f"Query Intent: {intent}")
        
        rel_cat = data.get("relationship_category")
        if rel_cat:
            parts.append(f"Relationship Classification: {rel_cat}")

        if detected_entities:
            flat = ", ".join(
                f"{t}: {v}"
                for t, vals in detected_entities.items()
                for v in vals
            )
            parts.append(f"Detected Forensic Indicators: {flat}")
        parts.append("")

        # --- Evidence ---
        evidence_list = data.get("evidence", [])
        if evidence_list:
            parts.append("=== Relevant Evidence ===")
            for ev in evidence_list:
                score = ev.get("retrieval_score", 0)
                parts.append(
                    f"[Evidence ID: {ev.get('evidence_id')} | "
                    f"File: {ev.get('title')} | Relevance Score: {score}]"
                )
                reasons = ev.get("retrieval_reasons", [])
                if reasons:
                    parts.append(f"  Retrieved because: {', '.join(reasons[:3])}")
                text = ev.get("extracted_text", "").strip()
                if text:
                    # Truncate to 2000 chars per evidence item
                    parts.append(f"  Content:\n{text[:2000]}")
                parts.append("---")
        else:
            parts.append("=== Relevant Evidence ===")
            parts.append("[NO EVIDENCE FOUND — The database contains no matching records for this query.]")
            parts.append("---")

        # --- Entities ---
        entities = data.get("entities", [])
        parts.append("\n=== Extracted Entities ===")
        if entities:
            for ent in entities:
                parts.append(f"  - {ent.get('value')} ({ent.get('type')})")
        else:
            parts.append("  [None found]")

        # --- Relationships ---
        relationships = data.get("relationships", [])
        parts.append("\n=== Relationships ===")
        if relationships:
            for rel in relationships:
                parts.append(
                    f"  - {rel.get('source')} → [{rel.get('type')}] → {rel.get('target')}"
                    f"  (Provenance: {rel.get('provenance')})"
                )
        else:
            parts.append("  [None found]")

        # --- Threat Intelligence ---
        threats = data.get("threats", [])
        parts.append("\n=== Threat Intelligence ===")
        if threats:
            for t in threats:
                parts.append(f"  Entity: {t.get('entity')} ({t.get('type')})")
                intel = t.get("intelligence", {})
                for k, v in intel.items():
                    parts.append(f"    {k}: {v}")
                parts.append("  ---")
        else:
            parts.append("  [None found]")

        # --- Relationship analysis ---
        rel_analysis = data.get("relationship_analysis", {})
        shared = rel_analysis.get("shared_entities", [])
        if shared:
            parts.append("\n=== Shared Entities (across multiple evidence) ===")
            for s in shared:
                parts.append(
                    f"  - {s.get('value')} ({s.get('type')}) "
                    f"appears in {s.get('connected_evidence_count')} evidence items"
                )

        return "\n".join(parts)

    @staticmethod
    def build_instructions(empty_result: bool = False, rel_category: RelationshipCategory = RelationshipCategory.NONE) -> str:
        base = """
=== Instructions for NETHRA AI ===

You are NETHRA AI, a professional digital forensics and threat intelligence analyst.

STRICT RULES — follow exactly:
1. Answer ONLY using information present in the Investigation Context above.
2. If the context shows [NO EVIDENCE FOUND], respond with:
   "I couldn't find evidence related to '<subject>' in the current investigation."
   Do NOT speculate or invent information.
3. Do NOT invent entities, IP addresses, email addresses, relationships, or file names.
4. Do NOT add a "Sources" or "References" section to your answer. The backend
   generates source attribution automatically from retrieval metadata.
5. When you reference evidence, use the exact File name shown in the context
   (e.g., "According to mod3test2.txt...").
6. If the context contains evidence but none directly answers the question, say:
   "The available evidence does not contain enough information to answer this question."
7. Keep answers factual, concise, and professional.

=== Relationship Rules ===
- Never state that two entities are related solely because they appear in the same evidence.
- Clearly distinguish between explicit relationships, shared indicators, and co-occurrence.
- If evidence is insufficient, explicitly state that no direct relationship has been established.
"""
        
        if rel_category == RelationshipCategory.CO_OCCURRENCE:
            base += "\nNOTE: The backend indicates a CO_OCCURRENCE. These entities appear in the same evidence, but have NO explicit relationship graph edge. Do not overstate their association."
        elif rel_category == RelationshipCategory.SHARED_INDICATOR:
            base += "\nNOTE: The backend indicates a SHARED_INDICATOR. The entities are linked by a shared indicator (e.g. same IP/email/phone), mention this specifically."
        elif rel_category == RelationshipCategory.EXPLICIT_RELATIONSHIP:
            base += "\nNOTE: The backend indicates an EXPLICIT_RELATIONSHIP. Use the Relationships section to detail how they are connected."
        
        if empty_result:
            base += """
NOTE: No evidence was retrieved for this query. Do not guess or hallucinate.
"""
        return base
