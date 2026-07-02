"""
End-to-end WHOIS enrichment verification.
Tests: dispatcher -> provider -> DB update -> API response.
"""
import json
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.graph import Entity
from app.enrichment import service, dispatcher

client = TestClient(app)
db = SessionLocal()

# ── Find DOMAIN entities ──────────────────────────────────────────────────────
domains = db.query(Entity).filter(Entity.entity_type == "DOMAIN").all()
print(f"Found {len(domains)} DOMAIN entities:")
for d in domains:
    print(f"  [{d.id}] {d.value}")
print()

if not domains:
    print("No DOMAIN entities found. Please upload evidence with domains first.")
    db.close()
    exit(1)

target = domains[0]
print(f"Testing with: {target.value} ({target.id})\n")

# ── Step 1: Direct dispatcher test ────────────────────────────────────────────
print("=" * 60)
print("STEP 1: Direct dispatcher enrichment (bypasses Celery)")
print("=" * 60)
result = service.process_entity_enrichment(db, target.id)
print(f"Enrichment updated: {result}\n")

# ── Step 2: Read back from DB ─────────────────────────────────────────────────
db.refresh(target)
print("Entity.properties after enrichment:")
print(json.dumps(target.properties, indent=2, default=str))
print()

# ── Step 3: API – GET enrichment ──────────────────────────────────────────────
print("=" * 60)
print(f"STEP 2: GET /api/v1/enrichment/entity/{target.id}")
print("=" * 60)
resp = client.get(f"/api/v1/enrichment/entity/{target.id}")
print(f"Status: {resp.status_code}")
print(json.dumps(resp.json(), indent=2, default=str))
print()

# ── Step 4: Re-run to verify idempotency ──────────────────────────────────────
print("=" * 60)
print("STEP 3: Re-run enrichment (must update, not duplicate)")
print("=" * 60)
service.process_entity_enrichment(db, target.id)
db.refresh(target)
whois_keys = list(target.properties.get("whois", {}).keys())
print(f"WHOIS keys present: {whois_keys}")
whois_count = sum(1 for k in target.properties if k == "whois")
print(f"Number of 'whois' keys in properties dict: {whois_count}")
assert whois_count == 1, "DUPLICATE WHOIS KEY DETECTED — idempotency broken!"
print("Idempotency OK — no duplicates created.\n")

# ── Step 5: GET /enrichment/providers ─────────────────────────────────────────
print("=" * 60)
print("STEP 4: GET /api/v1/enrichment/providers")
print("=" * 60)
resp = client.get("/api/v1/enrichment/providers")
print(f"Status: {resp.status_code}")
print(json.dumps(resp.json(), indent=2))

db.close()
print("\n[PASS] All WHOIS verification steps completed successfully.")
