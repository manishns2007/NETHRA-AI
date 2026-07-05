"""
Forensic Entity Detector for NETHRA AI Assistant.

Responsibilities:
  1. Extract structured forensic indicators from the question text using regex.
     (Email, IP, Phone, URL, Domain, Hash, Crypto Wallet)
  2. Resolve personal pronouns from conversation history when unambiguous.
  3. Clean the question into a stopword-free keyword list for keyword search.

Deliberately does NOT use capitalization heuristics for PERSON / ORG names.
Those are resolved via the database (ExtractedEntity table) instead.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field


# ---------------------------------------------------------------------------
# Forensic regex patterns
# ---------------------------------------------------------------------------

_PATTERNS: dict[str, str] = {
    "EMAIL":        r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}",
    "IP":           r"\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b",
    "PHONE":        r"\b(?:\+?\d[\d\s\-().]{7,}\d)\b",
    "FILE_HASH":    r"\b[0-9a-fA-F]{32}\b|\b[0-9a-fA-F]{40}\b|\b[0-9a-fA-F]{64}\b",
    "CRYPTO_WALLET": r"\b(?:bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}\b|"
                     r"\b0x[0-9a-fA-F]{40}\b|"                         # ETH
                     r"\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b",           # BTC legacy
    "URL":          r"https?://[^\s\"'>]+",
    "DOMAIN":       r"\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+(?:com|net|org|io|gov|edu|co|uk|in|info|biz|xyz|dev)\b",
}

# ---------------------------------------------------------------------------
# Stopword list for keyword cleaning
# ---------------------------------------------------------------------------

_STOPWORDS: frozenset[str] = frozenset({
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "shall",
    "should", "may", "might", "must", "can", "could", "to", "of", "in",
    "on", "at", "by", "for", "with", "about", "against", "between",
    "into", "through", "during", "before", "after", "above", "below",
    "from", "up", "down", "out", "off", "over", "under", "again",
    "further", "then", "once", "and", "but", "or", "nor", "so", "yet",
    "both", "either", "neither", "not", "only", "own", "same", "than",
    "too", "very", "just", "tell", "me", "my", "give", "show", "find",
    "any", "all", "who", "what", "when", "where", "how", "which",
    "that", "this", "these", "those", "there", "here", "if", "also",
    "such", "it", "its", "he", "she", "they", "we", "you", "his",
    "her", "their", "our", "your", "him", "them", "us", "i",
    "information", "details", "please", "mention", "mentioned",
    "related", "found", "evidence", "document", "file",
})

# Pronouns that can be resolved from history
_PRONOUNS: frozenset[str] = frozenset({
    "he", "she", "they", "him", "her", "them", "it",
    "his", "their", "hers", "its"
})


@dataclass
class DetectionResult:
    """Holds everything extracted from a question."""
    indicators: dict[str, list[str]] = field(default_factory=dict)
    """Type → list of matched values, e.g. {"IP": ["192.168.1.100"]}"""

    clean_keywords: list[str] = field(default_factory=list)
    """Stopword-free, punctuation-stripped keyword list for keyword search."""

    resolved_question: str = ""
    """Question after pronoun substitution (may equal the original)."""

    resolved_entity: str | None = None
    """The entity that replaced a pronoun, if any."""


def detect(question: str, history: list[dict] | None = None) -> DetectionResult:
    """
    Main entry point.

    Args:
        question: The raw user question.
        history:  List of {"role": "user"|"assistant", "content": "..."} dicts.
                  At most the 5 most recent turns are considered.

    Returns:
        DetectionResult with indicators, clean_keywords, and resolved_question.
    """
    resolved_q, resolved_entity = _resolve_pronouns(question, history or [])
    indicators = _extract_indicators(resolved_q)
    keywords = _clean_keywords(resolved_q)

    return DetectionResult(
        indicators=indicators,
        clean_keywords=keywords,
        resolved_question=resolved_q,
        resolved_entity=resolved_entity,
    )


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _extract_indicators(text: str) -> dict[str, list[str]]:
    """Extract structured forensic indicators using regex."""
    results: dict[str, list[str]] = {}
    for entity_type, pattern in _PATTERNS.items():
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            # Flatten in case of alternation groups returning tuples
            flat = []
            for m in matches:
                if isinstance(m, tuple):
                    flat.extend(v for v in m if v)
                else:
                    flat.append(m)
            results[entity_type] = list(dict.fromkeys(flat))  # deduplicate, preserve order
    return results


def _clean_keywords(text: str) -> list[str]:
    """Return stopword-free, punctuation-stripped words of length >= 3."""
    # Strip URLs first so they don't contribute garbage tokens
    text = re.sub(r"https?://\S+", "", text)
    # Remove punctuation except hyphens inside words
    text = re.sub(r"[^\w\s\-]", " ", text)
    tokens = text.lower().split()
    return [
        t for t in tokens
        if len(t) >= 3 and t not in _STOPWORDS and not t.isdigit()
    ]


def _resolve_pronouns(question: str, history: list[dict]) -> tuple[str, str | None]:
    """
    Replace an unambiguous pronoun with the last clearly mentioned entity.

    Rules:
    - Only replaces if the question contains a pronoun from _PRONOUNS.
    - Only replaces if the last user turn in history mentions exactly ONE
      capitalized noun phrase (heuristic: consecutive Title-case words).
    - If multiple candidates exist, leave the question unchanged.

    Returns (resolved_question, entity_or_None).
    """
    q_lower = question.lower()
    pronoun_found = next((p for p in _PRONOUNS if re.search(rf"\b{p}\b", q_lower)), None)
    if not pronoun_found:
        return question, None

    # Look at last 5 user turns for a candidate entity
    user_turns = [
        h["content"] for h in (history or [])[-5:]
        if h.get("role") == "user"
    ]
    if not user_turns:
        return question, None

    # Extract capitalized noun phrases from the most recent user turn
    last_turn = user_turns[-1]
    # Match sequences of Title-case words (basic Name detection only)
    candidates = re.findall(r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b", last_turn)
    # Filter out common sentence-starters that happen to be capitalized
    _sentence_starters = {"Who", "What", "Where", "When", "How", "Which",
                          "Is", "Are", "Was", "Were", "Tell", "Find", "Show",
                          "Give", "Please", "The", "A", "An"}
    candidates = [c for c in candidates if c not in _sentence_starters]

    if len(candidates) != 1:
        # Ambiguous — do not resolve
        return question, None

    entity = candidates[0]
    # Swap the pronoun for the entity name (case-insensitive match)
    resolved = re.sub(rf"\b{pronoun_found}\b", entity, question, flags=re.IGNORECASE)
    return resolved, entity
