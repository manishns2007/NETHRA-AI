"""
Named Entity Recognition (NER) service for NETHRA AI.

Hybrid pipeline — regex is the authoritative extractor; an LLM is a
semantic supplement only:

  - Regex (primary): deterministic, high-precision extraction of structured
    patterns — EMAIL, PHONE, URL, DOMAIN, IP, FILE_HASH, CRYPTO_WALLET,
    SOCIAL_HANDLE.  All regex spans are masked before the LLM runs.

  - LLM (supplement): probabilistic extraction restricted to PERSON, ORG,
    LOC, EVENT, and DEVICE only.  A multi-layer
    post-processing filter then rejects:
      • Entities shorter than 3 characters.
      • Purely numeric entities.
      • Any value that matches a regex pattern (email, IP, hash, …).
      • Tech-stack terms and cybersecurity jargon (React, Docker, …).
      • Generic forensic field labels (Server IP, Wallet, API, …).
      • Entities preceded by context keywords (Server, Wallet, Phone, …).

All entities are normalized for reliable cross-evidence correlation.
Context snippets are captured for every entity for explainable reporting.
"""
from __future__ import annotations

import re
import hashlib
from typing import Any
from urllib.parse import urlparse


# ── Regex Patterns ─────────────────────────────────────────────────────────────

_PATTERNS: dict[str, re.Pattern] = {
    "EMAIL": re.compile(
        r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b"
    ),
    "PHONE": re.compile(
        r"(?<!\w)(?:(?:\+91|91|0)[\-\s]?)?[6-9]\d{9}(?!\w)"
    ),
    "IP": re.compile(
        r"\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b"
    ),
    "URL": re.compile(
        r"https?://[^\s<>\"']+", re.IGNORECASE
    ),
    "DOMAIN": re.compile(
        r"\b(?:[a-zA-Z0-9\-]+\.)+(?:com|net|org|edu|gov|io|in|co|uk|de|fr|pk|ru|cn)\b",
        re.IGNORECASE,
    ),
    "FILE_HASH": re.compile(
        r"\b[0-9a-fA-F]{32}\b|\b[0-9a-fA-F]{40}\b|\b[0-9a-fA-F]{64}\b"
    ),
    "CRYPTO_WALLET": re.compile(
        r"\b(?:bc1|[13])[a-km-zA-HJ-NP-Z1-9]{25,42}\b"  # Bitcoin
        r"|\b0x[0-9a-fA-F]{40}\b"  # Ethereum
    ),
    "SOCIAL_HANDLE": re.compile(
        r"(?<!\w)@[A-Za-z0-9_]{1,50}(?!\w)"
    ),
}

# ── Normalization ───────────────────────────────────────────────────────────────

def _normalize(entity_type: str, value: str) -> str:
    """
    Produce a canonical form of an entity value for cross-evidence correlation.

    Examples:
      PHONE   '+91 98765-43210'  → '919876543210'
      URL     'HTTPS://Example.com/path' → 'example.com'
      DOMAIN  'Example.COM' → 'example.com'
      EMAIL   'John.Doe@EXAMPLE.com' → 'john.doe@example.com'
      PERSON  'John DOE' → 'john doe'
    """
    if entity_type == "PHONE":
        return re.sub(r"[^\d+]", "", value).lstrip("+")
    if entity_type in ("URL",):
        try:
            parsed = urlparse(value.lower())
            return parsed.netloc or parsed.path
        except Exception:
            return value.lower()
    if entity_type in ("EMAIL", "DOMAIN", "IP", "FILE_HASH", "CRYPTO_WALLET"):
        return value.lower().strip()
    if entity_type in ("SOCIAL_HANDLE",):
        return value.lstrip("@").lower()
    # Default: lowercase and strip for PERSON, ORG, LOC, DATE, TIME, DEVICE, etc.
    return value.lower().strip()


# ── Context Snippet Helper ──────────────────────────────────────────────────────

def _context(text: str, start: int, end: int, window: int = 80) -> str:
    """Extract surrounding context for an entity match."""
    ctx_start = max(0, start - window)
    ctx_end = min(len(text), end + window)
    snippet = text[ctx_start:ctx_end].replace("\n", " ")
    return f"...{snippet}..." if ctx_start > 0 or ctx_end < len(text) else snippet


# ── LLM Extraction ────────────────────────────────────────────────────────────
import json
import logging
from app.assistant.llm import LLMProvider

logger = logging.getLogger(__name__)

# Map expected JSON keys from LLM to our EntityType enum values
_LLM_LABEL_MAP = {
    "persons": "PERSON",
    "organizations": "ORG",
    "locations": "LOC",
    "events": "EVENT",
    "devices": "DEVICE",
    "evidence_objects": "DEVICE"
}

