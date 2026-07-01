"""
File classifier service for NETHRA AI evidence processing pipeline.

Uses python-magic for robust MIME-type detection based on file magic bytes,
falling back to the extension-based guess if magic is unavailable.
"""
import os
import mimetypes
from enum import Enum


class FileCategory(str, Enum):
    IMAGE = "IMAGE"
    PDF = "PDF"
    OFFICE_DOCUMENT = "OFFICE_DOCUMENT"
    CHAT_EXPORT = "CHAT_EXPORT"
    PLAIN_TEXT = "PLAIN_TEXT"
    COMPRESSED_ARCHIVE = "COMPRESSED_ARCHIVE"
    AUDIO = "AUDIO"
    VIDEO = "VIDEO"
    UNKNOWN = "UNKNOWN"


# MIME prefix → category mapping (evaluated in order)
_MIME_MAP: list[tuple[str, FileCategory]] = [
    ("image/", FileCategory.IMAGE),
    ("audio/", FileCategory.AUDIO),
    ("video/", FileCategory.VIDEO),
    ("application/pdf", FileCategory.PDF),
    ("application/zip", FileCategory.COMPRESSED_ARCHIVE),
    ("application/x-tar", FileCategory.COMPRESSED_ARCHIVE),
    ("application/gzip", FileCategory.COMPRESSED_ARCHIVE),
    ("application/x-rar", FileCategory.COMPRESSED_ARCHIVE),
    ("application/vnd.openxmlformats-officedocument", FileCategory.OFFICE_DOCUMENT),
    ("application/vnd.ms-", FileCategory.OFFICE_DOCUMENT),
    ("application/msword", FileCategory.OFFICE_DOCUMENT),
    ("application/rtf", FileCategory.OFFICE_DOCUMENT),
    ("text/plain", FileCategory.PLAIN_TEXT),
    ("text/html", FileCategory.PLAIN_TEXT),
    ("text/csv", FileCategory.CHAT_EXPORT),
    ("application/json", FileCategory.CHAT_EXPORT),
    ("text/", FileCategory.PLAIN_TEXT),
]

# Filename patterns that hint at chat/browser exports regardless of MIME
_CHAT_FILENAME_HINTS = (
    "_chat.txt",
    "whatsapp",
    "telegram",
    "messenger",
    "history.json",
    "browser_history",
    "conversations",
)


def _detect_mime(file_path: str) -> str:
    """
    Detect MIME type using python-magic (magic bytes).
    Falls back to mimetypes if magic is unavailable.
    """
    try:
        import magic  # python-magic-bin on Windows
        return magic.from_file(file_path, mime=True) or "application/octet-stream"
    except ImportError:
        mime, _ = mimetypes.guess_type(file_path)
        return mime or "application/octet-stream"


def classify_file(file_path: str) -> FileCategory:
    """
    Classify an evidence file into a FileCategory.

    Steps:
    1. Detect MIME type via magic bytes.
    2. Check filename for known chat/export patterns.
    3. Map MIME type to category.

    Args:
        file_path: Absolute path to the stored evidence file.

    Returns:
        FileCategory enum member.
    """
    mime_type = _detect_mime(file_path)
    filename_lower = os.path.basename(file_path).lower()

    # Filename-based override for chat exports
    if any(hint in filename_lower for hint in _CHAT_FILENAME_HINTS):
        return FileCategory.CHAT_EXPORT

    # MIME-based classification
    for mime_prefix, category in _MIME_MAP:
        if mime_type.startswith(mime_prefix):
            return category

    return FileCategory.UNKNOWN
