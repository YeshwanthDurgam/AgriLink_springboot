import requests
import json

# Test admin login
login_data = {
    "email": "admin@agrilink.com",
    "password": "Admin@123"
}

print("[*] Testing admin login...")

endpoints = [
    "http://localhost:8081/api/v1/auth/login",
    "http://localhost:8081/api/auth/login"
]

for endpoint in endpoints:
    try:
        print(f"\n[*] Trying endpoint: {endpoint}")
        response = requests.post(
            endpoint,
            json=login_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"    Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✓ Login successful!")
            data = response.json()
            print(f"\n    Response:")
            if 'data' in data:
                auth_data = data['data']
                print(f"      Token: {auth_data.get('token', 'N/A')[:50]}...")
                print(f"      User ID: {auth_data.get('userId')}")
                print(f"      Email: {auth_data.get('email')}")
                print(f"      Roles: {auth_data.get('roles')}")
            break
        else:
            print(f"    ✗ Status: {response.status_code}")
            try:
                error_data = response.json()
                print(f"    Error: {error_data.get('message', response.text[:100])}")
            except:
                print(f"    Response: {response.text[:200]}")
            
    except Exception as e:
        print(f"    ✗ Error: {e}")
