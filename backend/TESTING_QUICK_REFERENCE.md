# API Testing - Quick Reference

## Quick Start (2 minutes)

### 1. Prepare Environment
```bash
# Terminal 1: Start MQTT Broker
docker run -d -p 1883:1883 eclipse-mosquitto

# Terminal 2: Start Simulator  
cd Simulate && python simulate_esp32.py

# Terminal 3: Start Backend
cd backend && python main.py
```

### 2. Run Automated Tests
```bash
# Make script executable
chmod +x backend/test_api.sh

# Run all tests
bash backend/test_api.sh
```

**Expected Output:**
```
========================================
TEST SUMMARY
========================================
Passed: 20
Failed: 0
Total: 20
Success Rate: 100%

✓ ALL TESTS PASSED!
```

---

## Manual Testing (Command Line)

### Setup Token
```bash
TOKEN=$(curl -s -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.access_token')

echo "Token: $TOKEN"
```

### Create Devices
```bash
# Light
LIGHT=$(curl -s -X POST "http://localhost:8000/api/v1/devices/?token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Light","device_type":"LIGHT","base_topic":"home/1/1"}' | jq -r '.id')

# Fan
FAN=$(curl -s -X POST "http://localhost:8000/api/v1/devices/?token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Fan","device_type":"FAN","base_topic":"home/1/2"}' | jq -r '.id')

# Door Lock
LOCK=$(curl -s -X POST "http://localhost:8000/api/v1/devices/?token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Lock","device_type":"DOOR_LOCK","base_topic":"home/1/3"}' | jq -r '.id')

echo "Light: $LIGHT, Fan: $FAN, Lock: $LOCK"
```

### Device Control
```bash
# Turn on
curl -X POST "http://localhost:8000/api/v1/device-control/$FAN/turn-on?token=$TOKEN" | jq

# Set brightness
curl -X POST "http://localhost:8000/api/v1/device-control/$LIGHT/set-brightness?token=$TOKEN&brightness=75" | jq

# Set color
curl -X POST "http://localhost:8000/api/v1/device-control/$LIGHT/set-color?token=$TOKEN&color=FF0000" | jq

# Check status
curl -X GET "http://localhost:8000/api/v1/device-control/$FAN/status?token=$TOKEN" | jq

# Get supported actions
curl -X GET "http://localhost:8000/api/v1/device-control/$FAN/supported-actions?token=$TOKEN" | jq
```

### Create & Run Mode
```bash
# Create mode
MODE=$(curl -s -X POST "http://localhost:8000/api/v1/modes/?token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Night\",\"actions\":[{\"device_id\":$LIGHT,\"action\":\"turn_off\"},{\"device_id\":$LOCK,\"action\":\"lock\"}],\"is_active\":false}" | jq -r '.id')

echo "Mode: $MODE"

# Activate mode
curl -X POST "http://localhost:8000/api/v1/modes/$MODE/activate?token=$TOKEN" | jq
```

---

## Testing Checklist

### ✓ Authentication (2 tests)
```bash
# 1. Login
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 2. Get user (need token from above)
curl -X GET "http://localhost:8000/api/v1/auth/me?token=$TOKEN"
```

### ✓ Devices (5 tests)
```bash
# 1. Create
curl -X POST "http://localhost:8000/api/v1/devices/?token=$TOKEN" ...

# 2. List
curl -X GET "http://localhost:8000/api/v1/devices/?token=$TOKEN"

# 3. Get one
curl -X GET "http://localhost:8000/api/v1/devices/1?token=$TOKEN"

# 4. Update
curl -X PUT "http://localhost:8000/api/v1/devices/1?token=$TOKEN" ...

# 5. Delete
curl -X DELETE "http://localhost:8000/api/v1/devices/1?token=$TOKEN"
```

### ✓ Device Control (6 tests)
```bash
# 1. Turn on
curl -X POST "http://localhost:8000/api/v1/device-control/1/turn-on?token=$TOKEN"

# 2. Turn off
curl -X POST "http://localhost:8000/api/v1/device-control/1/turn-off?token=$TOKEN"

# 3. Set brightness
curl -X POST "http://localhost:8000/api/v1/device-control/1/set-brightness?token=$TOKEN&brightness=75"

# 4. Set color
curl -X POST "http://localhost:8000/api/v1/device-control/1/set-color?token=$TOKEN&color=FF0000"

# 5. Get status
curl -X GET "http://localhost:8000/api/v1/device-control/1/status?token=$TOKEN"

# 6. Get supported actions
curl -X GET "http://localhost:8000/api/v1/device-control/1/supported-actions?token=$TOKEN"
```

### ✓ Modes (5 tests)
```bash
# 1. Create
curl -X POST "http://localhost:8000/api/v1/modes/?token=$TOKEN" ...

# 2. List
curl -X GET "http://localhost:8000/api/v1/modes/?token=$TOKEN"

# 3. Get one
curl -X GET "http://localhost:8000/api/v1/modes/1?token=$TOKEN"

# 4. Activate
curl -X POST "http://localhost:8000/api/v1/modes/1/activate?token=$TOKEN"

# 5. Deactivate
curl -X POST "http://localhost:8000/api/v1/modes/1/deactivate?token=$TOKEN"
```

---

## Key Verifications

### MQTT Connection
```bash
# Check backend logs for:
# [MQTT] Connected to localhost:1883
# [MQTT] Subscribed to home/1/+/command
```

### Device State Updates
```bash
# Backend logs should show:
# [CMD] Device 1: turn_on=None
# [STATUS] Published to home/1/1/status: {...}
```

### Simulator Activity
```bash
# Simulator output should show:
# [MQTT] Subscribed to: home/1/+/command
# [CMD] Device X: action=value
# [STATUS] Published to home/1/X/status: {...}
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Connection refused" | Start backend: `python main.py` |
| MQTT not working | Start broker: `docker run -d -p 1883:1883 eclipse-mosquitto` |
| Simulator not receiving commands | Check broker is running, check topic subscription |
| Invalid token error | Get new token: see "Setup Token" section |
| Device not found | Create device first: see "Create Devices" section |
| Failed to set brightness | Check value is 0-100 |
| Action not supported | Device type doesn't support that action |

---

## HTTP Status Codes Reference

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | ✓ Test passed |
| 400 | Bad Request | Check request payload/params |
| 401 | Unauthorized | Get new token |
| 403| Forbidden | Check device ownership |
| 404 | Not Found | Check resource exists |
| 500 | Server Error | Check backend logs |

---

## Performance Testing

### Load Test: Create 100 Devices
```bash
for i in {1..100}; do
  curl -s -X POST "http://localhost:8000/api/v1/devices/?token=$TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Device $i\",\"device_type\":\"LIGHT\",\"base_topic\":\"home/1/$i\"}" > /dev/null
  echo "Created device $i"
done
```

### Load Test: Control Devices in Rapid Succession
```bash
for i in {1..50}; do
  curl -s -X POST "http://localhost:8000/api/v1/device-control/1/turn-on?token=$TOKEN" > /dev/null
  curl -s -X POST "http://localhost:8000/api/v1/device-control/1/turn-off?token=$TOKEN" > /dev/null
  echo "Toggled device 50 times"
done
```

---

## API Documentation Link

Full API documentation: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

Complete testing plan: [TESTING_PLAN.md](TESTING_PLAN.md)
