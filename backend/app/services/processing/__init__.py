"""
Evidence processing services package for NETHRA AI Module 2.

Submodules:
  - classifier: File type detection via magic bytes
  - metadata:   EXIF, filesystem, and PDF property extraction
  - ocr:        Text extraction via Tesseract and PyMuPDF
  - ner:        Named entity recognition via spaCy + Regex
  - pipeline:   Celery task orchestrating the full processing workflow
"""
