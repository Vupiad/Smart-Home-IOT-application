#!/bin/bash

# Smart Home IoT API - Automated Test Script
# Usage: bash test_api.sh

set -e  # Exit on error

API_URL="http://localhost:8000"
FAILURES=0
SUCCESSES=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_test() {
    echo -e "${YELLOW}Test: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ PASS: $1${NC}"
    ((SUCCESSES++))
}

print_failure() {
    echo -e "${RED}✗ FAIL: $1${NC}"
    ((FAILURES++))
}

check_response() {
    local response=$1
    local expected_code=$2
    local test_name=$3
    
    local status_code=$(echo "$response" | tail -n1)
    
    if [ "$status_code" == "$expected_code" ]; then
        print_success "$test_name"
    else
        print_failure "$test_name (Expected: $expected_code, Got: $status_code)"
    fi
}

# Test 1: Check Server Health
print_header "1. SERVER HEALTH CHECK"
print_test "Server is running on $API_URL"

HEALTH=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/health")
STATUS=$(echo "$HEALTH" | tail -n1)

if [ "$STATUS" == "200" ]; then
    print_success "Server is healthy"
else
    print_failure "Server not responding (Status: $STATUS)"
    echo "Make sure backend is running: python main.py"
    exit 1
fi

# Test 2: Authentication
print_header "2. AUTHENTICATION TESTS"

# 2.1 Login
print_test "Login with default credentials"
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

STATUS=$(echo "$LOGIN_RESPONSE" | tail -n1)
TOKEN=$(echo "$LOGIN_RESPONSE" | head -n-1 | jq -r '.access_token' 2>/dev/null)

if [ "$STATUS" == "200" ] && [ ! -z "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    print_success "Login successful"
    echo "Token: ${TOKEN:0:30}..."
else
    print_failure "Login failed (Status: $STATUS)"
    exit 1
fi

# 2.2 Get User Info
print_test "Get current user info"
ME_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/api/v1/auth/me?token=$TOKEN")
STATUS=$(echo "$ME_RESPONSE" | tail -n1)

if [ "$STATUS" == "200" ]; then
    print_success "Get user info successful"
else
    print_failure "Get user info failed (Status: $STATUS)"
fi

# Test 3: Device Management
print_header "3. DEVICE MANAGEMENT TESTS"

# 3.1 Create Light Device
print_test "Create Light device"
LIGHT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/v1/devices/?token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Living Room Light",
    "device_type": "LIGHT",
    "base_topic": "home/1/1",
    "settings": {"brightness": 100, "color": "white"}
  }')

STATUS=$(echo "$LIGHT_RESPONSE" | tail -n1)
LIGHT_ID=$(echo "$LIGHT_RESPONSE" | head -n-1 | jq -r '.id' 2>/dev/null)

if [ "$STATUS" == "200" ] && [ ! -z "$LIGHT_ID" ] && [ "$LIGHT_ID" != "null" ]; then
    print_success "Light device created (ID: $LIGHT_ID)"
else
    print_failure "Failed to create light device (Status: $STATUS)"
fi

# 3.2 Create Fan Device
print_test "Create Fan device"
FAN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/v1/devices/?token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bedroom Fan",
    "device_type": "FAN",
    "base_topic": "home/1/2",
    "settings": {}
  }')

STATUS=$(echo "$FAN_RESPONSE" | tail -n1)
FAN_ID=$(echo "$FAN_RESPONSE" | head -n-1 | jq -r '.id' 2>/dev/null)

if [ "$STATUS" == "200" ] && [ ! -z "$FAN_ID" ] && [ "$FAN_ID" != "null" ]; then
    print_success "Fan device created (ID: $FAN_ID)"
else
    print_failure "Failed to create fan device (Status: $STATUS)"
fi

# 3.3 Create Door Lock Device
print_test "Create Door Lock device"
LOCK_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/v1/devices/?token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Front Door Lock",
    "device_type": "DOOR_LOCK",
    "base_topic": "home/1/3",
    "settings": {}
  }')

STATUS=$(echo "$LOCK_RESPONSE" | tail -n1)
LOCK_ID=$(echo "$LOCK_RESPONSE" | head -n-1 | jq -r '.id' 2>/dev/null)

