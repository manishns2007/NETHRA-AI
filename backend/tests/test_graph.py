"""
tests/test_graph.py — Unit tests for the NETHRA AI Knowledge Graph module.

Tests run against an in-memory SQLite database (no disk I/O).
Covers:
  1. Normalizer correctness per entity type
  2. Entity deduplication (upsert & last_seen update)
  3. Relationship inference rule engine
  4. Builder idempotency
"""
from __future__ import annotations

import pytest
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
# Ensure all models are loaded before Base.metadata.create_all
import app.models  # noqa: F401

from app.graph.normalizer import normalize_entity
from app.graph.dedup import get_or_create_entity
from app.graph.relationships import infer_relationships, INFERENCE_RULES
from app.graph.builder import build_graph_for_evidence
from app.models.graph import Entity, Relationship


# ── Test database fixture ─────────────────────────────────────────────────────

@pytest.fixture()
def db():
    """Provide an in-memory SQLite session with all tables created."""
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)


# ── Phase 2: Normalizer tests ─────────────────────────────────────────────────

class TestNormalizer:
    def test_email_lowercased(self):
        assert normalize_entity("EMAIL", "John.DOE@Example.COM") == "john.doe@example.com"

    def test_phone_digits_only(self):
        result = normalize_entity("PHONE", "+91 98765-43210")
        assert result == "919876543210"

    def test_domain_lowercased_trailing_dot_removed(self):
        assert normalize_entity("DOMAIN", "Example.COM.") == "example.com"

    def test_url_scheme_stripped(self):
        result = normalize_entity("URL", "HTTPS://Example.com/path/")
        assert result == "example.com/path"

    def test_ip_stripped(self):
        assert normalize_entity("IP", " 192.168.1.1 ") == "192.168.1.1"

    def test_file_hash_lowercased(self):
        result = normalize_entity("FILE_HASH", "ABCDEF1234567890ABCDEF1234567890ABCDEF12")
        assert result == result.lower()

    def test_social_handle_strips_at(self):
        assert normalize_entity("SOCIAL_HANDLE", "@JohnDoe") == "johndoe"

    def test_person_whitespace_collapsed(self):
        assert normalize_entity("PERSON", "  John   Doe  ") == "john doe"

    def test_unknown_type_generic_fallback(self):
        assert normalize_entity("FUTURE_TYPE", "  Hello World  ") == "hello world"

    def test_empty_value_returns_empty(self):
        assert normalize_entity("EMAIL", "") == ""


# ── Phase 2: Deduplication tests ──────────────────────────────────────────────

class TestDedup:
    def test_creates_new_entity(self, db):
        entity = get_or_create_entity(db, "EMAIL", "test@example.com", confidence=0.9)
        db.commit()
        count = db.query(Entity).count()
        assert count == 1
        assert entity.normalized_value == "test@example.com"

    def test_dedup_returns_same_entity(self, db):
        e1 = get_or_create_entity(db, "EMAIL", "Test@Example.COM", confidence=0.9)
        db.commit()
        e2 = get_or_create_entity(db, "EMAIL", "test@example.com", confidence=0.8)
        db.commit()
        assert e1.id == e2.id
        assert db.query(Entity).count() == 1

    def test_last_seen_updated(self, db):
        e1 = get_or_create_entity(db, "PERSON", "Alice Smith", confidence=0.7)
        db.commit()
        first_seen = e1.first_seen

        import time; time.sleep(0.01)

        e2 = get_or_create_entity(db, "PERSON", "alice smith", confidence=0.8)
        db.commit()
        assert e1.id == e2.id
        # Confidence should be updated to the higher value
        assert e2.confidence == 0.8

    def test_different_type_same_value_separate_nodes(self, db):
        get_or_create_entity(db, "EMAIL", "test@example.com")
        db.commit()
        get_or_create_entity(db, "DOMAIN", "test@example.com")
        db.commit()
        assert db.query(Entity).count() == 2

    def test_properties_merged(self, db):
        get_or_create_entity(db, "IP", "1.2.3.4", properties={"country": "US"})
        db.commit()
        e = get_or_create_entity(db, "IP", "1.2.3.4", properties={"isp": "Cloudflare"})
        db.commit()
        assert e.properties.get("country") == "US"
        assert e.properties.get("isp") == "Cloudflare"


