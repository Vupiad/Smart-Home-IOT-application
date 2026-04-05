# Quick Start Guide

## Installation & Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Run the application
DATABASE_TYPE=json python main.py
```

The API will start at **http://localhost:8000**

---

## Interactive API Testing

Visit: **http://localhost:8000/docs** for Swagger UI

This provides a built-in interface to test all endpoints without curl.

---

## Default Credentials (Auto-Created)

```
Username: admin
Password: admin123
```

---

## Essential API Calls

### 1. Login and Get Token

```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq '.access_token'
```

Save the token and use it for subsequent requests.

### 2. Create a Device

```bash
TOKEN="your_token_here"

curl -X POST "http://localhost:8000/api/v1/devices/?token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Living Room Light",
    "device_type": "light",
    "base_topic": "home/living_room/light"
  }'
```

### 3. List Your Devices

```bash
curl -X GET "http://localhost:8000/api/v1/devices/?token=$TOKEN"
```

### 4. Create an Automation Mode

```bash
curl -X POST "http://localhost:8000/api/v1/modes/?token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Evening Mode",
    "actions": [
      {"device_id": 1, "action": "dim", "value": 50}
    ]
  }'
```

### 5. Activate a Mode

```bash
curl -X POST "http://localhost:8000/api/v1/modes/1/activate?token=$TOKEN"
```

---

## Files Created/Modified

### New Files Created

```
backend/
├── api/
│   ├── security.py                    # JWT & password utilities
│   ├── init_user.py                   # Default user creation
│   └── v1/
│       ├── endpoints/
│       │   ├── __init__.py
│       │   ├── auth.py                # Login/Register endpoints
│       │   ├── devices.py             # Device CRUD endpoints
│       │   └── modes.py               # Mode CRUD endpoints
│       └── api.py                     # Updated router config
├── data.json                          # JSON storage (auto-created)
├── API_DOCUMENTATION.md               # Complete API reference
└── QUICKSTART.md                      # This file

database/json/                         # Pre-created in previous phase
├── __init__.py
├── json_connection.py
├── json_database_manager.py
├── json_user_repository.py
├── json_device_repository.py
└── json_mode_repository.py
```

### Modified Files

```
database/sql/repositories/
├── repository.py                      # Extended interfaces with CRUD methods
├── postgres_user_repository.py        # Added new methods (delete, update, list_all)
├── postgres_device_repository.py      # Added new methods
└── postgres_mode_repository.py        # Added new methods (fixed UserMode→Mode)

database/sql/
└── database_factory.py                # Added JSON backend support

api/
├── deps.py                            # Dynamic repository selection
└── v1/
    └── api.py                         # Router configuration

.env                                   # Updated DATABASE_TYPE to json
requirements.txt                       # Added aiofiles
main.py                               # Updated with all routers + startup init
```

---

## Data Model Examples

### User
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@smarthome.local",
  "created_at": "2026-04-05T10:30:00"
}
```

### Device
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

### Mode (Automation)
```json
{
  "id": 1,
  "user_id": 1,
  "name": "Goodnight Mode",
  "actions": [
    {"device_id": 1, "action": "turn_off", "value": true},
    {"device_id": 2, "action": "lock", "value": true}
  ],
  "is_active": false,
  "created_at": "2026-04-05T10:40:00"
}
```

---

## Key Features

✅ **JWT Authentication** — Secure token-based access  
✅ **Device Management** — Full CRUD operations  
✅ **Automation Modes** — Create and manage automation routines  
✅ **JSON Storage** — Single-user deployment without database  
✅ **Factory Pattern** — Switch between JSON and PostgreSQL  
✅ **Repository Pattern** — Clean, testable code architecture  
✅ **CORS Enabled** — Cross-origin requests supported  
✅ **Auto-Init** — Default user created on startup  

---

## Troubleshooting

### Application won't start
```bash
# Check Python version
python --version  # Should be 3.7+

# Check dependencies
pip list | grep fastapi

# Check port in use
netstat -ano | findstr :8000
```

### Login fails
- Verify default user exists in `data.json`
- Check credentials: username=`admin`, password=`admin123`

### Token errors
- Ensure token is passed in query parameter: `?token=YOUR_TOKEN`
- Token expires after 24 hours (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`)

### Device/Mode not found
- Verify you own the device/mode (ownership is enforced per user)
- Check that you're using the correct ID

---

## Database Files

### data.json Structure
```json
{
  "users": [
    {"id": 1, "username": "admin", ...}
  ],
  "devices": [
    {"id": 1, "owner_id": 1, ...}
  ],
  "modes": [
    {"id": 1, "user_id": 1, ...}
  ],
  "_meta": {
    "next_user_id": 2,
    "next_device_id": 2,
    "next_mode_id": 2
  }
}
```

The JSON file is automatically created and persisted on first run.

---

## Architecture Overview

```
FastAPI App
    ↓
Routes (auth, devices, modes)
    ↓
Endpoints (validation, business logic)
    ↓
Dependency Injection (get_current_user_id, get_device_repo, etc.)
    ↓
Repository Layer (abstract interfaces)
    ↓
Database Layer (JSON or PostgreSQL)
```

This clean separation allows:
- Testing endpoints without database
- Swapping databases via environment variable
- Adding new repositories without changing endpoints

---

## Next Steps

1. **Test the API** — Use Swagger UI at `/docs`
2. **Create devices** — Add smart home devices to your system
3. **Build automations** — Create modes to automate device control
4. **Integrate MQTT** — Connect real IoT devices via MQTT broker
5. **Deploy** — Switch to PostgreSQL for production

See `API_DOCUMENTATION.md` for complete endpoint reference.
