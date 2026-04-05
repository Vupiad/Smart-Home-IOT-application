# Smart Home IoT API Documentation

## Overview

The Smart Home IoT API provides endpoints for user authentication, device management, and automation mode control. The backend supports both JSON file storage (single-user) and PostgreSQL databases.

---

## Quick Start

### Default Credentials

```
Username: admin
Password: admin123
Email: admin@smarthome.local
```

The default user is automatically created on application startup.

### Database Selection

Set `DATABASE_TYPE` in `.env`:
- `json` — JSON file storage (no database required)
- `postgresql` — PostgreSQL backend (requires running PostgreSQL)

Currently configured: `DATABASE_TYPE=json`

---

## Authentication Endpoints

All protected endpoints require a JWT token passed as a query parameter: `?token=YOUR_TOKEN`

### 1. Login

**Endpoint:** `POST /api/v1/auth/login`

**Request:**
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@smarthome.local",
    "hashed_password": "$2b$12...",
    "created_at": "2026-04-05T10:30:00"
  }
}
```

### 2. Register New User

**Endpoint:** `POST /api/v1/auth/register`

**Request:**
```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "user@example.com",
    "password": "securepass123"
  }'
```

**Response:** Same as login

### 3. Get Current User Info

**Endpoint:** `GET /api/v1/auth/me`

**Request:**
```bash
curl -X GET "http://localhost:8000/api/v1/auth/me?token=YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@smarthome.local",
  "created_at": "2026-04-05T10:30:00"
}
```

---

## Device Management Endpoints

All device endpoints require authentication (`?token=YOUR_TOKEN`).

### 1. Create Device

**Endpoint:** `POST /api/v1/devices/?token=TOKEN`

**Request:**
```bash
curl -X POST "http://localhost:8000/api/v1/devices/?token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Living Room Light",
    "device_type": "light",
    "base_topic": "home/living_room/light",
    "settings": {
      "brightness": 100,
      "color": "white"
    }
  }'
```

**Response:**
```json
{
  "id": 1,
  "owner_id": 1,
  "name": "Living Room Light",
  "device_type": "light",
  "base_topic": "home/living_room/light",
  "settings": {"brightness": 100, "color": "white"},
  "last_online": "2026-04-05T10:35:00"
}
```

### 2. List All Devices

**Endpoint:** `GET /api/v1/devices/?token=TOKEN`

**Request:**
```bash
curl -X GET "http://localhost:8000/api/v1/devices/?token=YOUR_TOKEN"
```

**Response:**
```json
[
  {
    "id": 1,
    "owner_id": 1,
    "name": "Living Room Light",
    "device_type": "light",
    "base_topic": "home/living_room/light",
    "settings": {...},
    "last_online": "2026-04-05T10:35:00"
  },
  {
    "id": 2,
    "owner_id": 1,
    "name": "Bedroom Door Sensor",
    "device_type": "door",
    "base_topic": "home/bedroom/door",
    "settings": {},
    "last_online": "2026-04-05T10:36:00"
  }
]
```

### 3. Get Specific Device

**Endpoint:** `GET /api/v1/devices/{device_id}?token=TOKEN`

**Request:**
```bash
curl -X GET "http://localhost:8000/api/v1/devices/1?token=YOUR_TOKEN"
```

**Response:** Single device object (see Create Device response)

### 4. Update Device

**Endpoint:** `PUT /api/v1/devices/{device_id}?token=TOKEN`

**Request:**
```bash
curl -X PUT "http://localhost:8000/api/v1/devices/1?token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Light Name",
    "settings": {
      "brightness": 80,
      "color": "warm"
    }
  }'
```

**Response:** Updated device object

### 5. Delete Device

**Endpoint:** `DELETE /api/v1/devices/{device_id}?token=TOKEN`

**Request:**
```bash
curl -X DELETE "http://localhost:8000/api/v1/devices/1?token=YOUR_TOKEN"
```

**Response:**
```json
{
  "message": "Device deleted successfully",
  "device_id": 1
}
```

---

## Automation Mode Endpoints

Modes allow you to create automation scripts that control multiple devices.

### 1. Create Mode

**Endpoint:** `POST /api/v1/modes/?token=TOKEN`

**Request:**
```bash
curl -X POST "http://localhost:8000/api/v1/modes/?token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Goodnight Mode",
    "actions": [
      {
        "device_id": 1,
        "action": "set_brightness",
        "value": 0
      },
      {
        "device_id": 3,
        "action": "lock",
        "value": true
      }
    ],
    "is_active": false
  }'
