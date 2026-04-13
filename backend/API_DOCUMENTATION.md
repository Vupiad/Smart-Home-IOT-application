# Smart Home IoT API Documentation

## Overview

The Smart Home IoT API provides endpoints for user authentication, device management, and automation mode control. The backend supports both JSON file storage (single-user) and PostgreSQL databases.

---

## Quick Start

The default user is automatically created on application startup.

### Database Selection

Set `DATABASE_TYPE` in `.env`:
- `json` — JSON file storage (no database required)
- `postgresql` — PostgreSQL backend (requires running PostgreSQL)

Currently configured: `DATABASE_TYPE=json`

---

## Authentication Endpoints

All protected endpoints require a user ID passed as a query parameter: `?user_id=USER_ID`

### 1. Login(tested)

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
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@smarthome.local",
    "created_at": "2026-04-05T10:30:00"
  }
}
```

### 2. Register New User(tested)

**Endpoint:** `POST /api/v1/auth/register`

**Request:**
```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "demouser",
    "email": "user@example.com",
    "password": "demopassword"
  }'
```

**Response:** Same as login - returns newly created user info

### 3. Get User Info(tested)

**Endpoint:** `GET /api/v1/auth/me?user_id=USER_ID`

**Request:**
```bash
curl -X GET "http://localhost:8000/api/v1/auth/me?user_id=1"
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

All device endpoints require authentication via user_id parameter: `?user_id=USER_ID`

### 1. Create Device(tested)

**Endpoint:** `POST /api/v1/devices/?user_id=USER_ID`

**Request:**
```bash
curl -X POST "http://localhost:8000/api/v1/devices/?user_id=1" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Living Room Light",
    "device_type": "light",
    "base_topic": "home/living_room/light",
    "state": {
      "status" : "on/off",
      "color" : {
        "r" : 255,
        "g" : 255,
        "b" : 255
      }
    },
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
  "state": {
      "status" : "on/off",
      "color" : {
        "r" : 255,
        "g" : 255,
        "b" : 255
      }
    },
  "last_online": "2026-04-05T10:35:00"
}
```

### 2. List All Devices(tested ok)

**Endpoint:** `GET /api/v1/devices/?user_id=USER_ID`

**Request:**
```bash
curl -X GET "http://localhost:8000/api/v1/devices/?user_id=1"
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
    "state": {
      "status" : "on/off",
      "color" : {
        "r" : 255,
        "g" : 255,
        "b" : 255
      }
    },
    "last_online": "2026-04-05T10:35:00"
  },
  {
    "id": 2,
    "owner_id": 1,
    "name": "fan",
    "device_type": "fan",
    "base_topic": "home/bedroom/door",
    "state": {
      "status" : "on/off",
      "speed" : "50"
    },
    "last_online": "2026-04-05T10:36:00"
  },
  {
    "id": 3,
    "owner_id": 1,
    "name": "door lock",
    "device_type": "door lock",
    "base_topic": "home/bedroom/door",
    "state": {
      "status" : "locked/unlocked",
    },
    "last_online": "2026-04-05T10:36:00"
  }
]
```

### 3. Get Specific Device(tested ok)

**Endpoint:** `GET /api/v1/devices/{device_id}?user_id=USER_ID`

**Request:**
```bash
curl -X GET "http://localhost:8000/api/v1/devices/1?user_id=1"
```

**Response:** Single device object (see Create Device response)

### 4. Update Device(tested ok)

**Endpoint:** `PUT /api/v1/devices/{device_id}?user_id=USER_ID`

**Request:**
```bash
curl -X PUT "http://localhost:8000/api/v1/devices/1?user_id=1" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Light Name",
    "state": {
      "status" : "on/off",
      "color" : {
        "r" : 255,
        "g" : 255,
        "b" : 255
      }
    },
  }'
```

**Response:** Updated device object

### 5. Delete Device(dangerous don't delete device, untest)

**Endpoint:** `DELETE /api/v1/devices/{device_id}?user_id=USER_ID`