if [ "$STATUS" == "200" ] && [ ! -z "$LOCK_ID" ] && [ "$LOCK_ID" != "null" ]; then
    print_success "Door lock device created (ID: $LOCK_ID)"
else
    print_failure "Failed to create door lock device (Status: $STATUS)"
fi

# 3.4 List Devices
print_test "List all devices"
LIST_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/api/v1/devices/?token=$TOKEN")
STATUS=$(echo "$LIST_RESPONSE" | tail -n1)
COUNT=$(echo "$LIST_RESPONSE" | head -n-1 | jq 'length' 2>/dev/null)

if [ "$STATUS" == "200" ] && [ "$COUNT" -ge "3" ]; then
    print_success "List devices returned $COUNT devices"
else
    print_failure "List devices failed (Status: $STATUS)"
fi

# 3.5 Get Specific Device
print_test "Get specific device"
GET_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/api/v1/devices/$LIGHT_ID?token=$TOKEN")
STATUS=$(echo "$GET_RESPONSE" | tail -n1)

if [ "$STATUS" == "200" ]; then
    print_success "Get device successful"
else
    print_failure "Get device failed (Status: $STATUS)"
fi

# 3.6 Update Device
print_test "Update device"
UPDATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL/api/v1/devices/$LIGHT_ID?token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Living Room Light",
    "settings": {"brightness": 80, "color": "warm"}
  }')

STATUS=$(echo "$UPDATE_RESPONSE" | tail -n1)

if [ "$STATUS" == "200" ]; then
    print_success "Device updated"
else
    print_failure "Device update failed (Status: $STATUS)"
fi

# Test 4: Device Control (MQTT)
print_header "4. DEVICE CONTROL TESTS (MQTT)"

# 4.1 Turn On Device
print_test "Turn on device"
TURNON_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/v1/device-control/$FAN_ID/turn-on?token=$TOKEN")
STATUS=$(echo "$TURNON_RESPONSE" | tail -n1)
SUCCESS=$(echo "$TURNON_RESPONSE" | head -n-1 | jq -r '.success' 2>/dev/null)

if [ "$STATUS" == "200" ] && [ "$SUCCESS" == "true" ]; then
    print_success "Device turned on"
else
    print_failure "Turn on device failed (Status: $STATUS)"
fi

# 4.2 Get Device Status
print_test "Get device status"
STATUS_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/api/v1/device-control/$FAN_ID/status?token=$TOKEN")
STATUS=$(echo "$STATUS_RESPONSE" | tail -n1)
IS_ONLINE=$(echo "$STATUS_RESPONSE" | head -n-1 | jq -r '.is_online' 2>/dev/null)

if [ "$STATUS" == "200" ] && [ "$IS_ONLINE" == "true" ]; then
    print_success "Device status retrieved (is_online: true)"
else
    print_failure "Get device status failed (Status: $STATUS)"
fi

# 4.3 Set Brightness
print_test "Set brightness"
BRIGHTNESS_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/v1/device-control/$LIGHT_ID/set-brightness?token=$TOKEN&brightness=75")
STATUS=$(echo "$BRIGHTNESS_RESPONSE" | tail -n1)

if [ "$STATUS" == "200" ]; then
    print_success "Brightness set to 75%"
else
    print_failure "Set brightness failed (Status: $STATUS)"
fi

# 4.4 Set Color
print_test "Set color"
COLOR_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/v1/device-control/$LIGHT_ID/set-color?token=$TOKEN&color=FF0000")
STATUS=$(echo "$COLOR_RESPONSE" | tail -n1)

if [ "$STATUS" == "200" ]; then
    print_success "Color set to FF0000"
else
    print_failure "Set color failed (Status: $STATUS)"
fi

# 4.5 Get Supported Actions
print_test "Get supported actions"
ACTIONS_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/api/v1/device-control/$FAN_ID/supported-actions?token=$TOKEN")
STATUS=$(echo "$ACTIONS_RESPONSE" | tail -n1)

if [ "$STATUS" == "200" ]; then
    print_success "Supported actions retrieved"
else
    print_failure "Get supported actions failed (Status: $STATUS)"
fi

# Test 5: Mode/Automation
print_header "5. MODE/AUTOMATION TESTS"

