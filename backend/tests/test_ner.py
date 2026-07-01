import pytest
from app.services.processing.ner import extract_entities, _normalize

def test_ner_regex_extraction():
    text = "Contact me at test@example.com or call +91 9876543210. Visit https://example.com"
    entities = extract_entities(text)
    
    # Check if EMAIL is extracted
    email_ents = [e for e in entities if e["entity_type"] == "EMAIL"]
    assert len(email_ents) == 1
    assert email_ents[0]["entity_value"] == "test@example.com"
    
    # Check if PHONE is extracted
    phone_ents = [e for e in entities if e["entity_type"] == "PHONE"]
    assert len(phone_ents) == 1
    assert phone_ents[0]["normalized_value"] == "919876543210"
    
    # Check if URL is extracted
    url_ents = [e for e in entities if e["entity_type"] == "URL"]
    assert len(url_ents) == 1
    assert url_ents[0]["normalized_value"] == "example.com"

def test_normalization():
    assert _normalize("PHONE", "+1 (555) 123-4567") == "15551234567"
    assert _normalize("URL", "HTTPS://example.COM/path") == "example.com"
    assert _normalize("EMAIL", "TEST@example.com") == "test@example.com"
    assert _normalize("PERSON", "John DOE") == "john doe"

def test_spacy_false_positives():
    # Tests that tech stopwords, short entities, numbers, and generic phrases are rejected.
    text = "Server IP is 192.168.1.1. React and Node.js are used for the UI. Checksum is 12345. A1."
    entities = extract_entities(text)
    
    spacy_entities = [e for e in entities if e.get("extraction_method") == "SPACY"]
    assert len(spacy_entities) == 0, f"Expected 0 spaCy entities, got {spacy_entities}"

def test_spacy_true_positives():
    # Real entities should still be extracted
    text = "Apple Inc. announced a new device in New York today with Tim Cook."
    entities = extract_entities(text)
    
    orgs = [e["entity_value"] for e in entities if e["entity_type"] == "ORG"]
    locs = [e["entity_value"] for e in entities if e["entity_type"] == "LOC"]
    persons = [e["entity_value"] for e in entities if e["entity_type"] == "PERSON"]
    
    assert "Apple Inc." in orgs
    assert "New York" in locs
    assert "Tim Cook" in persons

def test_context_rejection():
    # Entities immediately following forensic context keywords should be rejected by spaCy
    text = "Wallet: JohnDoe. Phone: Alice. Email Bob. Website: mycorp."
    entities = extract_entities(text)
    
    spacy_entities = [e for e in entities if e.get("extraction_method") == "SPACY"]
    assert len(spacy_entities) == 0, f"Expected 0 spaCy entities due to context rejection, got {spacy_entities}"
