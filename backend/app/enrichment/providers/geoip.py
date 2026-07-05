"""
enrichment/providers/geoip.py — GeoIP provider for NETHRA AI.

Enriches IP entities with geographic and network information.

Provider namespace: Entity.properties["geoip"]

Data source priority:
  1. Local MaxMind GeoLite2 database  (if GEOIP_DB_PATH is set and file exists)
  2. MaxMind GeoIP2 Precision Web API  (if MAXMIND_ACCOUNT_ID + GEOIP_API_KEY are set)
  3. ip-api.com free JSON API          (no key required — falls back automatically)

Changing backends later only requires updating the three private _query_* methods.
All credentials are read exclusively from app.core.config.settings.
"""
from __future__ import annotations

import ipaddress
import logging
from datetime import datetime, timezone
from typing import Any

from app.enrichment.base import BaseProvider
from app.models.graph import Entity

logger = logging.getLogger(__name__)

# ── RFC 1918 / loopback / link-local / reserved ranges ──────────────────────
# ipaddress.ip_address(addr).is_private covers RFC 1918 + loopback + link-local
# We handle IPv6 loopback (::1) via is_loopback.
# is_reserved covers IANA-reserved blocks (0.0.0.0/8, 240.0.0.0/4 etc.)

_TIMEOUT = 8  # seconds for HTTP calls


