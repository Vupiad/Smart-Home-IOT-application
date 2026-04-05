# API Testing Plan - Smart Home IoT Application

## Overview
Complete testing strategy for all API endpoints including authentication, device management, device control, and automation modes.

---

## Prerequisites & Setup

### 1. Start MQTT Broker
```bash
# Using Mosquitto (if installed)
mosquitto -c /path/to/mosquitto.conf

# Or use Docker
docker run -d -p 1883:1883 eclipse-mosquitto
```

### 2. Start Device Simulator
```bash
cd Simulate
python simulate_esp32.py
```

### 3. Start Backend Server
```bash
cd backend
python main.py
```

### 4. Install Testing Tools (Optional)
```bash
# For better testing experience
pip install httpie  # Better than curl
pip install pytest  # For automated tests
```

---

## Testing Flow & Order

```
1. AUTHENTICATION TESTS
   ├─ Login (get token)
   ├─ Register new user
   └─ Get current user info

2. DEVICE MANAGEMENT TESTS
   ├─ Create device
   ├─ List devices
   ├─ Get specific device
   ├─ Update device
   └─ Delete device

3. DEVICE CONTROL TESTS (MQTT)
   ├─ Turn on/off device
   ├─ Set brightness
   ├─ Set color
   ├─ Get device status
   ├─ Get supported actions
   └─ Verify MQTT integration

4. MODE/AUTOMATION TESTS
   ├─ Create mode
   ├─ List modes
   ├─ Get specific mode
   ├─ Update mode
   ├─ Activate mode
   ├─ Deactivate mode
   └─ Delete mode

5. INTEGRATION TESTS
   ├─ Multi-device control
   ├─ Mode execution with multiple devices
   ├─ State persistence
   └─ Error handling
```

---

## Authentication Tests

### Test 1: Login with Default Credentials

**Test Case:** User logs in with admin/admin123

```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**Expected Response (200):**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@smarthome.local"
  }
}
```

**Extract Token:**
```bash
TOKEN=$(curl -s -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.access_token')

echo "Token: $TOKEN"
```

---

### Test 2: Login with Invalid Credentials

**Test Case:** User attempts login with wrong password

```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "wrongpassword"
  }'
```

**Expected Response (400):**
```json
{"detail": "Invalid credentials"}
```

**Verification:** ✅ Should return 400 error

---

### Test 3: Register New User

**Test Case:** Register a new user account

```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

**Expected Response (200):**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": 2,
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

**Verification:** ✅ New user created with ID 2

---

### Test 4: Get Current User Info

**Test Case:** Retrieve authenticated user information

```bash
curl -X GET "http://localhost:8000/api/v1/auth/me?token=$TOKEN"
```

**Expected Response (200):**
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@smarthome.local",
  "created_at": "2026-04-05T10:00:00"
}
```

**Verification:** ✅ Returns correct user information

---

### Test 5: Access Protected Endpoint Without Token

**Test Case:** Attempt to access protected endpoint without token

```bash
curl -X GET "http://localhost:8000/api/v1/auth/me"
```

**Expected Response (401):**
```json
{"detail": "Invalid token"}
```

**Verification:** ✅ Rejects unauthenticated access

---

## Device Management Tests

### Test 1: Create First Device (Light)

**Test Case:** Create a light device

```bash
curl -X POST "http://localhost:8000/api/v1/devices/?token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Living Room Light",
    "device_type": "LIGHT",
    "base_topic": "home/1/1",
    "settings": {
      "brightness": 100,
      "color": "white"
    }
  }'
```

**Expected Response (200):**
```json
{
  "id": 1,
  "owner_id": 1,
  "name": "Living Room Light",
  "device_type": "LIGHT",
  "base_topic": "home/1/1",
  "settings": {"brightness": 100, "color": "white"},
  "state": {},
  "is_online": false,
  "last_seen": null,
  "supported_actions": []
}
```

**Save Device ID:**
```bash
DEVICE_ID=1  # From response
```

**Verification:** ✅ Device created with ID 1

---

### Test 2: Create Second Device (Fan)

**Test Case:** Create a fan device

```bash
curl -X POST "http://localhost:8000/api/v1/devices/?token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bedroom Fan",
    "device_type": "FAN",
    "base_topic": "home/1/2",
    "settings": {}
  }'
```

**Expected Response (200):**
```json
{
  "id": 2,
  "owner_id": 1,
  "name": "Bedroom Fan",
  "device_type": "FAN",
  ...
}
```