_GENERIC_STOP_PHRASES = {
    "server ip", "website", "phone", "wallet", "email",
    "report", "meeting", "document", "attachment", "file",
    "image", "video", "ui", "css", "api", "hackathon finalist",
    "ethical hacking"
}

_TECH_STOPWORDS = {
    "react", "node.js", "github", "fastapi", "postgresql", "mongodb", 
    "docker", "git", "firebase", "numpy", "pandas", "wireshark"
}

_CONTEXT_REJECTION_KEYWORDS = {
    "server", "wallet", "phone", "website", "email", "api", "port", "hash", "checksum"
}

_NORMALIZED_STOPWORDS = {re.sub(r"[^\w]", "", w).lower() for w in _TECH_STOPWORDS | _GENERIC_STOP_PHRASES}

_FORENSIC_LABELS = [
    "server ip", "ip address", "website", "email", "wallet", "phone",
    "mac address", "sha256", "md5", "hash", "file hash", "domain", "hostname",
    "ip", "port", "checksum"
]

def _extract_llm(text: str, original_text: str = None) -> list[dict[str, Any]]:
    """
    Run LLM NER on text and return structured entity dicts.
    """
    try:
        llm = LLMProvider()
    except Exception as e:
        logger.error("Failed to initialize LLM provider for NER: %s", e)
        return []

    prompt = (
        "Extract the following entities from the text below: persons, organizations, locations, events, devices, evidence_objects.\n"
        "Return the result ONLY as a valid JSON object with these keys (each mapping to a list of strings).\n"
        "Do not include any other text, markdown formatting (like ```json), or explanations.\n"
        "If a category has no entities, return an empty list for that key.\n\n"
        "TEXT:\n"
        f"{text[:10000]}"
    )
    
    try:
        response_text = llm.generate_response(context="", question=prompt, instructions="")
        # Remove any markdown code blocks
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
            
        data = json.loads(response_text.strip())
    except Exception as e:
        logger.error("LLM NER extraction failed: %s", e)
        return []

    entities = []
    seen = set()

    for category, items in data.items():
        label = _LLM_LABEL_MAP.get(category.lower())
        if not label or not isinstance(items, list):
            continue

        for value in items:
            value = str(value).strip()
            if not value or (label, value.lower()) in seen:
                continue
                
            # Post-processing validation
            if len(value) < 3:
                continue
                
            if value.isdigit():
                continue
                
            normalized_for_stop = re.sub(r"[^\w]", "", value).lower()
            if normalized_for_stop in _NORMALIZED_STOPWORDS:
                continue
                
            # Reject if it fully matches any regex pattern
            is_regex_match = False
            for pattern in _PATTERNS.values():
                if pattern.fullmatch(value):
                    is_regex_match = True
                    break
            if is_regex_match:
                continue
                
            # Find context snippet by simple text search (first occurrence)
            ctx_text = original_text if original_text is not None else text
            start_char = ctx_text.lower().find(value.lower())
            
            if start_char != -1:
                end_char = start_char + len(value)
                
                # Context-aware rejection
                preceding_text = ctx_text[max(0, start_char - 25):start_char].lower()
                has_context_rejection = False
                for kw in _CONTEXT_REJECTION_KEYWORDS:
                    if re.search(r'\b' + re.escape(kw) + r'\b\W*$', preceding_text):
                        has_context_rejection = True
                        break
                if has_context_rejection:
                    continue
                    
                context_snippet = _context(ctx_text, start_char, end_char)
            else:
                context_snippet = f"...{value}..."

            seen.add((label, value.lower()))

            entities.append(
                {
                    "entity_type": label,
                    "entity_value": value,
                    "normalized_value": _normalize(label, value),
                    "context_snippet": context_snippet,
                    "confidence": 0.85, 
                    "extraction_method": "LLM",
                }
            )

    return entities


# ── Regex Extraction ────────────────────────────────────────────────────────────

def _extract_regex(text: str) -> list[dict[str, Any]]:
    """Run all regex patterns against text and return structured entity dicts."""
    entities = []
    seen = set()

    for entity_type, pattern in _PATTERNS.items():
        for match in pattern.finditer(text):
            value = match.group(0).strip()
            if not value or (entity_type, value.lower()) in seen:
                continue

            # Filter out false-positive PHONE matches that are too short
            if entity_type == "PHONE" and len(re.sub(r"\D", "", value)) < 7:
                continue

            seen.add((entity_type, value.lower()))
            entities.append(
                {
                    "entity_type": entity_type,
                    "entity_value": value,
                    "normalized_value": _normalize(entity_type, value),
                    "context_snippet": _context(text, match.start(), match.end()),
                    "confidence": 0.95,  # Regex matches are high-confidence
                    "extraction_method": "REGEX",
                    "_span": (match.start(), match.end()),
                }
            )

    return entities


