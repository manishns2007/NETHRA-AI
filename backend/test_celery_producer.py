from app.services.processing.pipeline import process_evidence
try:
    print("Calling process_evidence.delay('123')")
    result = process_evidence.delay('123')
    print("Task ID:", result.id)
except Exception as e:
    print("Caught exception:", e)
