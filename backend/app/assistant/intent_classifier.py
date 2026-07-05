"""
Intent Classifier for NETHRA AI Assistant.

Classifies a user question into one of 7 forensic investigation intents.
Classification is purely rule-based (regex + keyword patterns) so it is
deterministic and requires no external model.

Intents:
    ENTITY_LOOKUP       — "Who is John Doe?", "Tell me about 192.168.1.100"
    RELATIONSHIP_LOOKUP — "How are Alice and John related?"
    EVIDENCE_LOOKUP     — "Which evidence mentions Alice Smith?"
    INDICATOR_SEARCH    — "Is there an IP?", "Find all emails"
    INVESTIGATION_SUM   — "Summarise this investigation"
    THREAT_INTEL        — "Is this IP malicious?", "VirusTotal for ..."
    GENERAL             — fallback for everything else
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from enum import Enum


class Intent(str, Enum):
    ENTITY_LOOKUP = "ENTITY_LOOKUP"
    RELATIONSHIP_LOOKUP = "RELATIONSHIP_LOOKUP"
    EVIDENCE_LOOKUP = "EVIDENCE_LOOKUP"
    INDICATOR_SEARCH = "INDICATOR_SEARCH"
    INVESTIGATION_SUM = "INVESTIGATION_SUM"
    THREAT_INTEL = "THREAT_INTEL"
    GENERAL = "GENERAL"


@dataclass
class ClassifiedIntent:
    intent: Intent
    confidence: float          # 0.0 – 1.0
    detected_terms: list[str]  # words that triggered this intent


# ---------------------------------------------------------------------------
# Pattern groups (order matters — first match wins)
# ---------------------------------------------------------------------------

_RELATIONSHIP_PATTERNS = [
    r"\b(related|relation|connect|link|associat|between|and\b.+\band)\b",
    r"\bhow (are|is|were|was)\b.+\b(related|connected|linked)\b",
]

_EVIDENCE_PATTERNS = [
    r"\b(which|what|find|show|list|in|from|mention|appear|contain|found in)\b.*(evidence|document|file|report)",
    r"\b(evidence|document|file|report)\b.*(mention|contain|include|about)\b",
]

_INDICATOR_PATTERNS = [
    r"\b(ip address|email address|phone number|crypto wallet|hash|url|domain)\b",
    r"\b(any|all|find|list|show|are there)\b.*(ip|email|phone|wallet|hash|url|domain|indicator)\b",
    r"\b(ip|email|phone|wallet|hash|url|domain|indicator)s?\b.*(found|present|exist|in the|detected)\b",
]

_THREAT_PATTERNS = [
    r"\b(malicious|threat|malware|virus|attack|suspicious|abuseipdb|virustotal|whois|geoip|reputation)\b",
    r"\b(is|check|lookup|scan)\b.*(malicious|safe|clean|threat|harmful)\b",
]

_SUMMARY_PATTERNS = [
    r"\b(summaris|summariz|overview|summary|brief|all evidence|entire|whole|full report|everything)",
]

_ENTITY_LOOKUP_PATTERNS = [
    r"\b(who is|who are|what is|tell me about|describe|information about|details about|find|lookup)\b",
    r"\b(is|was|were|has|have)\b.+\b(related|found|detected|present|mentioned)\b",
]


def classify(question: str) -> ClassifiedIntent:
    """Return the most likely intent for the given question string."""
    q = question.lower()

    def _match(patterns: list[str]) -> list[str]:
        terms: list[str] = []
        for pat in patterns:
            for m in re.findall(pat, q):
                if isinstance(m, tuple):
                    terms.extend(t for t in m if t)
                else:
                    terms.append(m)
        return terms

    rel = _match(_RELATIONSHIP_PATTERNS)
    if rel:
        return ClassifiedIntent(Intent.RELATIONSHIP_LOOKUP, 0.9, rel)

    evidence = _match(_EVIDENCE_PATTERNS)
    if evidence:
        return ClassifiedIntent(Intent.EVIDENCE_LOOKUP, 0.85, evidence)

    indicator = _match(_INDICATOR_PATTERNS)
    if indicator:
        return ClassifiedIntent(Intent.INDICATOR_SEARCH, 0.90, indicator)

    threat = _match(_THREAT_PATTERNS)
    if threat:
        return ClassifiedIntent(Intent.THREAT_INTEL, 0.85, threat)

    summary = _match(_SUMMARY_PATTERNS)
    if summary:
        return ClassifiedIntent(Intent.INVESTIGATION_SUM, 0.90, summary)

    entity = _match(_ENTITY_LOOKUP_PATTERNS)
    if entity:
        return ClassifiedIntent(Intent.ENTITY_LOOKUP, 0.75, entity)

    return ClassifiedIntent(Intent.GENERAL, 0.5, [])
