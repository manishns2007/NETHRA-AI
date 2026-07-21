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

    print(f"Total evidence on Railway: {len(evidence_list)}")
    for e in evidence_list:
        print(f"- {e.get('original_filename')} : {e.get('status')}")

except Exception as e:
    print(f'Error: {e}')
