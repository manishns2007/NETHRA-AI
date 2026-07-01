import os
import tempfile
import pytest
from app.services.processing.classifier import classify_file, FileCategory, _detect_mime

def test_classifier_text_file():
    with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as f:
        f.write(b"Hello world")
        f.flush()
        temp_path = f.name
    
    try:
        assert classify_file(temp_path) == FileCategory.PLAIN_TEXT
    finally:
        os.remove(temp_path)

def test_classifier_chat_heuristic():
    with tempfile.NamedTemporaryFile(suffix="_chat.txt", delete=False) as f:
        f.write(b"2023-01-01 User: hello")
        f.flush()
        temp_path = f.name
    
    try:
        assert classify_file(temp_path) == FileCategory.CHAT_EXPORT
    finally:
        os.remove(temp_path)
