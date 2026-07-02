"""
Quick verification of Module 6 Phase 1 endpoints.
"""
import json
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# Pull a real entity ID from the DB to use in tests
from app.core.database import SessionLocal
from app.models.graph import Entity

db = SessionLocal()
first_entity = db.query(Entity).filter(Entity.entity_type != "EVIDENCE").first()
db.close()
ENTITY_ID = first_entity.id if first_entity else "unknown"
print(f"Using entity: {ENTITY_ID} ({first_entity.entity_type}: {first_entity.value})\n")

def check(label, resp):
    icon = "[OK]" if resp.status_code < 300 else "[FAIL]"
    print(f"{icon} [{resp.status_code}] {label}")
    print(json.dumps(resp.json(), indent=2))
    print("-" * 50)

check("GET /enrichment/providers",
      client.get("/api/v1/enrichment/providers"))

check(f"GET /enrichment/entity/{ENTITY_ID}",
      client.get(f"/api/v1/enrichment/entity/{ENTITY_ID}"))

check(f"GET /enrichment/entity/{ENTITY_ID}/status",
      client.get(f"/api/v1/enrichment/entity/{ENTITY_ID}/status"))

# Skip POST /refresh — it requires Celery/Redis running
print("[NOTE] POST /refresh endpoints require a running Celery+Redis worker.")
print("    Start with: celery -A app.core.celery_app.celery_app worker --pool=solo -Q processing")
