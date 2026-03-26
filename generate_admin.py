import requests
import json

# Register new admin user
reg_data = {
    "email": "admin@agrilink.com",
    "password": "Admin@123",
    "firstName": "Admin",
    "lastName": "User",
    "roles": ["ADMIN"]
}

print("[*] Attempting to register admin user via API...")

# Try both endpoint paths
endpoints = [
    "http://localhost:8081/api/v1/auth/register",
    "http://localhost:8081/api/auth/register"
]

for endpoint in endpoints:
    try:
        print(f"\n[*] Trying endpoint: {endpoint}")
        response = requests.post(
            endpoint,
            json=reg_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"    Status Code: {response.status_code}")
        
        if response.status_code in [200, 201]:
            print("✓ Admin registered successfully!")
            data = response.json()
            print(f"    Response: {json.dumps(data, indent=2)}")
            break
        elif response.status_code == 409:
            print("    ✗ Conflict - user may already exist")
        elif response.status_code == 403:
            print(f"    ✗ Forbidden: {response.text}")
        else:
            print(f"    ✗ Status: {response.status_code}")
            print(f"    Response: {response.text[:200]}")
            
    except Exception as e:
        print(f"    ✗ Error: {e}")