```

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "name": "Goodnight Mode",
  "actions": [
    {"device_id": 1, "action": "set_brightness", "value": 0},
    {"device_id": 3, "action": "lock", "value": true}
  ],
  "is_active": false,
  "created_at": "2026-04-05T10:40:00"
}
```

### 2. List All Modes

**Endpoint:** `GET /api/v1/modes/?token=TOKEN`

**Request:**
```bash
curl -X GET "http://localhost:8000/api/v1/modes/?token=YOUR_TOKEN"
```

**Response:** Array of mode objects

### 3. Get Specific Mode

**Endpoint:** `GET /api/v1/modes/{mode_id}?token=TOKEN`

**Request:**
```bash
curl -X GET "http://localhost:8000/api/v1/modes/1?token=YOUR_TOKEN"
```

**Response:** Single mode object

### 4. Update Mode

**Endpoint:** `PUT /api/v1/modes/{mode_id}?token=TOKEN`

**Request:**
```bash
curl -X PUT "http://localhost:8000/api/v1/modes/1?token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Mode Name",
    "actions": [
      {"device_id": 2, "action": "toggle", "value": true}
    ]
  }'
```

**Response:** Updated mode object

### 5. Delete Mode

**Endpoint:** `DELETE /api/v1/modes/{mode_id}?token=TOKEN`

**Request:**
```bash
curl -X DELETE "http://localhost:8000/api/v1/modes/1?token=YOUR_TOKEN"
```

**Response:**
```json
{
  "message": "Mode deleted successfully",
  "mode_id": 1
}
```

### 6. Activate Mode

**Endpoint:** `POST /api/v1/modes/{mode_id}/activate?token=TOKEN`

**Request:**
```bash
curl -X POST "http://localhost:8000/api/v1/modes/1/activate?token=YOUR_TOKEN"
```

**Response:**
```json
{
  "message": "Mode activated",
  "mode_id": 1,
  "is_active": true
}
```

### 7. Deactivate Mode

**Endpoint:** `POST /api/v1/modes/{mode_id}/deactivate?token=TOKEN`

**Request:**
```bash
curl -X POST "http://localhost:8000/api/v1/modes/1/deactivate?token=YOUR_TOKEN"
```

**Response:**
```json
{
  "message": "Mode deactivated",
  "mode_id": 1,
  "is_active": false
}
```

---

## Example Workflow

### Step 1: Login
```bash
TOKEN=$(curl -s -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.access_token')

echo "Token: $TOKEN"
```

### Step 2: Create a Device
```bash
curl -X POST "http://localhost:8000/api/v1/devices/?token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Living Room Fan",
    "device_type": "fan",
    "base_topic": "home/living_room/fan"
  }'
```

### Step 3: Create an Automation Mode
```bash
curl -X POST "http://localhost:8000/api/v1/modes/?token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Mode",
    "actions": [{"device_id": 1, "action": "turn_on", "value": true}],
    "is_active": false
  }'
```

### Step 4: Control a Device
```bash
# Turn on device
curl -X POST "http://localhost:8000/api/v1/device-control/1/turn-on?token=$TOKEN"

# Set brightness to 75%
curl -X POST "http://localhost:8000/api/v1/device-control/1/set-brightness?token=$TOKEN&brightness=75"

# Set color to red
curl -X POST "http://localhost:8000/api/v1/device-control/1/set-color?token=$TOKEN&color=FF0000"

# Get device status
curl -X GET "http://localhost:8000/api/v1/device-control/1/status?token=$TOKEN"
```

### Step 5: Activate the Mode
```bash
curl -X POST "http://localhost:8000/api/v1/modes/1/activate?token=$TOKEN"
```

---

## Device Control Endpoints (MQTT-Based)

Real-time device control via MQTT protocol. All endpoints require JWT token as query parameter.

### 1. Execute Generic Device Action

**Endpoint:** `POST /api/v1/device-control/{device_id}/action?token=TOKEN`

**Request:**
```bash
curl -X POST "http://localhost:8000/api/v1/device-control/1/action?token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "set_brightness",
    "value": 75
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Action 'set_brightness' executed successfully",
  "device_id": 1,
  "action": "set_brightness",
  "value": 75,
  "device_state": {
    "power": true,
    "brightness": 75,
    "color": "white"
  }
}
```

### 2. Turn On Device

**Endpoint:** `POST /api/v1/device-control/{device_id}/turn-on?token=TOKEN`