**Save Device ID:**
```bash
FAN_ID=2
```

---

### Test 3: Create Third Device (Door Lock)

**Test Case:** Create a door lock device

```bash
curl -X POST "http://localhost:8000/api/v1/devices/?token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Front Door Lock",
    "device_type": "DOOR_LOCK",
    "base_topic": "home/1/3",
    "settings": {}
  }'
```

**Save Device ID:**
```bash
LOCK_ID=3
```

---

### Test 4: List All Devices

**Test Case:** Retrieve all devices owned by user

```bash
curl -X GET "http://localhost:8000/api/v1/devices/?token=$TOKEN"
```

**Expected Response (200):**
```json
[
  {"id": 1, "name": "Living Room Light", ...},
  {"id": 2, "name": "Bedroom Fan", ...},
  {"id": 3, "name": "Front Door Lock", ...}
]
```

**Verification:** ✅ Returns 3 devices

---

### Test 5: Get Specific Device

**Test Case:** Retrieve device by ID

```bash
curl -X GET "http://localhost:8000/api/v1/devices/1?token=$TOKEN"
```

**Expected Response (200):**
```json
{
  "id": 1,
  "name": "Living Room Light",
  "device_type": "LIGHT",
  ...
}
```

**Verification:** ✅ Returns correct device

---

### Test 6: Update Device

**Test Case:** Update device name and settings

```bash
curl -X PUT "http://localhost:8000/api/v1/devices/1?token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Living Room Light",
    "settings": {
      "brightness": 80,
      "color": "warm"
    }
  }'
```

**Expected Response (200):**
```json
{
  "id": 1,
  "name": "Updated Living Room Light",
  "settings": {"brightness": 80, "color": "warm"},
  ...
}
```

**Verification:** ✅ Device updated successfully

---

### Test 7: Delete Device

**Test Case:** Delete a device

```bash
curl -X DELETE "http://localhost:8000/api/v1/devices/1?token=$TOKEN"
```

**Expected Response (200):**
```json
{
  "message": "Device deleted successfully",
  "device_id": 1
}
```

**Verification:** ✅ Device deleted

---

### Test 8: Verify Deletion

**Test Case:** Verify device is gone

```bash
curl -X GET "http://localhost:8000/api/v1/devices/1?token=$TOKEN"
```

**Expected Response (404):**
```json
{"detail": "Device not found"}
```

**Verification:** ✅ Device no longer exists

---

### Test 9: Ownership Verification

**Test Case:** Attempt to access another user's device

```bash
# Login as different user
OTHER_TOKEN=$(curl -s -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}' | jq -r '.access_token')

# Try to access admin's device
curl -X GET "http://localhost:8000/api/v1/devices/2?token=$OTHER_TOKEN"
```

**Expected Response (403 or 404):**
```json
{"detail": "You don't have access to this device"}
```

**Verification:** ✅ Ownership protection works

---

## Device Control Tests (MQTT)

### Prerequisites for Device Control Tests
- MQTT broker running
- Simulator running and subscribing to topics
- At least one device created (Device ID: 2 = Fan)

### Test 1: Turn On Device

**Test Case:** Turn on the fan device

```bash
curl -X POST "http://localhost:8000/api/v1/device-control/2/turn-on?token=$TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Device turned on",
  "device_id": 2,
  "action": "turn_on",
  "device_state": {"power": true}
}
```

**Simulator Output:** Should see command received and state updated

**Verification:** ✅ Device state updated

---

### Test 2: Verify Device Is Online

**Test Case:** Check device status after turning on

```bash
curl -X GET "http://localhost:8000/api/v1/device-control/2/status?token=$TOKEN"
```

**Expected Response (200):**
```json
{
  "device_id": 2,
  "is_online": true,
  "state": {"power": true},
  "supported_actions": ["turn_on", "turn_off", "set_speed"]
}
```

**Verification:** ✅ Device marked as online

---

### Test 3: Set Brightness on Light

**Test Case:** Set brightness to 75%

```bash
curl -X POST "http://localhost:8000/api/v1/device-control/2/set-brightness?token=$TOKEN&brightness=75"
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Brightness set to 75%",
  "device_state": {"brightness": 75}
}
```

**Verification:** ✅ Brightness updated

---

### Test 4: Set Color on Light

**Test Case:** Set color to red

```bash
curl -X POST "http://localhost:8000/api/v1/device-control/2/set-color?token=$TOKEN&color=FF0000"
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Color set to FF0000",
  "device_state": {"color": "FF0000"}
}
```