**Request:**
```bash
curl -X DELETE "http://localhost:8000/api/v1/devices/1?user_id=1"
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

(NOTE: see the list of available commands for each device in the end of this document)
### 1. Create Mode(tested ok)

**Endpoint:** `POST /api/v1/modes/?user_id=USER_ID`

**Request:**
```bash
curl -X POST "http://localhost:8000/api/v1/modes/?user_id=1" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Goodnight Mode",
    "actions": [
      {
        "device_id": 1,
        "command": { "commandId": "c_led_on", "target": "led", "action": "on" },
      },
      {
        "device_id": 3,
        "command": { "commandId": "c_led_on", "target": "led", "action": "on" },
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
    {"device_id": 1, "command": { "commandId": "c_led_on", "target": "led", "action": "on" }},
    {"device_id": 3, "action": { "commandId": "c_led_on", "target": "led", "action": "on" }}
  ],
  "is_active": false,
  "created_at": "2026-04-05T10:40:00"
}
```

### 2. List All Modes(tested ok)

**Endpoint:** `GET /api/v1/modes/?user_id=USER_ID`

**Request:**
```bash
curl -X GET "http://localhost:8000/api/v1/modes/?user_id=1"
```

**Response:** Array of mode objects

### 3. Get Specific Mode(tested ok)

**Endpoint:** `GET /api/v1/modes/{mode_id}?user_id=USER_ID`

**Request:**
```bash
curl -X GET "http://localhost:8000/api/v1/modes/1?user_id=1"
```

**Response:** Single mode object

### 4. Update Mode(tested ok)

**Endpoint:** `PUT /api/v1/modes/{mode_id}?user_id=USER_ID`

**Request:**
```bash
curl -X PUT "http://localhost:8000/api/v1/modes/1?user_id=1" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Mode Name",
    "actions": [
      {"device_id": 2, "command": { "commandId": "c_led_on", "target": "led", "action": "on" }}
    ]
  }'
```

**Response:** Updated mode object

### 5. Delete Mode(tested ok)

**Endpoint:** `DELETE /api/v1/modes/{mode_id}?user_id=USER_ID`

**Request:**
```bash
curl -X DELETE "http://localhost:8000/api/v1/modes/1?user_id=1"
```

**Response:**
```json
{
  "message": "Mode deleted successfully",
  "mode_id": 1
}
```

### 6. Activate Mode

**Endpoint:** `POST /api/v1/modes/{mode_id}/activate?user_id=USER_ID`

**Request:**
```bash
curl -X POST "http://localhost:8000/api/v1/modes/1/activate?user_id=1"
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

**Endpoint:** `POST /api/v1/modes/{mode_id}/deactivate?user_id=USER_ID`

**Request:**
```bash
curl -X POST "http://localhost:8000/api/v1/modes/1/deactivate?user_id=1"
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

## Device Control Endpoints

Control individual device actions in real-time via MQTT.

### 1. Execute Device Action(tested on light ok, value 1 for turn on, 0 for turn off)

**Endpoint:** `POST /api/v1/device-control/{device_id}/action?user_id=USER_ID`

**Request:**
```bash
curl -X POST "http://localhost:8000/api/v1/device-control/1/action?user_id=1" \
  -H "Content-Type: application/json" \
  -d '{
    "command": { "commandId": "c_led_on", "target": "led", "action": "on" },
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
  "device_state": {"brightness": 75}
}
```
#### Commands

### 3.2 LED Commands

- Turn on:

```json
{ "commandId": "c_led_on", "target": "led", "action": "on" }
```

- Turn off:

```json
{ "commandId": "c_led_off", "target": "led", "action": "off" }
```

- Auto mode:

```json
{ "commandId": "c_led_auto", "target": "led", "action": "auto" }
```

- Set manual color by RGB:

```json
{ "commandId": "c_led_rgb", "target": "led", "action": "set", "r": 255, "g": 80, "b": 20 }
```


### 3.3 Fan Commands

- Turn on (100%):

```json
{ "commandId": "c_fan_on", "target": "fan", "action": "on" }
```

- Turn off (0%):

```json
{ "commandId": "c_fan_off", "target": "fan", "action": "off" }
```

- Set speed (0..100):

```json
{ "commandId": "c_fan_set", "target": "fan", "action": "set", "speed": 60 }
```

Alternative accepted key: `value`.

### 3.4 Door Commands

- Open door:

```json
{ "commandId": "c_door_open", "target": "door", "action": "open" }
```
