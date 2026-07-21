import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

base_url = 'https://nethra-ai-production.up.railway.app/api/v1'

try:
    req = urllib.request.Request(f'{base_url}/evidence/', headers={'Accept': 'application/json'})
    with urllib.request.urlopen(req, context=ctx) as response:
        evidence_list = json.loads(response.read())

    failed_evidence = [e for e in evidence_list if e.get('status') in ('FAILED', 'INTEGRITY_FAILED')]

    for fe in failed_evidence:
        print(f"Evidence ID: {fe['evidence_id']}, Name: {fe['original_filename']}, Status: {fe['status']}")
        try:
            audit_req = urllib.request.Request(f"{base_url}/audit-logs/?evidence_id={fe['evidence_id']}")
            with urllib.request.urlopen(audit_req, context=ctx) as audit_res:
                logs = json.loads(audit_res.read())
                for log in logs:
                    print(f"  -> [{log.get('action')}] {log.get('details')}")
        except Exception as e:
            print(f'Error fetching audit logs: {e}')
except Exception as e:
    print(f'Error: {e}')