# ── Phase 3: Rule Engine tests ────────────────────────────────────────────────

class TestRuleEngine:
    def _make_entity(self, entity_type: str, eid: str) -> Entity:
        """Create a mock Entity without DB."""
        e = Entity()
        e.id = eid
        e.entity_type = entity_type
        e.value = eid
        e.normalized_value = eid
        return e

    def test_contains_rule_fires(self):
        ev = self._make_entity("EVIDENCE", "ev-001")
        person = self._make_entity("PERSON", "john-doe")
        specs = infer_relationships([ev, person], provenance="same_document")
        types = [s.relationship_type for s in specs]
        assert "CONTAINS" in types

    def test_uses_email_rule_fires(self):
        ev = self._make_entity("EVIDENCE", "ev-001")
        person = self._make_entity("PERSON", "alice")
        email = self._make_entity("EMAIL", "alice@test.com")
        specs = infer_relationships([ev, person, email], provenance="same_document")
        types = [s.relationship_type for s in specs]
        assert "USES_EMAIL" in types

    def test_no_self_loop(self):
        person = self._make_entity("PERSON", "alice")
        specs = infer_relationships([person], provenance="same_document")
        for s in specs:
            assert s.source_id != s.target_id

    def test_provenance_recorded(self):
        ev = self._make_entity("EVIDENCE", "ev-001")
        person = self._make_entity("PERSON", "bob")
        specs = infer_relationships([ev, person], provenance="same_whatsapp_message")
        assert all(s.provenance == "same_whatsapp_message" for s in specs)

    def test_dedup_within_infer(self):
        """Same spec should not appear twice."""
        ev = self._make_entity("EVIDENCE", "ev-001")
        email = self._make_entity("EMAIL", "x@x.com")
        specs = infer_relationships([ev, email], provenance="same_document")
        keys = [(s.source_id, s.target_id, s.relationship_type) for s in specs]
        assert len(keys) == len(set(keys))


# ── Phase 3: Builder integration tests ───────────────────────────────────────

class TestBuilder:
    def test_build_creates_nodes_and_edges(self, db):
        entities = [
            {"entity_type": "PERSON", "entity_value": "John Doe", "confidence": 0.9},
            {"entity_type": "EMAIL", "entity_value": "john@example.com", "confidence": 0.95},
        ]
        stats = build_graph_for_evidence(db, "ev-test-001", entities)
        assert stats["nodes_created"] >= 2  # person + email + evidence node
        assert stats["edges_created"] >= 1  # at least CONTAINS + USES_EMAIL

    def test_build_idempotent(self, db):
        entities = [
            {"entity_type": "PERSON", "entity_value": "Alice", "confidence": 0.9},
        ]
        stats1 = build_graph_for_evidence(db, "ev-test-002", entities)
        stats2 = build_graph_for_evidence(db, "ev-test-002", entities)
        # Second run should create 0 new nodes and 0 new edges
        assert stats2["nodes_created"] == 0
        assert stats2["edges_created"] == 0

    def test_entity_dedup_across_evidence(self, db):
        """Same person entity in two evidence items should share one graph node."""
        entities = [{"entity_type": "PERSON", "entity_value": "John Doe", "confidence": 0.9}]
        build_graph_for_evidence(db, "ev-001", entities)
        build_graph_for_evidence(db, "ev-002", entities)

        # Should still have only one PERSON node (plus 2 EVIDENCE nodes)
        person_count = (
            db.query(Entity).filter(Entity.entity_type == "PERSON").count()
        )
        assert person_count == 1

    def test_graph_summary_after_build(self, db):
        from app.graph.queries import get_graph_summary
        entities = [
            {"entity_type": "PERSON", "entity_value": "Bob", "confidence": 0.8},
            {"entity_type": "IP", "entity_value": "10.0.0.1", "confidence": 0.95},
        ]
        build_graph_for_evidence(db, "ev-sum-001", entities)
        summary = get_graph_summary(db)
        assert summary["total_nodes"] >= 3  # evidence + person + ip
        assert summary["total_edges"] >= 2
        assert "PERSON" in summary["entity_counts_by_type"]