# ── Public Interface ────────────────────────────────────────────────────────────

def _mask_text(text: str, spans: list[tuple[int, int]]) -> str:
    """Mask specified spans in the text with spaces to prevent spaCy from parsing them."""
    if not spans:
        return text
    
    # Sort spans and merge them in case of overlaps
    spans.sort()
    merged = []
    for s in spans:
        if not merged:
            merged.append(s)
        else:
            last = merged[-1]
            if s[0] <= last[1]:
                merged[-1] = (last[0], max(last[1], s[1]))
            else:
                merged.append(s)
    
    masked = list(text)
    for start, end in merged:
        for i in range(start, end):
            if masked[i] not in ("\n", "\r"):
                masked[i] = " "
    return "".join(masked)


def _clean_forensic_labels(text: str) -> str:
    """Mask common forensic field labels so spaCy doesn't extract them as entities."""
    if not text:
        return text
    
    # Build a combined regex for the labels
    labels = [re.escape(label) for label in _FORENSIC_LABELS]
    # Use negative lookarounds or word boundaries depending on the label, but \b works well for English terms
    pattern = re.compile(r"\b(?:" + "|".join(labels) + r")\b", re.IGNORECASE)
    
    masked = list(text)
    for match in pattern.finditer(text):
        for i in range(match.start(), match.end()):
            if masked[i] not in ("\n", "\r"):
                masked[i] = " "
    return "".join(masked)


def _parse_whatsapp(text: str) -> list[tuple[str, str, str]]:
    """
    Parse WhatsApp chat export into structured records: (timestamp, sender, message).
    If no matches are found, returns an empty list.
    """
    # Matches various formats: "30/06/2026, 10:32 PM - John Doe: " or "[30-06-2026 10:32:00] John Doe:"
    pattern = re.compile(
        r"^\s*\[?(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}[,\s]+\d{1,2}:\d{2}(?::\d{2})?(?:[\s\u202F]?[aApP][mM])?)\]?\s*(?:-)?\s*(.*?):\s*", 
        re.MULTILINE
    )
    
    records = []
    last_end = 0
    last_timestamp = None
    last_sender = None
    
    for match in pattern.finditer(text):
        if last_sender is not None:
            message = text[last_end:match.start()].strip()
            if message:
                records.append((last_timestamp, last_sender, message))
        
        last_timestamp = match.group(1)
        last_sender = match.group(2)
        last_end = match.end()
        
    if last_sender is not None:
        message = text[last_end:].strip()
        if message:
            records.append((last_timestamp, last_sender, message))
            
    return records


def _process_text_segment(text: str) -> list[dict[str, Any]]:
    """Process a segment of text with regex and masked LLM extraction."""
    regex_entities = _extract_regex(text)
    
    # Clean forensic labels
    cleaned_text = _clean_forensic_labels(text)
    
    # Extract spans to mask
    spans_to_mask = []
    for ent in regex_entities:
        if "_span" in ent:
            spans_to_mask.append(ent.pop("_span"))
            
    masked_text = _mask_text(cleaned_text, spans_to_mask)
    llm_entities = _extract_llm(masked_text, original_text=text)
    
    return regex_entities + llm_entities


def extract_entities(text: str) -> list[dict[str, Any]]:
    """
    Extract all named entities from the provided text using the hybrid pipeline.

    Regex patterns are run first (deterministic, high precision).
    Regex spans are masked before the LLM is run to reduce false positives.
    WhatsApp chats are parsed into structured logs to avoid extracting from metadata.
    Duplicates produced by both engines are deduplicated by (type, normalized_value).

    Args:
        text: The full extracted text to analyse.

    Returns:
        List of entity dicts ready for persistence into extracted_entities table.
    """
    if not text or not text.strip():
        return []

    records = _parse_whatsapp(text)
    all_entities = []

    if records:
        for timestamp, sender, message in records:
            sender = sender.strip()
            if sender:
                all_entities.append({
                    "entity_type": "PERSON",
                    "entity_value": sender,
                    "normalized_value": _normalize("PERSON", sender),
                    "context_snippet": f"{timestamp} - {sender}: {message[:40]}",
                    "confidence": 1.0,
                    "extraction_method": "STRUCTURED"
                })
            
            msg_entities = _process_text_segment(message)
            all_entities.extend(msg_entities)
    else:
        all_entities = _process_text_segment(text)

    # Deduplicate: prefer regex entries when entity_type + normalized_value collide
    seen: set[tuple[str, str]] = set()
    merged: list[dict[str, Any]] = []

    for entity in all_entities:
        key = (entity["entity_type"], entity["normalized_value"])
        if key not in seen:
            seen.add(key)
            merged.append(entity)

    return merged
