"""
Metadata extraction service for NETHRA AI.

Extracts:
- Filesystem metadata (size, timestamps, permissions)
- EXIF data from images (camera, GPS, timestamps)
- Document properties from PDFs (author, creation date, etc.)

All results are returned as plain dicts for JSON storage.
Original evidence files are NEVER modified.
"""
import os
import stat
from datetime import datetime, timezone
from typing import Any

from app.services.processing.classifier import FileCategory


def _safe_str(value: Any) -> Any:
    """Convert EXIF tag values to JSON-serialisable types."""
    try:
        # exifread IfdTag objects have a printable representation
        return str(value)
    except Exception:
        return None


def extract_filesystem_metadata(file_path: str) -> dict[str, Any]:
    """
    Extract operating-system level metadata for any file type.

    Args:
        file_path: Absolute path to the stored evidence file.

    Returns:
        Dict with file size, timestamps, and permissions.
    """
    info = os.stat(file_path)
    return {
        "file_size_bytes": info.st_size,
        "created_at": datetime.fromtimestamp(info.st_ctime, tz=timezone.utc).isoformat(),
        "modified_at": datetime.fromtimestamp(info.st_mtime, tz=timezone.utc).isoformat(),
        "accessed_at": datetime.fromtimestamp(info.st_atime, tz=timezone.utc).isoformat(),
        "is_readonly": not os.access(file_path, os.W_OK),
        "extension": os.path.splitext(file_path)[1].lower(),
    }


def extract_exif_metadata(file_path: str) -> dict[str, Any]:
    """
    Extract EXIF metadata from image files using exifread.

    GPS coordinates are parsed into decimal degrees when available.

    Args:
        file_path: Absolute path to an image file.

    Returns:
        Dict of EXIF tag names to values, including parsed GPS if present.
    """
    try:
        import exifread
    except ImportError:
        return {"error": "exifread not installed"}

    result: dict[str, Any] = {}
    try:
        with open(file_path, "rb") as f:
            tags = exifread.process_file(f, details=False)

        for tag, value in tags.items():
            result[tag] = _safe_str(value)

        # Parse GPS coordinates into decimal degrees
        gps = _parse_gps(tags)
        if gps:
            result["gps_decimal"] = gps

    except Exception as exc:
        result["exif_error"] = str(exc)

    return result


def _parse_gps(tags: dict) -> dict[str, float] | None:
    """Convert raw EXIF GPS tags to decimal degree lat/lon."""
    try:
        lat_ref = str(tags.get("GPS GPSLatitudeRef", ""))
        lon_ref = str(tags.get("GPS GPSLongitudeRef", ""))
        lat_vals = tags.get("GPS GPSLatitude")
        lon_vals = tags.get("GPS GPSLongitude")

        if not (lat_vals and lon_vals):
            return None

        def to_decimal(values, ref: str) -> float:
            parts = [float(v.num) / float(v.den) for v in values.values]
            decimal = parts[0] + parts[1] / 60 + parts[2] / 3600
            if ref in ("S", "W"):
                decimal *= -1
            return round(decimal, 7)

        return {
            "latitude": to_decimal(lat_vals, lat_ref),
            "longitude": to_decimal(lon_vals, lon_ref),
        }
    except Exception:
        return None


def extract_pdf_metadata(file_path: str) -> dict[str, Any]:
    """
    Extract document metadata from a PDF using PyMuPDF.

    Args:
        file_path: Absolute path to a PDF file.

    Returns:
        Dict of PDF metadata fields (author, creator, dates, etc.).
    """
    try:
        import fitz  # PyMuPDF
    except ImportError:
        return {"error": "PyMuPDF not installed"}

    result: dict[str, Any] = {}
    try:
        doc = fitz.open(file_path)
        meta = doc.metadata or {}
        result = {k: v for k, v in meta.items() if v}
        result["page_count"] = doc.page_count
        result["is_encrypted"] = doc.is_encrypted
        doc.close()
    except Exception as exc:
        result["pdf_error"] = str(exc)

    return result


def extract_metadata(file_path: str, category: FileCategory) -> list[dict[str, Any]]:
    """
    Orchestrate all applicable metadata extraction for an evidence file.

    Always extracts filesystem metadata.
    Conditionally extracts EXIF (images) or PDF properties (PDFs).

    Args:
        file_path: Absolute path to the evidence file.
        category: Classified FileCategory of the evidence.

    Returns:
        List of dicts, each with 'metadata_type' and 'data' keys, ready
        for persistence into the evidence_metadata table.
    """
    results = []

    # 1. Filesystem metadata – always extracted
    fs_meta = extract_filesystem_metadata(file_path)
    results.append({"metadata_type": "FILE_SYSTEM", "data": fs_meta})

    # 2. EXIF – images only
    if category == FileCategory.IMAGE:
        exif_meta = extract_exif_metadata(file_path)
        if exif_meta:
            results.append({"metadata_type": "EXIF", "data": exif_meta})

    # 3. Document properties – PDFs only
    if category == FileCategory.PDF:
        pdf_meta = extract_pdf_metadata(file_path)
        if pdf_meta:
            results.append({"metadata_type": "DOCUMENT_PROPERTIES", "data": pdf_meta})

    return results
