"""
enrichment/providers/virustotal.py — VirusTotal provider for NETHRA AI.

Enriches entities with threat intelligence from VirusTotal.

Provider namespace: Entity.properties["virustotal"]
"""

import base64
import logging
from datetime import datetime, timezone
from typing import Any

from app.enrichment.base import BaseProvider
from app.models.graph import Entity
from app.core.config import settings

logger = logging.getLogger(__name__)

_TIMEOUT = 15  # seconds for HTTP calls


class VirusTotalProvider(BaseProvider):
    """
    VirusTotal enrichment provider.

    Resolves IP, DOMAIN, URL, and HASH entities to reputation and analysis stats
    using the VirusTotal v3 REST API.
    """

    @property
    def provider_name(self) -> str:
        return "virustotal"

    def supported_entity_types(self) -> list[str]:
        return ["IP", "DOMAIN", "URL", "HASH", "SHA256", "SHA1", "MD5"]

    def enrich(self, entity: Entity) -> dict[str, Any]:
        api_key = getattr(settings, "VIRUSTOTAL_API_KEY", None)
        if not api_key:
            logger.info("VirusTotal provider: API key not configured, skipping.")
            return {"_status": "failed", "_error": "API key not configured"}

        value_str = (entity.normalized_value or entity.value or "").strip()
        if not value_str:
            logger.warning("VirusTotal provider: empty value for entity %s", entity.id)
            return {"_status": "failed", "_error": "Empty value"}

        # Determine endpoint based on entity type
        entity_type = entity.entity_type.upper()
        
        endpoint = None
        if entity_type == "IP":
            endpoint = f"https://www.virustotal.com/api/v3/ip_addresses/{value_str}"
        elif entity_type == "DOMAIN":
            endpoint = f"https://www.virustotal.com/api/v3/domains/{value_str}"
        elif entity_type == "URL":
            # For VT v3, URL ID is base64url encoded URL with padding removed
            url_id = base64.urlsafe_b64encode(value_str.encode("utf-8")).decode("utf-8").rstrip("=")
            endpoint = f"https://www.virustotal.com/api/v3/urls/{url_id}"
        elif entity_type in ["HASH", "SHA256", "SHA1", "MD5"]:
            endpoint = f"https://www.virustotal.com/api/v3/files/{value_str}"
        else:
            return {"_status": "failed", "_error": f"Unsupported entity type: {entity_type}"}

        logger.info("VirusTotal provider: looking up %s (%s) for entity %s", value_str, entity_type, entity.id)

        try:
            import requests
        except ImportError:
            logger.error("VirusTotal provider: 'requests' library not installed.")
            return {"_status": "failed", "_error": "requests library not installed"}

        headers = {
            "accept": "application/json",
            "x-apikey": api_key
        }

        try:
            resp = requests.get(endpoint, headers=headers, timeout=_TIMEOUT)
            
            if resp.status_code == 404:
                return {"_status": "not_found", "message": "Entity not found in VirusTotal"}
            elif resp.status_code == 429:
                return {"_status": "failed", "_error": "Rate limit exceeded"}
            elif resp.status_code == 401:
                return {"_status": "failed", "_error": "Invalid API key"}
            elif resp.status_code == 403:
                return {"_status": "failed", "_error": "Forbidden - Check permissions or terms of service"}
            
            resp.raise_for_status()
        except requests.exceptions.Timeout:
            logger.warning("VirusTotal provider: timeout querying VT for %s", value_str)
            return {"_status": "failed", "_error": "Request timed out"}
        except requests.exceptions.ConnectionError as exc:
            logger.warning("VirusTotal provider: connection error querying VT for %s: %s", value_str, exc)
            return {"_status": "failed", "_error": f"Connection error: {exc}"}
        except requests.exceptions.HTTPError as exc:
            logger.warning("VirusTotal provider: HTTP error from VT for %s: %s", value_str, exc)
            return {"_status": "failed", "_error": f"HTTP error: {exc}"}
        except Exception as exc:
            logger.error("VirusTotal provider: unexpected error querying VT for %s: %s", value_str, exc, exc_info=True)
            return {"_status": "failed", "_error": str(exc)}

        try:
            payload = resp.json()
        except Exception as exc:
            logger.warning("VirusTotal provider: malformed JSON from VT for %s: %s", value_str, exc)
            return {"_status": "failed", "_error": "Malformed JSON response"}

        return payload

    def normalize_response(self, raw_data: dict[str, Any]) -> dict[str, Any]:
        now = datetime.now(tz=timezone.utc).isoformat()
        
        status = raw_data.get("_status", "success")

        if status == "failed":
            return {
                "status": "failed",
                "error": raw_data.get("_error", "Unknown error"),
                "provider": self.provider_name,
                "last_updated": now,
                "data": {},
            }
            
        if status == "not_found":
            return {
                "status": "not_found",
                "message": raw_data.get("message", "Not found"),
                "provider": self.provider_name,
                "last_updated": now,
                "data": {},
            }

        # Successful VT response structure is usually: {"data": {"attributes": {...}}}
        vt_data = raw_data.get("data", {})
        attributes = vt_data.get("attributes", {})
        
        last_analysis_stats = attributes.get("last_analysis_stats", {})
        reputation = attributes.get("reputation", 0)
        
        last_analysis_date_unix = attributes.get("last_analysis_date")
        last_analysis_date = None
        if last_analysis_date_unix:
            try:
                last_analysis_date = datetime.fromtimestamp(last_analysis_date_unix, tz=timezone.utc).isoformat()
            except Exception:
                pass

        data = {
            "reputation": reputation,
            "malicious": last_analysis_stats.get("malicious", 0),
            "suspicious": last_analysis_stats.get("suspicious", 0),
            "harmless": last_analysis_stats.get("harmless", 0),
            "undetected": last_analysis_stats.get("undetected", 0),
            "last_analysis_date": last_analysis_date,
            "raw": raw_data,
            "entity_type": attributes.get("type", "unknown")
        }

        return {
            "status": "success",
            "provider": self.provider_name,
            "last_updated": now,
            "data": data,
        }
