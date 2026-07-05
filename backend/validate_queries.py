import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.assistant.service import ask_assistant
from app.schemas.assistant import AssistantRequest

# Setup logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("app.assistant.service")
logger.setLevel(logging.DEBUG)

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

queries = [
    "Who is John Doe?",
    "Is anyone associated with John Doe?",
    "What is their working IP address?",
    "Which evidence mentions Alice Smith?",
    "Is there an IP address?",
    "How are Alice Smith and John Doe related?",
]

def run_tests():
    db = SessionLocal()
    try:
        for q in queries:
            print("\n" + "="*60)
            print(f"QUERY: {q}")
            print("="*60)
            req = AssistantRequest(question=q, history=[])
            resp = ask_assistant(db, req)
            print("\n--- LLM ANSWER ---")
            print(resp.answer)
            print("\n--- SOURCES ---")
            for s in resp.sources:
                print(f"- {s.title or s.name} [{s.type}] ({s.confidence_level}) | Reason: {s.retrieval_reason}")
    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
