"""
enrichment/providers/whois.py — WHOIS provider for NETHRA AI.

Enriches DOMAIN entities using the `python-whois` library (offline socket-based
WHOIS queries — no API key required).

Provider namespace: Entity.properties["whois"]
"""
from __future__ import annotations

import logging
import socket
from datetime import datetime, timezone
from typing import Any

from app.enrichment.base import BaseProvider
from app.models.graph import Entity

logger = logging.getLogger(__name__)


def _serialise_date(value: Any) -> str | None:
    """
    Safely convert a date or list-of-dates into an ISO 8601 string.
    python-whois can return a single datetime or a list; we take the first.
    """
    if value is None:
        return None
    if isinstance(value, list):
        value = value[0] if value else None
    if value is None:
        return None
    if isinstance(value, datetime):
        # Normalise to UTC ISO string
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat()
    return str(value)


def _normalise_list(value: Any) -> list[str]:
    """
    Ensure a field is always a list of strings.
    python-whois sometimes returns a scalar, sometimes a list.
    """
    if value is None:
        return []
    if isinstance(value, str):
        return [value]
    if isinstance(value, list):
        return [str(v) for v in value if v]
    return [str(value)]


class WhoisProvider(BaseProvider):
    """
    WHOIS enrichment provider.

    Uses python-whois (offline socket queries) — no API key needed.
    Supports DOMAIN entity types only.
    """

    @property
    def provider_name(self) -> str:
        return "whois"

    def supported_entity_types(self) -> list[str]:
        return ["DOMAIN"]

    def enrich(self, entity: Entity) -> dict[str, Any]:
        """
        Execute a live WHOIS lookup for the domain value.
        Returns the raw whois dict, or empty dict on failure.
        """
        try:
            import whois  # python-whois
        except ImportError:
            logger.warning("WHOIS provider: python-whois not installed. Run: pip install python-whois")
            return {}

        domain = entity.normalized_value or entity.value
        if not domain:
            logger.warning("WHOIS provider: empty domain value for entity %s", entity.id)
            return {}

        logger.info("Running provider whois for entity %s (domain: %s)", entity.id, domain)

        try:
            raw = whois.whois(domain)
            # Convert the WhoisEntry object to a plain dict
            return dict(raw)
        except whois.parser.PywhoisError as exc:
            logger.warning("WHOIS provider: domain %s not found or unsupported: %s", domain, exc)
            return {"_error": f"Domain not found: {exc}"}
        except socket.timeout:
            logger.warning("WHOIS provider: timeout querying %s", domain)
            return {"_error": "WHOIS query timed out"}
        except ConnectionResetError as exc:
            logger.error("WHOIS provider: connection reset for %s: %s", domain, exc)
            return {"_error": f"Connection reset: {exc}"}
        except Exception as exc:
            logger.error("WHOIS provider: unexpected error for %s: %s", domain, exc, exc_info=True)
            return {"_error": str(exc)}

    def normalize_response(self, raw_data: dict[str, Any]) -> dict[str, Any]:
        """
        Flatten the python-whois response into a clean, consistently-shaped dict.
        Each field is always present (None if unavailable) for predictable frontend rendering.
        """
        # Propagate errors without crashing
        if "_error" in raw_data:
            return {
                "registrar": None,
                "creation_date": None,
                "expiration_date": None,
                "updated_date": None,
                "name_servers": [],
                "status": [],
                "country": None,
                "registrant_org": None,
                "dnssec": None,
                "error": raw_data["_error"],
                "last_updated": datetime.now(tz=timezone.utc).isoformat(),
                "provider": self.provider_name,
            }

        # De-duplicate name servers (WHOIS sometimes returns duplicates in mixed case)
        raw_ns = _normalise_list(raw_data.get("name_servers"))
        name_servers = sorted(set(ns.upper() for ns in raw_ns))

        # Status lines often contain URL suffixes — strip them for clarity, then de-duplicate
        raw_status = _normalise_list(raw_data.get("status"))
        seen_status: set[str] = set()
        status = []
        for s in raw_status:
            clean = s.split(" ")[0]
            if clean not in seen_status:
                seen_status.add(clean)
                status.append(clean)

        return {
            "registrar":        raw_data.get("registrar"),
            "creation_date":    _serialise_date(raw_data.get("creation_date")),
            "expiration_date":  _serialise_date(raw_data.get("expiration_date")),
            "updated_date":     _serialise_date(raw_data.get("updated_date")),
            "name_servers":     name_servers,
            "status":           status,
            "country":          raw_data.get("country"),
            "registrant_org":   raw_data.get("org"),
            "dnssec":           raw_data.get("dnssec"),
            "error":            None,
            "last_updated":     datetime.now(tz=timezone.utc).isoformat(),
            "provider":         self.provider_name,
        }
