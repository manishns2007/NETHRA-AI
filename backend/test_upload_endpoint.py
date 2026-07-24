import urllib.request
import uuid

boundary = '----WebKitFormBoundary' + uuid.uuid4().hex
filename = 'test_' + uuid.uuid4().hex[:6] + '.txt'

body_bytes = (
    f'--{boundary}\r\n'
    f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
    f'Content-Type: text/plain\r\n\r\n'
    f'Test content for evidence upload\r\n'
    f'--{boundary}\r\n'
    f'Content-Disposition: form-data; name="source_type"\r\n\r\n'
    f'whatsapp_export\r\n'
    f'--{boundary}--\r\n'
).encode('utf-8')

req = urllib.request.Request(
    'https://nethra-web-production.up.railway.app/api/v1/evidence/upload',
    data=body_bytes,
    headers={'Content-Type': f'multipart/form-data; boundary={boundary}'},
    method='POST'
)

try:
    with urllib.request.urlopen(req) as resp:
        print('Upload Status:', resp.status)
        print('Response Body:', resp.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print('HTTP Error:', e.code, e.reason)
    print('Response Body:', e.read().decode('utf-8'))
except Exception as e:
    print('Upload Exception:', e)