**Request:**
```bash
curl -X POST "http://localhost:8000/api/v1/device-control/1/turn-on?token=YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Device turned on",
  "device_id": 1,
  "action": "turn_on",
  "device_state": {
    "power": true,
    "brightness": 100
  }
}
```

### 3. Turn Off Device

**Endpoint:** `POST /api/v1/device-control/{device_id}/turn-off?token=TOKEN`

**Request:**
```bash
curl -X POST "http://localhost:8000/api/v1/device-control/1/turn-off?token=YOUR_TOKEN"
```

**Response:** Similar to turn-on, with `"power": false`

### 4. Set Brightness

**Endpoint:** `POST /api/v1/device-control/{device_id}/set-brightness?token=TOKEN&brightness=VALUE`

**Parameters:**
- `brightness` (required): Integer 0-100

**Request:**
```bash
curl -X POST "http://localhost:8000/api/v1/device-control/1/set-brightness?token=YOUR_TOKEN&brightness=50"
```

**Response:**
```json
{
  "success": true,
  "message": "Brightness set to 50%",
  "device_id": 1,
  "action": "set_brightness",
  "value": 50,
  "device_state": {
    "power": true,
    "brightness": 50
  }
}
```

### 5. Set Color

**Endpoint:** `POST /api/v1/device-control/{device_id}/set-color?token=TOKEN&color=VALUE`

**Parameters:**
- `color` (required): Hex code (e.g., "FF0000") or color name (e.g., "red")

**Request:**
```bash
curl -X POST "http://localhost:8000/api/v1/device-control/1/set-color?token=YOUR_TOKEN&color=FF0000"
```

**Response:**
```json
{
  "success": true,
  "message": "Color set to FF0000",
  "device_id": 1,
  "action": "set_color",
  "value": "FF0000",
  "device_state": {
    "power": true,
    "color": "FF0000"
  }
}
```

### 6. Get Device Status

**Endpoint:** `GET /api/v1/device-control/{device_id}/status?token=TOKEN`

**Request:**
```bash
curl -X GET "http://localhost:8000/api/v1/device-control/1/status?token=YOUR_TOKEN"
```

**Response:**
```json
{
  "device_id": 1,
  "is_online": true,
  "last_seen": "2026-04-05T14:30:45.123456",
  "state": {
    "power": true,
    "brightness": 75,
    "color": "white"
  },
  "supported_actions": [
    "turn_on",
    "turn_off",
    "toggle",
    "set_brightness",
    "set_color",
    "set_temperature",
    "set_color_temperature"
  ]
}
```

### 7. Get Supported Actions

**Endpoint:** `GET /api/v1/device-control/{device_id}/supported-actions?token=TOKEN`

**Request:**
```bash
curl -X GET "http://localhost:8000/api/v1/device-control/1/supported-actions?token=YOUR_TOKEN"
```

**Response:**
```json
{
  "device_id": 1,
  "device_type": "LIGHT",
  "supported_actions": [
    "turn_on",
    "turn_off",
    "toggle",
    "set_brightness",
    "set_color",
    "set_temperature",
    "set_color_temperature"
  ]
}
```

---

## Supported Device Types & Actions

### LIGHT
```
Actions: turn_on, turn_off, toggle, set_brightness, set_color, 
         set_temperature, set_color_temperature
Brightness: 0-100
Colors: Hex (FF0000) or names (red, blue, green, white, warm)
Temperature: -50 to 50°C
Color Temp: 2700-6500 Kelvin
```

### FAN
```
Actions: turn_on, turn_off, set_speed
Speed: 0-100 (percentage)
```

### DOOR_LOCK
```
Actions: lock, unlock
```

### AC
```
Actions: turn_on, turn_off, set_temperature, set_mode
Temperature: 16-30°C
Modes: cool, heat, dry, fan, auto
```

### PLUG
```
Actions: turn_on, turn_off, toggle
```

### SWITCH
```
Actions: turn_on, turn_off, toggle
```

### CAMERA
```
Actions: turn_on, turn_off
```

### BLINDS
```
Actions: open, close, set_position
Position: 0-100 (0=closed, 100=open)
```

---

## MQTT Protocol Details

### Command Topic
```
home/{user_id}/{device_id}/command
```

**Payload Format:**
```json
{
  "action": "turn_on",
  "value": null,
  "timestamp": "2026-04-05T14:30:45.123456"
}
```

### Status Topic
```
home/{user_id}/{device_id}/status
```