class GeoIPProvider(BaseProvider):
    """
    GeoIP enrichment provider.

    Resolves public IP addresses to geographic and ASN data.
    Private / loopback / reserved addresses are handled locally without
    any external call — they always return a normalised 'private_ip' status.

    Supports entity_type == "IP" only.
    """

    # ── BaseProvider interface ────────────────────────────────────────────────

    @property
    def provider_name(self) -> str:
        return "geoip"

    def supported_entity_types(self) -> list[str]:
        return ["IP"]

    def enrich(self, entity: Entity) -> dict[str, Any]:
        """
        Entry point called by BaseProvider.run().

        Returns a raw dict that is immediately passed to normalize_response().
        On private/reserved IPs returns a sentinel dict; on errors returns
        an error sentinel dict. Never raises.
        """
        ip_str = (entity.normalized_value or entity.value or "").strip()

        if not ip_str:
            logger.warning("GeoIP provider: empty IP value for entity %s", entity.id)
            return {"_status": "failed", "_error": "Empty IP value"}

        # ── Validate / classify the IP ────────────────────────────────────────
        try:
            addr = ipaddress.ip_address(ip_str)
        except ValueError:
            logger.warning("GeoIP provider: invalid IP address '%s' for entity %s", ip_str, entity.id)
            return {"_status": "failed", "_error": f"Invalid IP address: {ip_str}"}

        if addr.is_private or addr.is_loopback or addr.is_link_local or addr.is_reserved:
            logger.info(
                "GeoIP provider: %s is a private/reserved address — skipping external lookup",
                ip_str,
            )
            return {"_status": "private_ip", "_ip": ip_str}

        # ── Try backends in priority order ────────────────────────────────────
        logger.info("GeoIP provider: looking up %s for entity %s", ip_str, entity.id)

        raw = self._query_maxmind_db(ip_str)
        if raw:
            return raw

        raw = self._query_maxmind_api(ip_str)
        if raw:
            return raw

        return self._query_ipapi(ip_str)

    def normalize_response(self, raw_data: dict[str, Any]) -> dict[str, Any]:
        """
        Convert any raw backend response into the canonical geoip schema.
        Always returns a complete dict — missing fields become None.
        """
        now = datetime.now(tz=timezone.utc).isoformat()

        status = raw_data.get("_status", "success")

        # ── Private / reserved IP ─────────────────────────────────────────────
        if status == "private_ip":
            return {
                "status": "private_ip",
                "message": "Private IP address cannot be geolocated",
                "provider": self.provider_name,
                "last_updated": now,
                "data": {},
            }

        # ── Error ─────────────────────────────────────────────────────────────
        if status == "failed":
            return {
                "status": "failed",
                "error": raw_data.get("_error", "Unknown error"),
                "provider": self.provider_name,
                "last_updated": now,
                "data": {},
            }

        # ── Success — build normalised data block ─────────────────────────────
        data = {
            "ip":           raw_data.get("ip"),
            "country":      raw_data.get("country"),
            "country_code": raw_data.get("country_code"),
            "region":       raw_data.get("region"),
            "city":         raw_data.get("city"),
            "latitude":     raw_data.get("latitude"),
            "longitude":    raw_data.get("longitude"),
            "timezone":     raw_data.get("timezone"),
            "isp":          raw_data.get("isp"),
            "organization": raw_data.get("organization"),
            "asn":          raw_data.get("asn"),
            "network":      raw_data.get("network"),
        }

        return {
            "status":       "success",
            "provider":     self.provider_name,
            "last_updated": now,
            "data":         data,
        }

    # ── Backend implementations ───────────────────────────────────────────────

    def _query_maxmind_db(self, ip: str) -> dict[str, Any] | None:
        """
        Query a local MaxMind GeoLite2-City database (.mmdb).
        Returns a normalised raw dict on success, None if not configured / available.
        Requires: pip install geoip2
        Config:   GEOIP_DB_PATH (absolute path to the .mmdb file)
        """
        try:
            from app.core.config import settings
        except Exception:
            return None

        db_path: str | None = getattr(settings, "GEOIP_DB_PATH", None)
        if not db_path:
            return None

        import os
        if not os.path.isfile(db_path):
            logger.warning("GeoIP provider: GEOIP_DB_PATH '%s' does not exist — skipping MaxMind DB", db_path)
            return None

        try:
            import geoip2.database  # type: ignore
        except ImportError:
            logger.warning("GeoIP provider: geoip2 library not installed — skipping MaxMind DB")
            return None

        try:
            with geoip2.database.Reader(db_path) as reader:
                record = reader.city(ip)

            asn_str = None
            try:
                with geoip2.database.Reader(db_path.replace("City", "ASN")) as reader2:
                    asn_rec = reader2.asn(ip)
                    asn_str = f"AS{asn_rec.autonomous_system_number}"
                    org = asn_rec.autonomous_system_organization
            except Exception:
                org = None

            return {
                "ip":           ip,
                "country":      record.country.name,
                "country_code": record.country.iso_code,
                "region":       record.subdivisions.most_specific.name,
                "city":         record.city.name,
                "latitude":     float(record.location.latitude) if record.location.latitude is not None else None,
                "longitude":    float(record.location.longitude) if record.location.longitude is not None else None,
                "timezone":     record.location.time_zone,
                "isp":          org,
                "organization": org,
                "asn":          asn_str,
                "network":      None,
            }
        except Exception as exc:
            logger.warning("GeoIP provider: MaxMind DB lookup failed for %s: %s", ip, exc)
            return None

    def _query_maxmind_api(self, ip: str) -> dict[str, Any] | None:
        """
        Query the MaxMind GeoIP2 Precision Web API.
        Returns a normalised raw dict on success, None if not configured.
        Requires: pip install geoip2
        Config:   MAXMIND_ACCOUNT_ID, GEOIP_API_KEY
        """
        try:
            from app.core.config import settings
        except Exception:
            return None

        account_id: str | None = getattr(settings, "MAXMIND_ACCOUNT_ID", None)
        api_key: str | None = getattr(settings, "GEOIP_API_KEY", None)

        if not account_id or not api_key:
            return None

        try:
            import geoip2.webservice  # type: ignore
        except ImportError:
            logger.warning("GeoIP provider: geoip2 library not installed — skipping MaxMind API")
            return None

        try:
            with geoip2.webservice.Client(int(account_id), api_key, host="geolite.info") as client:
                record = client.city(ip)

            asn_str = None
            if record.traits.autonomous_system_number:
                asn_str = f"AS{record.traits.autonomous_system_number}"

            return {
                "ip":           ip,
                "country":      record.country.name,
                "country_code": record.country.iso_code,
                "region":       record.subdivisions.most_specific.name,
                "city":         record.city.name,
                "latitude":     float(record.location.latitude) if record.location.latitude is not None else None,
                "longitude":    float(record.location.longitude) if record.location.longitude is not None else None,
                "timezone":     record.location.time_zone,
                "isp":          record.traits.isp,
                "organization": record.traits.organization,
                "asn":          asn_str,
                "network":      None,
            }
        except Exception as exc:
            logger.warning("GeoIP provider: MaxMind API lookup failed for %s: %s", ip, exc)
            return None

    def _query_ipapi(self, ip: str) -> dict[str, Any]:
        """
        Query ip-api.com (free, no key required for non-commercial use).
        Rate limit: 45 requests/minute on the free tier.
        Returns a normalised raw dict, or an error sentinel dict on failure.
        """
        try:
            import requests  # type: ignore
        except ImportError:
            logger.error("GeoIP provider: 'requests' library not installed. Run: pip install requests")
            return {"_status": "failed", "_error": "requests library not installed"}

        url = (
            f"http://ip-api.com/json/{ip}"
            "?fields=status,message,country,countryCode,regionName,city,"
            "lat,lon,timezone,isp,org,as,query"
        )

        try:
            resp = requests.get(url, timeout=_TIMEOUT)
            resp.raise_for_status()
        except requests.exceptions.Timeout:
            logger.warning("GeoIP provider: timeout querying ip-api.com for %s", ip)
            return {"_status": "failed", "_error": "Request timed out"}
        except requests.exceptions.ConnectionError as exc:
            logger.warning("GeoIP provider: connection error querying ip-api.com for %s: %s", ip, exc)
            return {"_status": "failed", "_error": f"Connection error: {exc}"}
        except requests.exceptions.HTTPError as exc:
            logger.warning("GeoIP provider: HTTP error from ip-api.com for %s: %s", ip, exc)
            return {"_status": "failed", "_error": f"HTTP error: {exc}"}
        except Exception as exc:
            logger.error("GeoIP provider: unexpected error querying ip-api.com for %s: %s", ip, exc, exc_info=True)
            return {"_status": "failed", "_error": str(exc)}

        try:
            payload = resp.json()
        except Exception as exc:
            logger.warning("GeoIP provider: malformed JSON from ip-api.com for %s: %s", ip, exc)
            return {"_status": "failed", "_error": "Malformed JSON response"}

        if payload.get("status") == "fail":
            msg = payload.get("message", "Unknown failure")
            logger.warning("GeoIP provider: ip-api.com returned failure for %s: %s", ip, msg)
            # Detect rate-limiting
            if "rate" in msg.lower():
                return {"_status": "failed", "_error": f"Rate limited by ip-api.com: {msg}"}
            return {"_status": "failed", "_error": f"ip-api.com: {msg}"}

        # ── Parse ASN field: "AS15169 Google LLC" → ("AS15169", "Google LLC") ─
        raw_as: str = payload.get("as") or ""
        asn_parts = raw_as.split(" ", 1)
        asn_code = asn_parts[0] if asn_parts else None
        asn_org  = asn_parts[1] if len(asn_parts) > 1 else None

        return {
            "ip":           payload.get("query") or ip,
            "country":      payload.get("country"),
            "country_code": payload.get("countryCode"),
            "region":       payload.get("regionName"),
            "city":         payload.get("city"),
            "latitude":     payload.get("lat"),
            "longitude":    payload.get("lon"),
            "timezone":     payload.get("timezone"),
            "isp":          payload.get("isp"),
            "organization": payload.get("org") or asn_org,
            "asn":          asn_code or None,
            "network":      None,
        }
