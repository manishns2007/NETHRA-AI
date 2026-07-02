import json
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal, engine
import app.models as models

models.Base.metadata.create_all(bind=engine)

client = TestClient(app)

def test_analysis_endpoints():
    print("Testing /api/v1/analysis/stats")
    response = client.get("/api/v1/analysis/stats")
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    print("-" * 40)

    print("Testing /api/v1/analysis/components")
    response = client.get("/api/v1/analysis/components")
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    print("-" * 40)

    print("Testing /api/v1/analysis/centrality?top_k=3")
    response = client.get("/api/v1/analysis/centrality?top_k=3")
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    print("-" * 40)

if __name__ == "__main__":
    test_analysis_endpoints()