**Verification:** ✅ Color updated

---

### Test 5: Generic Action Endpoint

**Test Case:** Execute generic action with value

```bash
curl -X POST "http://localhost:8000/api/v1/device-control/2/action?token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "set_speed",
    "value": 50
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Action 'set_speed' executed successfully",
  "action": "set_speed",
  "value": 50
}
```

**Verification:** ✅ Custom action executed

---

### Test 6: Get Supported Actions

**Test Case:** View all supported actions for device

```bash
curl -X GET "http://localhost:8000/api/v1/device-control/2/supported-actions?token=$TOKEN"
```

**Expected Response (200):**
```json
{
  "device_id": 2,
  "device_type": "FAN",
  "supported_actions": ["turn_on", "turn_off", "set_speed"]
}
```

**Verification:** ✅ Shows correct actions for device type

---

### Test 7: Invalid Action on Device

**Test Case:** Attempt unsupported action

```bash
curl -X POST "http://localhost:8000/api/v1/device-control/2/action?token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "set_color",
    "value": "FF0000"
  }'
```

**Expected Response (400):**
```json
{"detail": "Action 'set_color' not supported by FAN"}
```

**Verification:** ✅ Invalid action rejected

---

### Test 8: Invalid Parameter Value

**Test Case:** Set brightness to invalid value (>100)

```bash
curl -X POST "http://localhost:8000/api/v1/device-control/2/set-brightness?token=$TOKEN&brightness=150"
```

**Expected Response (400):**
```json
{"detail": "Invalid value for 'set_brightness': ..."}
```

**Verification:** ✅ Invalid values rejected

---

### Test 9: MQTT Topic Publishing

**Verification Checklist:**
- [ ] Check simulator output shows command received
- [ ] Verify topic is `home/{user_id}/{device_id}/command`
- [ ] Check payload contains action and value
- [ ] Verify status update published on `home/{user_id}/{device_id}/status`

**Manual Check in Simulator Output:**
```
[CMD] Device 2 (Bedroom Fan): turn_on=None
[STATUS] Published to home/1/2/status: {'power': True}
```

---

## Mode/Automation Tests

### Test 1: Create Mode with Multiple Actions

**Test Case:** Create "Good Night" automation mode

```bash
# Assuming Device IDs: 1=Light, 2=Fan, 3=Lock
curl -X POST "http://localhost:8000/api/v1/modes/?token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Good Night Mode",
    "description": "Turn off lights, fan, and lock door",
    "actions": [
      {
        "device_id": 1,
        "action": "turn_off",
        "value": null,
        "delay": 0
      },
      {
        "device_id": 2,
        "action": "turn_off",
        "value": null,
        "delay": 1
      },
      {
        "device_id": 3,
        "action": "lock",
        "value": null,
        "delay": 2
      }
    ],
    "is_active": false
  }'
```

**Expected Response (200):**
```json
{
  "id": 1,
  "user_id": 1,
  "name": "Good Night Mode",
  "actions": [
    {"device_id": 1, "action": "turn_off", "value": null, "delay": 0},
    {"device_id": 2, "action": "turn_off", "value": null, "delay": 1},
    {"device_id": 3, "action": "lock", "value": null, "delay": 2}
  ],
  "is_active": false
}
```

**Save Mode ID:**
```bash
MODE_ID=1
```

**Verification:** ✅ Mode created with all actions

---

### Test 2: List All Modes

**Test Case:** View all modes

```bash
curl -X GET "http://localhost:8000/api/v1/modes/?token=$TOKEN"
```

**Expected Response (200):**
```json
[
  {
    "id": 1,
    "name": "Good Night Mode",
    "is_active": false,
    ...
  }
]
```

**Verification:** ✅ Mode appears in list

---

### Test 3: Get Specific Mode

**Test Case:** Retrieve mode details

```bash
curl -X GET "http://localhost:8000/api/v1/modes/1?token=$TOKEN"
```

**Expected Response (200):**
```json
{
  "id": 1,
  "name": "Good Night Mode",
  "actions": [...]
}
```

**Verification:** ✅ Returns correct mode

---

### Test 4: Update Mode

**Test Case:** Modify mode name and actions

```bash
curl -X PUT "http://localhost:8000/api/v1/modes/1?token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sleep Mode",
    "actions": [
      {"device_id": 1, "action": "turn_off", "value": null, "delay": 0},
      {"device_id": 2, "action": "turn_off", "value": null, "delay": 0}
    ]
  }'
```