**Payload Format:**
```json
{
  "device_id": 1,
  "device_name": "Living Room Light",
  "state": { "power": true, "brightness": 75 },
  "is_online": true,
  "timestamp": "2026-04-05T14:30:46.234567"
}
```

### QoS Levels
- Commands: QoS 1 (at least once)
- Status: QoS 1 (at least once)

---

## Error Responses

All error responses follow this format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

### Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (not authorized to access resource) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Data Models

### User
```typescript
{
  id: number,
  username: string,
  email: string,
  hashed_password: string,
  created_at: ISO8601 timestamp
}
```

### Device
```typescript
{
  id: number,
  owner_id: number,
  name: string,
  device_type: string,  // "LIGHT", "FAN", "AC", "DOOR_LOCK", etc.
  base_topic: string,   // MQTT topic base
  settings: object,     // Flexible JSON settings
  last_online: ISO8601 timestamp,
  state: object,        // Current device state (e.g., {power: true, brightness: 75})
  is_online: boolean,   // Current connectivity status
  last_seen: ISO8601 timestamp,  // Last communication time
  supported_actions: string[]    // List of supported actions for this device
}
```

### Mode
```typescript
{
  id: number,
  user_id: number,
  name: string,
  actions: Array<{
    device_id: number,
    action: string,
    value: any,
    delay?: number  // optional delay in seconds before executing action
  }>,
  is_active: boolean,
  created_at: ISO8601 timestamp
}
```

### Device Control Request
```typescript
{
  action: string,    // e.g., "turn_on", "set_brightness", "lock"
  value?: any        // optional parameter (brightness level, color, temp, etc.)
}
```

### Device Control Response
```typescript
{
  success: boolean,
  message: string,
  device_id: number,
  action: string,
  value?: any,
  device_state: object  // current device state after action execution
}
```

### Device Status Response
```typescript
{
  device_id: number,
  is_online: boolean,
  last_seen: ISO8601 timestamp,
  state: object,               // current device state
  supported_actions: string[]  // list of actions this device supports
}
```

---

## Authentication Details

- Tokens are JWT-signed with HS256 algorithm
- Default expiration: 24 hours (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`)
- Passwords are hashed using bcrypt with salt
- All protected endpoints verify token on each request

---

## Running the Application

```bash
# Install dependencies
pip install -r requirements.txt

# Run with JSON backend (default)
DATABASE_TYPE=json python main.py

# Or run with PostgreSQL
DATABASE_TYPE=postgresql python main.py
```

The API will be available at: `http://localhost:8000`

Interactive API documentation (Swagger UI): `http://localhost:8000/docs`

---

## Architecture Notes

- **Repository Pattern**: All data access is abstracted through repository interfaces
- **Dependency Injection**: FastAPI's `Depends()` provides clean, testable endpoints
- **MQTT Integration**: Real-time device control via MQTT protocol (MQTT broker required)
  - Default broker: `localhost:1883`
  - Configurable via environment variables: `MQTT_BROKER`, `MQTT_PORT`
  - Automatic startup/shutdown with FastAPI lifecycle events
  - Command publishing with QoS level 1 (at least once delivery)
  - Status updates via device status topics

## Testing MQTT Device Control

### Requirements
1. Running MQTT broker (e.g., Mosquitto) on `localhost:1883`
2. Device simulator or real MQTT devices listening on topics

### Running Simulator
```bash
cd Simulate
python simulate_esp32.py
```

The simulator will:
- Subscribe to device command topics: `home/{user_id}/{device_id}/command`
- Parse incoming control commands
- Update virtual device states
- Publish status updates on: `home/{user_id}/{device_id}/status`

### Complete Control Flow Example
```bash
# 1. Get JWT token
TOKEN=$(curl -s -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.access_token')

# 2. Create device
DEVICE_ID=$(curl -s -X POST "http://localhost:8000/api/v1/devices/?token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Light","device_type":"LIGHT","base_topic":"home/1/test"}' \
  | jq -r '.id')

# 3. Turn on device (publishes to MQTT)
curl -X POST "http://localhost:8000/api/v1/device-control/$DEVICE_ID/turn-on?token=$TOKEN"

# 4. Check device status
curl -X GET "http://localhost:8000/api/v1/device-control/$DEVICE_ID/status?token=$TOKEN"
```

## Integration Notes

- **Polymorphic Database**: Switch between JSON and PostgreSQL without changing endpoint code
- **SOLID Principles**: Clear separation of concerns (security, repositories, endpoints)
- **Production Ready**: Full error handling, ownership verification, and state management

