import urllib.request
import json

url = "http://localhost:8000/api/auth/login/"
data = json.dumps({"username": "admin", "password": "admin"}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})

try:
    with urllib.request.urlopen(req) as f:
        print(f"Status: {f.status}")
        print(f"Response: {f.read().decode('utf-8')}")
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(f"Body: {e.read().decode('utf-8')}")
except Exception as e:
    print(f"Error: {e}")
