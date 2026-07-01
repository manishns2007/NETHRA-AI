"""
graph/normalizer.py — Type-aware entity normalization for NETHRA AI Knowledge Graph.

All deduplication operates exclusively on normalized values produced by this module.
Adding support for a new entity type requires only extending the `normalize_entity`
dispatch table — no other graph module needs to change.

Supported types and their canonical forms:
  EMAIL         → lowercase stripped
  PHONE         → digits only, country prefix kept (e.g. '919876543210')
  DOMAIN        → lowercase, trailing-dot stripped
  URL           → scheme-less lowercase netloc (e.g. 'example.com/path')
  IP            → stripped lowercase (IPv4/IPv6)
  FILE_HASH     → lowercase hex
  CRYPTO_WALLET → lowercase
  SOCIAL_HANDLE → leading '@' removed, lowercase
  PERSON        → lowercase stripped (whitespace-normalized)
  ORG           → lowercase stripped
  LOC           → lowercase stripped
  DATE          → stripped
  TIME          → stripped
  DEVICE        → lowercase stripped
  USERNAME      → lowercase stripped
  EVIDENCE      → stripped (UUID, kept as-is)
  default       → lowercase stripped
"""
from __future__ import annotations

import re
from urllib.parse import urlparse


# ── Type-aware normalisers ────────────────────────────────────────────────────

def _norm_email(value: str) -> str:
    return value.lower().strip()


def _norm_phone(value: str) -> str:
    """Remove all non-digit characters, strip leading zeros unless it's a country code."""
    digits = re.sub(r"[^\d]", "", value)
    # Remove leading '+' that was kept after regex strip  
    return digits.lstrip("+")


def _norm_domain(value: str) -> str:
    domain = value.lower().strip()
    # Remove trailing dot (FQDN)
    return domain.rstrip(".")


def _norm_url(value: str) -> str:
    """Produce a stable, scheme-less form: netloc + path (lowercase)."""
    try:
        parsed = urlparse(value.lower().strip())
        netloc = parsed.netloc or ""
        path = parsed.path.rstrip("/") if parsed.path else ""
        normalized = netloc + path
        return normalized if normalized else value.lower().strip()
    except Exception:
        return value.lower().strip()


def _norm_ip(value: str) -> str:
    return value.strip().lower()


def _norm_file_hash(value: str) -> str:
    return value.lower().strip()


def _norm_crypto_wallet(value: str) -> str:
    return value.strip()  # Case-sensitive for Bitcoin; Ethereum hex → lower
    # Ethereum wallets start with '0x'
    if value.startswith("0x") or value.startswith("0X"):
        return value.lower().strip()
    return value.strip()


def _norm_social_handle(value: str) -> str:
    return value.lstrip("@").lower().strip()


def _norm_person(value: str) -> str:
    """Collapse whitespace and lowercase."""
    return re.sub(r"\s+", " ", value).lower().strip()


def _norm_generic(value: str) -> str:
    return value.lower().strip()


# Dispatch table — extend here for new entity types
_NORMALIZERS = {
    "EMAIL":         _norm_email,
    "PHONE":         _norm_phone,
    "DOMAIN":        _norm_domain,
    "URL":           _norm_url,
    "IP":            _norm_ip,
    "FILE_HASH":     _norm_file_hash,
    "CRYPTO_WALLET": _norm_crypto_wallet,
    "SOCIAL_HANDLE": _norm_social_handle,
    "PERSON":        _norm_person,
    "ORG":           _norm_generic,
    "LOC":           _norm_generic,
    "DATE":          _norm_generic,
    "TIME":          _norm_generic,
    "DEVICE":        _norm_generic,
    "USERNAME":      _norm_generic,
    "EVIDENCE":      str.strip,
}


# ── Public interface ──────────────────────────────────────────────────────────

def normalize_entity(entity_type: str, value: str) -> str:
    """
    Return the canonical form of *value* for the given *entity_type*.

    Falls back to generic lowercase-strip if the type is unknown, so the
    normalizer is safe to call with future enrichment types as well.

    Args:
        entity_type: Entity type string (e.g. 'EMAIL', 'PERSON').
        value:       Raw extracted or enriched value.

    Returns:
        A stable canonical string safe to use as a deduplication key.
    """
    if not value:
        return ""
    normalizer = _NORMALIZERS.get(entity_type.upper(), _norm_generic)
    return normalizer(value)