# 5.1 Create Mode
print_test "Create automation mode"
MODE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/v1/modes/?token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Good Night Mode\",
    \"description\": \"Turn off lights and fan, lock door\",
    \"actions\": [
      {\"device_id\": $LIGHT_ID, \"action\": \"turn_off\", \"value\": null, \"delay\": 0},
      {\"device_id\": $FAN_ID, \"action\": \"turn_off\", \"value\": null, \"delay\": 1},
      {\"device_id\": $LOCK_ID, \"action\": \"lock\", \"value\": null, \"delay\": 2}
    ],
    \"is_active\": false
  }")

STATUS=$(echo "$MODE_RESPONSE" | tail -n1)
MODE_ID=$(echo "$MODE_RESPONSE" | head -n-1 | jq -r '.id' 2>/dev/null)

if [ "$STATUS" == "200" ] && [ ! -z "$MODE_ID" ] && [ "$MODE_ID" != "null" ]; then
    print_success "Mode created (ID: $MODE_ID)"
else
    print_failure "Failed to create mode (Status: $STATUS)"
fi

# 5.2 List Modes
print_test "List all modes"
LIST_MODES=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/api/v1/modes/?token=$TOKEN")
STATUS=$(echo "$LIST_MODES" | tail -n1)

if [ "$STATUS" == "200" ]; then
    print_success "List modes successful"
else
    print_failure "List modes failed (Status: $STATUS)"
fi

# 5.3 Get Specific Mode
print_test "Get specific mode"
GET_MODE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/api/v1/modes/$MODE_ID?token=$TOKEN")
STATUS=$(echo "$GET_MODE" | tail -n1)

if [ "$STATUS" == "200" ]; then
    print_success "Get mode successful"
else
    print_failure "Get mode failed (Status: $STATUS)"
fi

# 5.4 Activate Mode
print_test "Activate mode"
ACTIVATE_MODE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/v1/modes/$MODE_ID/activate?token=$TOKEN")
STATUS=$(echo "$ACTIVATE_MODE" | tail -n1)
IS_ACTIVE=$(echo "$ACTIVATE_MODE" | head -n-1 | jq -r '.is_active' 2>/dev/null)

if [ "$STATUS" == "200" ] && [ "$IS_ACTIVE" == "true" ]; then
    print_success "Mode activated"
else
    print_failure "Activate mode failed (Status: $STATUS)"
fi

# Test 6: Error Handling
print_header "6. ERROR HANDLING TESTS"

# 6.1 Invalid Token
print_test "Invalid token rejection"
INVALID_TOKEN=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/api/v1/devices/?token=invalid_token_12345")
STATUS=$(echo "$INVALID_TOKEN" | tail -n1)

if [ "$STATUS" == "401" ]; then
    print_success "Invalid token correctly rejected"
else
    print_failure "Invalid token not properly handled (Status: $STATUS)"
fi

# 6.2 Non-existent Device
print_test "Non-existent device"
NOT_FOUND=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/api/v1/devices/99999?token=$TOKEN")
STATUS=$(echo "$NOT_FOUND" | tail -n1)

if [ "$STATUS" == "404" ] || [ "$STATUS" == "403" ]; then
    print_success "Non-existent device correctly rejected"
else
    print_failure "Non-existent device not properly handled (Status: $STATUS)"
fi

# 6.3 Invalid Brightness Value
print_test "Invalid brightness value"
INVALID_BRIGHTNESS=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/v1/device-control/$LIGHT_ID/set-brightness?token=$TOKEN&brightness=150")
STATUS=$(echo "$INVALID_BRIGHTNESS" | tail -n1)

if [ "$STATUS" == "400" ]; then
    print_success "Invalid brightness correctly rejected"
else
    print_failure "Invalid brightness not properly handled (Status: $STATUS)"
fi

# Final Summary
print_header "TEST SUMMARY"
TOTAL=$((SUCCESSES + FAILURES))
PERCENTAGE=$((SUCCESSES * 100 / TOTAL))

echo -e "${GREEN}Passed: $SUCCESSES${NC}"
echo -e "${RED}Failed: $FAILURES${NC}"
echo -e "Total: $TOTAL"
echo -e "Success Rate: ${PERCENTAGE}%"

if [ $FAILURES -eq 0 ]; then
    echo -e "\n${GREEN}✓ ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "\n${RED}✗ SOME TESTS FAILED${NC}"
    exit 1
fi
