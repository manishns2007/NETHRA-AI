"""
enrichment/providers/abuseipdb.py — AbuseIPDB provider for NETHRA AI.

Enriches IP entities with threat intelligence from AbuseIPDB.

Provider namespace: Entity.properties["abuseipdb"]
"""

import ipaddress
import logging
from datetime import datetime, timezone
from typing import Any

from app.enrichment.base import BaseProvider
from app.models.graph import Entity
from app.core.config import settings

logger = logging.getLogger(__name__)

_TIMEOUT = 15  # seconds for HTTP calls


class AbuseIPDBProvider(BaseProvider):
    """
    AbuseIPDB enrichment provider.

    Resolves IP entities to abuse reports and confidence scores
    using the AbuseIPDB v2 REST API.
    """

    @property
    def provider_name(self) -> str:
        return "abuseipdb"

    def supported_entity_types(self) -> list[str]:
        return ["IP"]

    def enrich(self, entity: Entity) -> dict[str, Any]:
        api_key = getattr(settings, "ABUSEIPDB_API_KEY", None)
        if not api_key:
            logger.info("AbuseIPDB provider: API key not configured, skipping.")
            return {"_status": "error", "_error": "API key not configured"}

        ip_str = (entity.normalized_value or entity.value or "").strip()
        if not ip_str:
            logger.warning("AbuseIPDB provider: empty value for entity %s", entity.id)
            return {"_status": "error", "_error": "Empty value"}

        # Validate IP and skip private/reserved
        try:
            addr = ipaddress.ip_address(ip_str)
        except ValueError:
            logger.warning("AbuseIPDB provider: invalid IP address '%s' for entity %s", ip_str, entity.id)
            return {"_status": "error", "_error": f"Invalid IP address: {ip_str}"}

        if addr.is_private or addr.is_loopback or addr.is_link_local or addr.is_reserved:
            logger.info("AbuseIPDB provider: skipping private/reserved IP %s", ip_str)
            return {"_status": "skipped", "_error": "Private/Reserved IP"}

        endpoint = "https://api.abuseipdb.com/api/v2/check"
        params = {
            "ipAddress": ip_str,
            "maxAgeInDays": "90",
            "verbose": "true"
        }

        logger.info("AbuseIPDB provider: looking up %s for entity %s", ip_str, entity.id)

        try:
            import requests
        except ImportError:
            logger.error("AbuseIPDB provider: 'requests' library not installed.")
            return {"_status": "error", "_error": "requests library not installed"}

        headers = {
            "Accept": "application/json",
            "Key": api_key
        }

        try:
            resp = requests.get(endpoint, headers=headers, params=params, timeout=_TIMEOUT)
            
            if resp.status_code == 404:
                return {"_status": "error", "_error": "Entity not found in AbuseIPDB"}
            elif resp.status_code == 429:
                return {"_status": "error", "_error": "Rate limit exceeded"}
            elif resp.status_code == 401:
                return {"_status": "error", "_error": "Invalid API key"}
            elif resp.status_code == 403:
                return {"_status": "error", "_error": "Forbidden - Check permissions"}
            
            resp.raise_for_status()
        except requests.exceptions.Timeout:
            logger.warning("AbuseIPDB provider: timeout querying for %s", ip_str)
            return {"_status": "error", "_error": "Request timed out"}
        except requests.exceptions.ConnectionError as exc:
            logger.warning("AbuseIPDB provider: connection error querying for %s: %s", ip_str, exc)
            return {"_status": "error", "_error": f"Connection error: {exc}"}
        except requests.exceptions.HTTPError as exc:
            logger.warning("AbuseIPDB provider: HTTP error for %s: %s", ip_str, exc)
            return {"_status": "error", "_error": f"HTTP error: {exc}"}
        except Exception as exc:
            logger.error("AbuseIPDB provider: unexpected error for %s: %s", ip_str, exc, exc_info=True)
            return {"_status": "error", "_error": str(exc)}

        try:
            payload = resp.json()
        except Exception as exc:
            logger.warning("AbuseIPDB provider: malformed JSON for %s: %s", ip_str, exc)
            return {"_status": "error", "_error": "Malformed JSON response"}

        return payload

    def normalize_response(self, raw_data: dict[str, Any]) -> dict[str, Any]:
        now = datetime.now(tz=timezone.utc).isoformat()
        
        status = raw_data.get("_status", "success")

        if status == "error":
            return {
                "provider": self.provider_name,
                "status": "error",
                "error": raw_data.get("_error", "Unknown error"),
                "last_updated": now,
            }
            
        if status == "skipped":
            return {
                "provider": self.provider_name,
                "status": "skipped",
                "message": raw_data.get("_error", "Skipped"),
                "last_updated": now,
            }

        # Successful response structure: {"data": {...}}
        data_block = raw_data.get("data", {})
        
        data = {
            "abuse_confidence_score": data_block.get("abuseConfidenceScore", 0),
            "total_reports": data_block.get("totalReports", 0),
            "last_reported_at": data_block.get("lastReportedAt"),
            "country_code": data_block.get("countryCode"),
            "country_name": data_block.get("countryName"),
            "usage_type": data_block.get("usageType"),
            "isp": data_block.get("isp"),
            "domain": data_block.get("domain"),
            "is_public": data_block.get("isPublic", True),
            "is_whitelisted": data_block.get("isWhitelisted", False),
            "raw": raw_data
        }

        return {
            "provider": self.provider_name,
            "status": "success",
            **data,
            "error": None,
            "last_updated": now,
        }