**Expected Response (200):**
```json
{
  "id": 1,
  "name": "Sleep Mode",
  "actions": [...]
}
```

**Verification:** ✅ Mode updated

---

### Test 5: Activate Mode

**Test Case:** Activate and execute mode

```bash
curl -X POST "http://localhost:8000/api/v1/modes/1/activate?token=$TOKEN"
```

**Expected Response (200):**
```json
{
  "message": "Mode activated",
  "mode_id": 1,
  "is_active": true
}
```

**Simulator Output:** Should see all actions executed in sequence

```
[CMD] Device 1: turn_off=None
[CMD] Device 2: turn_off=None
[STATUS] Published to home/1/1/status: {...}
[STATUS] Published to home/1/2/status: {...}
```

**Verification:** ✅ All actions executed

---

### Test 6: Check Mode Status After Activation

**Test Case:** Verify is_active flag

```bash
curl -X GET "http://localhost:8000/api/v1/modes/1?token=$TOKEN"
```

**Expected Response (200):**
```json
{
  "id": 1,
  "name": "Sleep Mode",
  "is_active": true
}
```

**Verification:** ✅ Mode marked as active

---

### Test 7: Deactivate Mode

**Test Case:** Turn off mode

```bash
curl -X POST "http://localhost:8000/api/v1/modes/1/deactivate?token=$TOKEN"
```

**Expected Response (200):**
```json
{
  "message": "Mode deactivated",
  "mode_id": 1,
  "is_active": false
}
```

**Verification:** ✅ Mode deactivated

---

### Test 8: Delete Mode

**Test Case:** Delete mode

```bash
curl -X DELETE "http://localhost:8000/api/v1/modes/1?token=$TOKEN"
```

**Expected Response (200):**
```json
{
  "message": "Mode deleted successfully",
  "mode_id": 1
}
```

**Verification:** ✅ Mode deleted

---

## Integration Tests

### Test 1: Full Control Flow

**Complete End-to-End Test:**

```bash
#!/bin/bash

# 1. Login
echo "=== TEST 1: Login ==="
TOKEN=$(curl -s -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.access_token')
echo "✓ Token: ${TOKEN:0:20}..."

# 2. Create Device
echo -e "\n=== TEST 2: Create Device ==="
DEVICE=$(curl -s -X POST "http://localhost:8000/api/v1/devices/?token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Light","device_type":"LIGHT","base_topic":"home/1/1"}')
DEVICE_ID=$(echo $DEVICE | jq -r '.id')
echo "✓ Device created: ID=$DEVICE_ID"

# 3. Control Device
echo -e "\n=== TEST 3: Turn On Device ==="
curl -s -X POST "http://localhost:8000/api/v1/device-control/$DEVICE_ID/turn-on?token=$TOKEN" | jq '.success'
echo "✓ Device turned on"

# 4. Check Status
echo -e "\n=== TEST 4: Check Device Status ==="
curl -s -X GET "http://localhost:8000/api/v1/device-control/$DEVICE_ID/status?token=$TOKEN" | jq '.is_online'
echo "✓ Device is online"

# 5. Create Mode
echo -e "\n=== TEST 5: Create Mode ==="
MODE=$(curl -s -X POST "http://localhost:8000/api/v1/modes/?token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test Mode\",\"actions\":[{\"device_id\":$DEVICE_ID,\"action\":\"turn_off\",\"value\":null}],\"is_active\":false}")
MODE_ID=$(echo $MODE | jq -r '.id')
echo "✓ Mode created: ID=$MODE_ID"

# 6. Activate Mode
echo -e "\n=== TEST 6: Activate Mode ==="
curl -s -X POST "http://localhost:8000/api/v1/modes/$MODE_ID/activate?token=$TOKEN" | jq '.is_active'
echo "✓ Mode activated"

echo -e "\n=== ALL TESTS COMPLETE ==="
```

**Expected Output:**
```
=== TEST 1: Login ===
✓ Token: eyJhbGc...

=== TEST 2: Create Device ===
✓ Device created: ID=1

=== TEST 3: Turn On Device ===
true
✓ Device turned on

=== TEST 4: Check Device Status ===
true
✓ Device is online

=== TEST 5: Create Mode ===
✓ Mode created: ID=1

=== TEST 6: Activate Mode ===
true
✓ Mode activated

=== ALL TESTS COMPLETE ===
```

---

### Test 2: State Persistence

**Test Case:** Verify device state is saved

