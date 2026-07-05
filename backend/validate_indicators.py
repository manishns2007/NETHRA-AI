import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.assistant.service import ask_assistant
from app.schemas.assistant import AssistantRequest
import app.assistant.llm

# Setup logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("app.assistant")
logger.setLevel(logging.DEBUG)

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Mock LLM to avoid 429 Quota limits during mass testing
class MockLLM:
    def generate_response(self, *args, **kwargs):
        return "Simulated LLM response (Bypassing 429 Quota Exhaustion limit)"
app.assistant.service.LLMProvider = MockLLM

queries = [
    "Who uses john@example.com?",
    "Which evidence contains john@example.com?",
    "List all email addresses.",
    "Who owns +91 9876543210?",
    "List all phone numbers.",
    "Is there an IP address?",
    "Who uses 192.168.1.100?",
    "Who owns 0xAb5801a7D398351B8bE11C439e05C5B3259aec9?",
    "List all hashes.",
    "Who uses abc@example.invalid?",
]

def run_tests():
    db = SessionLocal()
    try:
        for q in queries:
            print("\n" + "="*80)
            print(f"QUERY: {q}")
            print("="*80)
            req = AssistantRequest(question=q, history=[])
            try:
                resp = ask_assistant(db, req)
                print("\n--- FINAL LLM RESPONSE ---")
                print(resp.answer)
                print("\n--- FINAL CITED EVIDENCE ---")
                for s in resp.sources:
                    print(f"- {s.title or s.name} [{s.type}] ({s.confidence_level}) | Reason: {s.retrieval_reason}")
            except Exception as e:
                import traceback
                print(f"EXCEPTION:")
                traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
