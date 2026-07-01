"""
graph/relationships.py — Modular inference rule engine for NETHRA AI Knowledge Graph.

Design
------
Each rule is a dataclass implementing `InferenceRule`. To add a new relationship
type, create a subclass and add it to INFERENCE_RULES — no existing code changes.

Rules receive a list of entity nodes (already deduped `Entity` ORM objects) for
a single *evidence* and a *provenance* hint from the caller, and return a list
of `RelationshipSpec` named-tuples describing edges to persist.

The builder then deduplicates those edges before writing to the database.

Provenance values (recorded in relationships.provenance):
  same_document         – two entities appear anywhere in the same evidence
  same_whatsapp_message – both appear in a single parsed WhatsApp message turn
  same_page             – both appear on the same OCR page (future)
  same_sentence         – both appear in the same spaCy sentence (future)
"""
from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import NamedTuple

from app.models.graph import Entity

logger = logging.getLogger(__name__)


# ── RelationshipSpec ──────────────────────────────────────────────────────────

class RelationshipSpec(NamedTuple):
    """Describes a single edge to persist in the graph."""
    source_id: str          # Entity.id
    target_id: str          # Entity.id
    relationship_type: str
    provenance: str
    confidence: float
    properties: dict


# ── Base Rule ─────────────────────────────────────────────────────────────────

class InferenceRule(ABC):
    """
    Abstract base for all graph inference rules.

    Subclass this and register an instance in INFERENCE_RULES to add a new
    relationship type without touching any existing code.
    """

    @abstractmethod
    def infer(
        self,
        entities: list[Entity],
        provenance: str,
    ) -> list[RelationshipSpec]:
        """
        Given a list of entity nodes from one evidence item, return edges.

        Args:
            entities:   Deduped Entity ORM objects from one processing run.
            provenance: Context hint (e.g. 'same_document', 'same_whatsapp_message').

        Returns:
            List of RelationshipSpec to be persisted.
        """
        ...


# ── Concrete Rules ────────────────────────────────────────────────────────────

@dataclass
class PersonToTypeRule(InferenceRule):
    """
    Generalised PERSON → <target_type> rule.

    Cross-products every PERSON with every entity of `target_type` from the
    same evidence and emits a directed edge with `relationship_type`.
    """
    target_type: str
    relationship_type: str
    confidence: float = 0.85

    def infer(self, entities: list[Entity], provenance: str) -> list[RelationshipSpec]:
        persons = [e for e in entities if e.entity_type == "PERSON"]
        targets = [e for e in entities if e.entity_type == self.target_type]
        specs = []
        for person in persons:
            for target in targets:
                if person.id == target.id:
                    continue
                specs.append(RelationshipSpec(
                    source_id=person.id,
                    target_id=target.id,
                    relationship_type=self.relationship_type,
                    provenance=provenance,
                    confidence=self.confidence,
                    properties={},
                ))
        return specs


@dataclass
class EvidenceContainsRule(InferenceRule):
    """
    Emits EVIDENCE → Entity (CONTAINS) for every non-EVIDENCE entity.

    The evidence node must be included in the `entities` list by the caller
    (builder.py registers it before calling the rule engine).
    """

    def infer(self, entities: list[Entity], provenance: str) -> list[RelationshipSpec]:
        evidence_nodes = [e for e in entities if e.entity_type == "EVIDENCE"]
        content_nodes  = [e for e in entities if e.entity_type != "EVIDENCE"]
        specs = []
        for ev_node in evidence_nodes:
            for content in content_nodes:
                specs.append(RelationshipSpec(
                    source_id=ev_node.id,
                    target_id=content.id,
                    relationship_type="CONTAINS",
                    provenance=provenance,
                    confidence=1.0,
                    properties={},
                ))
        return specs


# ── Rule Registry ─────────────────────────────────────────────────────────────
# Add new rules here — NOTHING else needs to change.

INFERENCE_RULES: list[InferenceRule] = [
    EvidenceContainsRule(),
    PersonToTypeRule(target_type="EMAIL",         relationship_type="USES_EMAIL"),
    PersonToTypeRule(target_type="PHONE",         relationship_type="USES_PHONE"),
    PersonToTypeRule(target_type="ORG",           relationship_type="ASSOCIATED_WITH"),
    PersonToTypeRule(target_type="URL",           relationship_type="USES_URL"),
    PersonToTypeRule(target_type="DOMAIN",        relationship_type="USES_DOMAIN"),
    PersonToTypeRule(target_type="IP",            relationship_type="USES_IP"),
    PersonToTypeRule(target_type="CRYPTO_WALLET", relationship_type="USES_WALLET"),
]


# ── Public interface ──────────────────────────────────────────────────────────

def infer_relationships(
    entities: list[Entity],
    provenance: str = "same_document",
) -> list[RelationshipSpec]:
    """
    Run all registered inference rules against *entities* and return
    a deduplicated list of RelationshipSpecs.

    Deduplication key: (source_id, target_id, relationship_type).
    """
    seen: set[tuple[str, str, str]] = set()
    result: list[RelationshipSpec] = []

    for rule in INFERENCE_RULES:
        for spec in rule.infer(entities, provenance):
            key = (spec.source_id, spec.target_id, spec.relationship_type)
            if key not in seen:
                seen.add(key)
                result.append(spec)

    logger.debug("infer_relationships: %d specs from %d rules", len(result), len(INFERENCE_RULES))
    return result