```bash
# 1. Control device
curl -X POST "http://localhost:8000/api/v1/device-control/1/turn-on?token=$TOKEN"

# 2. Check status
curl -X GET "http://localhost:8000/api/v1/device-control/1/status?token=$TOKEN"

# 3. Restart backend (kill and restart main.py)

# 4. Check status again - should still show device state
curl -X GET "http://localhost:8000/api/v1/device-control/1/status?token=$TOKEN"
```

**Verification:** ✅ Device state persists across restarts

---

### Test 3: Error Handling

**Test Cases:**

```bash
# Invalid token
curl -X GET "http://localhost:8000/api/v1/devices/?token=invalid" 
# Expected: 401

# Non-existent device
curl -X GET "http://localhost:8000/api/v1/devices/99999?token=$TOKEN"
# Expected: 404

# Invalid brightness value
curl -X POST "http://localhost:8000/api/v1/device-control/1/set-brightness?token=$TOKEN&brightness=150"
# Expected: 400

# Missing required field
curl -X POST "http://localhost:8000/api/v1/devices/?token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"No Type Device"}'
# Expected: 422 (validation error)
```

---

## Automated Testing (Optional)

### Create pytest Test Suite

**File: `backend/tests/test_api.py`**

```python
import pytest
import httpx
import os

BASE_URL = "http://localhost:8000"
TOKEN = None
DEVICE_ID = None
MODE_ID = None

@pytest.fixture
def client():
    return httpx.Client(base_url=BASE_URL)

class TestAuth:
    def test_login(self, client):
        response = client.post("/api/v1/auth/login", 
            json={"username": "admin", "password": "admin123"})
        assert response.status_code == 200
        assert "access_token" in response.json()
        global TOKEN
        TOKEN = response.json()["access_token"]

class TestDevices:
    def test_create_device(self, client):
        response = client.post(f"/api/v1/devices/?token={TOKEN}",
            json={
                "name": "Test Light",
                "device_type": "LIGHT",
                "base_topic": "home/1/1"
            })
        assert response.status_code == 200
        global DEVICE_ID
        DEVICE_ID = response.json()["id"]

class TestDeviceControl:
    def test_turn_on_device(self, client):
        response = client.post(
            f"/api/v1/device-control/{DEVICE_ID}/turn-on?token={TOKEN}")
        assert response.status_code == 200
        assert response.json()["success"] is True

# Run with: pytest tests/test_api.py -v
```

---

## Monitoring & Verification

### Check Backend Logs

```bash
# Follow backend output for:
# [MQTT] Connected to broker
# [MQTT] Subscribed to home/1/+/command
# [CMD] Device {id}: {action}={value}
# [STATUS] Published to home/{user_id}/{device_id}/status
```

### Check Simulator Logs

```bash
# Look for:
# [MQTT] Connected
# [CMD] Device {id}: {action}={value}
# [STATUS] Published to home/{user_id}/{device_id}/status: {state}
```

### Check Database (JSON)

```bash
# View persisted state
cat backend/data.json | jq '.devices[] | {id, name, state, is_online}'
```

---

## Summary Checklist

### Authentication ✓
- [ ] Login with correct credentials
- [ ] Login with wrong credentials fails
- [ ] Register new user
- [ ] Get user info
- [ ] Protected endpoints reject invalid tokens

### Device Management ✓
- [ ] Create multiple devices
- [ ] List devices
- [ ] Get specific device
- [ ] Update device
- [ ] Delete device
- [ ] Ownership protection works

### Device Control ✓
- [ ] Turn on/off
- [ ] Set brightness
- [ ] Set color
- [ ] Get status
- [ ] Get supported actions
- [ ] Invalid actions rejected
- [ ] Invalid parameters rejected
- [ ] MQTT messages published correctly

### Modes ✓
- [ ] Create mode with multiple actions
- [ ] List modes
- [ ] Get specific mode
- [ ] Update mode
- [ ] Activate mode executes all actions
- [ ] Deactivate mode
- [ ] Delete mode

### Integration ✓
- [ ] Full end-to-end flow works
- [ ] Device state persists
- [ ] Error handling works
- [ ] State survives restart

---

## Conclusion

This testing plan covers:
- **25+ Test Cases** across all endpoints
- **Manual Testing** with curl examples
- **MQTT Integration** verification
- **Error Scenarios** and edge cases
- **Automated Testing** framework (optional)
- **Complete Verification** checklist

All tests should pass before considering the API ready for production use.
