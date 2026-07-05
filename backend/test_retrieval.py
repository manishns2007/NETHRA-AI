from app.assistant.intent_classifier import classify, Intent
from app.assistant.entity_detector import detect
from app.assistant.evidence_retriever import HybridEvidenceRetriever, KeywordEvidenceRetriever
from app.assistant.context_builder import ContextBuilder
from app.assistant.service import ask_assistant

tests = [
    ('Who is John Doe?',                         Intent.ENTITY_LOOKUP),
    ('How are Alice Smith and John Doe related?', Intent.RELATIONSHIP_LOOKUP),
    ('Which evidence mentions Alice Smith?',      Intent.EVIDENCE_LOOKUP),
    ('Is there an IP address?',                   Intent.INDICATOR_SEARCH),
    ('Summarize this investigation.',              Intent.INVESTIGATION_SUM),
    ('Is this IP malicious?',                     Intent.THREAT_INTEL),
    ('Hello',                                     Intent.GENERAL),
]
all_pass = True
for q, expected in tests:
    result = classify(q)
    ok = result.intent == expected
    if not ok:
        all_pass = False
    print(f'  [{"OK" if ok else "FAIL"}] "{q}" -> {result.intent} (expected {expected})')

d = detect('Is there an IP address 192.168.1.100 or email test@example.com?')
print('Indicators:', d.indicators)
print('Keywords:', d.clean_keywords)

history = [{'role': 'user', 'content': 'Who is Alice Smith?'}]
d2 = detect('What evidence mentions her?', history)
print('Resolved:', d2.resolved_question, '| entity:', d2.resolved_entity)

print()
print('ALL INTENT TESTS PASSED' if all_pass else 'SOME INTENT TESTS FAILED')
