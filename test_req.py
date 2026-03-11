import urllib.request, json, urllib.error
data = json.dumps({'fecha':'2026-03-24','hora_inicio':'08:00','hora_fin':'12:00','jornada':'MAÑANA','auditorio_id':2}).encode('utf-8')
req = urllib.request.Request('http://51.79.35.88/api/eventos/hold', data=data, headers={'Content-Type': 'application/json'}, method='POST')
try:
    with urllib.request.urlopen(req) as r:
        print("Success:", r.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"Error {e.code}: {e.read().decode('utf-8')}")
except Exception as e:
    print("Other error:", e)
