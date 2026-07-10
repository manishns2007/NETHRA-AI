"""
OCR processing service for NETHRA AI.

Handles two distinct workflows:
  - Images: Tesseract OCR directly via pytesseract.
  - PDFs:   PyMuPDF native text extraction first (DIRECT_TEXT).
            Falls back to pdf2image + Tesseract if the PDF is scanned (OCR).

All text extraction results include:
  - page_number   : for multi-page documents
  - bounding_boxes: per-word coordinates for explainable reporting
  - extraction_method: 'OCR' | 'DIRECT_TEXT' for full provenance
  - processing_version: enables safe reprocessing after engine upgrades

Original evidence files are NEVER modified.
"""
from __future__ import annotations

import io
from typing import Any

from app.core.config import settings


_PROCESSING_VERSION = settings.PROCESSING_VERSION


def _tesseract_image(pil_image) -> dict[str, Any]:
    """
    Run Tesseract OCR on a Pillow Image object.

    Returns extracted text, confidence score, and word-level bounding boxes.
    """
    import pytesseract

    text = pytesseract.image_to_string(pil_image).strip()

    # Confidence score – average of non-negative word confidences
    data = pytesseract.image_to_data(pil_image, output_type=pytesseract.Output.DICT)
    confidences = [
        int(c) for c in data.get("conf", []) if str(c).lstrip("-").isdigit() and int(c) >= 0
    ]
    avg_confidence = round(sum(confidences) / len(confidences) / 100, 4) if confidences else None

    # Bounding boxes – word level [{text, left, top, width, height}]
    bboxes = []
    for i, word in enumerate(data.get("text", [])):
        if word.strip():
            bboxes.append(
                {
                    "text": word,
                    "left": data["left"][i],
                    "top": data["top"][i],
                    "width": data["width"][i],
                    "height": data["height"][i],
                }
            )

    return {
        "extracted_text": text,
        "confidence_score": avg_confidence,
        "bounding_boxes": bboxes,
        "language": "eng",
    }


def process_image_ocr(file_path: str) -> list[dict[str, Any]]:
    """
    Extract text from an image file using Tesseract OCR.

    Args:
        file_path: Absolute path to the image evidence file.

    Returns:
        List with a single OCR result dict (images are treated as page 1).
    """
    from PIL import Image

    image = Image.open(file_path)
    result = _tesseract_image(image)
    return [
        {
            "page_number": 1,
            "extracted_text": result["extracted_text"],
            "confidence_score": result["confidence_score"],
            "bounding_boxes": result["bounding_boxes"],
            "language": result["language"],
            "extraction_method": "OCR",
            "processing_version": _PROCESSING_VERSION,
        }
    ]


def process_pdf_ocr(file_path: str) -> list[dict[str, Any]]:
    """
    Extract text from a PDF using a smart two-step strategy:

    1. Attempt native text extraction with PyMuPDF (fast, lossless, DIRECT_TEXT).
    2. If a page yields no native text, convert it to an image with pdf2image
       and run Tesseract OCR (slower, but handles scanned PDFs).

    All pages pass their text to the caller regardless of extraction method,
    ensuring the NER pipeline receives a uniform text stream.

    Args:
        file_path: Absolute path to the PDF evidence file.

    Returns:
        List of per-page OCR result dicts.
    """
    import fitz  # PyMuPDF

    pages_output = []

    doc = fitz.open(file_path)
    for page_num in range(doc.page_count):
        page = doc[page_num]
        native_text = page.get_text("text").strip()  # type: ignore[arg-type]

        if native_text:
            # Native text exists – use it directly (no OCR needed)
            pages_output.append(
                {
                    "page_number": page_num + 1,
                    "extracted_text": native_text,
                    "confidence_score": 1.0,  # Direct extraction is 100% faithful
                    "bounding_boxes": None,
                    "language": "unknown",
                    "extraction_method": "DIRECT_TEXT",
                    "processing_version": _PROCESSING_VERSION,
                }
            )
        else:
            # Scanned page – convert to image and OCR
            pix = page.get_pixmap(dpi=200)  # type: ignore[call-arg]
            img_bytes = pix.tobytes("png")

            from PIL import Image

            pil_image = Image.open(io.BytesIO(img_bytes))
            result = _tesseract_image(pil_image)

            pages_output.append(
                {
                    "page_number": page_num + 1,
                    "extracted_text": result["extracted_text"],
                    "confidence_score": result["confidence_score"],
                    "bounding_boxes": result["bounding_boxes"],
                    "language": result["language"],
                    "extraction_method": "OCR",
                    "processing_version": _PROCESSING_VERSION,
                }
            )

    doc.close()
    return pages_output


def process_text_file(file_path: str) -> list[dict[str, Any]]:
    """
    Read a plain text or chat export file directly — no OCR required.

    Args:
        file_path: Absolute path to the text evidence file.

    Returns:
        List with a single DIRECT_TEXT result dict.
    """
    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            text = f.read()
    except Exception as exc:
        text = f"[Read error: {exc}]"

    return [
        {
            "page_number": 1,
            "extracted_text": text,
            "confidence_score": 1.0,
            "bounding_boxes": None,
            "language": "unknown",
            "extraction_method": "DIRECT_TEXT",
            "processing_version": _PROCESSING_VERSION,
        }
    ]
