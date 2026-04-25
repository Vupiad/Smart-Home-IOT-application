# 🏠 Smart Home IoT Application

A full-stack IoT Smart Home system with real-time device control, sensor telemetry, and automation modes.

## Architecture Overview

```
┌──────────────┐     MQTT      ┌──────────────┐     REST/WS     ┌──────────────┐
│  ESP32 / Sim │ ◄──────────► │   Backend    │ ◄────────────► │  Mobile App  │
│  (Hardware)  │              │  (FastAPI)   │               │ (React Native)│
└──────────────┘              └──────┬───────┘               └──────────────┘
                                     │
                              ┌──────┴───────┐
                              │  MongoDB     │  ← Telemetry logs
                              │  JSON / PG   │  ← Users, Devices, Modes
                              └──────────────┘
```

## Tech Stack

| Component    | Technology                         |
| ------------ | ---------------------------------- |
| Backend API  | Python 3.11+, FastAPI, Uvicorn     |
| MQTT Broker  | Eclipse Mosquitto                  |
| Database     | JSON file (dev) / PostgreSQL (prod)|
| NoSQL        | MongoDB (telemetry time-series)    |
| Simulator    | Python + paho-mqtt                 |
| Mobile App   | React Native                       |

---

## Prerequisites

Make sure the following are installed on your machine:

- **Python 3.11+** → [python.org](https://www.python.org/downloads/)
- **Docker Desktop** → [docker.com](https://www.docker.com/products/docker-desktop/)
- **Git** → [git-scm.com](https://git-scm.com/)

---

## 🚀 Getting Started

### Step 1: Clone the Repository

```bash
git clone https://github.com/Vupiad/Smart-Home-IOT-application.git
cd Smart-Home-IOT-application
```

### Step 2: Start MongoDB & Mosquitto via Docker

Make sure [Docker Desktop](https://www.docker.com/products/docker-desktop/) is installed and running, then start both services:

```bash
# Start MongoDB (port 27017)
docker run -d --name mongodb -p 27017:27017 mongo:latest

# Start Mosquitto MQTT Broker (port 1883)
docker run -d --name mosquitto -p 1883:1883 eclipse-mosquitto:2 mosquitto -c /mosquitto-no-auth.conf
```

> **Verify they're running:**
> ```bash
> docker ps
> ```
> You should see both `mongodb` and `mosquitto` containers listed as `Up`.

> **Tip:** To stop/restart them later:
> ```bash
> docker stop mongodb mosquitto
> docker start mongodb mosquitto
> ```

### Step 3: Set Up the Backend

```bash
cd backend

# Create virtual environment
python -m venv myenv

# Activate it
# Windows (PowerShell):
.\myenv\Scripts\Activate.ps1
# Windows (CMD):
myenv\Scripts\activate.bat
# macOS / Linux:
source myenv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install paho-mqtt
```

### Step 4: Configure Environment Variables

Copy the template and fill in values:

```bash
cp .env.template .env
```

For local development, the defaults work out of the box:

```env
# .env (local dev defaults)
DATABASE_TYPE=json
DATA_FILE_PATH=data.json

MQTT_BROKER=localhost
MQTT_PORT=1883

MONGO_URL=mongodb://localhost:27017/

SESSION_SECRET=<generate-a-random-string-here>
```

> **Tip:** Generate a secure session secret with:
> ```bash
> python -c "import secrets; print(secrets.token_hex(32))"
> ```

### Step 5: Start the Backend Server

```bash
cd backend
uvicorn main:app --reload
```

You should see:
```
[STARTUP] Smart Home IoT Application Starting
[SUCCESS] NoSQL Database connected
[SUCCESS] MQTT Service connected
[STARTUP] All systems initialized

INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Step 6: Start the ESP32 Simulator

Open a **new terminal** (keep the backend running):

```bash
cd Simulate

# Install simulator dependency
pip install paho-mqtt

# Run the simulator
python simulate_esp32.py
```

You should see telemetry being published every 5 seconds:
```
[MQTT] Connected to localhost:1883
[TEL] T:26.4 H:59.2 L:459 PIR:False
[TEL] T:26.7 H:58.4 L:465 PIR:False
```

---

## 🧪 Testing with Swagger UI

FastAPI comes with built-in interactive API documentation.

### Open Swagger UI

1. Make sure the backend is running (`uvicorn main:app --reload`)
2. Open your browser and go to: **http://localhost:8000/docs**

### Testing Authentication(take a look at API_DOCUMENTATION.md file for more details)

1. **Register** → `POST /api/v1/auth/register`
   ```json
   {
     "email": "test@example.com",
     "password": "password123",
     "fullName": "Test User"
   }
   ```
2. **Login** → `POST /api/v1/auth/login`
   ```json
   **use this account for demo**
   {
     "email": "user@example.com",
     "password": "password"
   }
   ```
   > After login, Swagger will automatically receive the session cookie. All subsequent API calls in the same browser session will be authenticated.

3. **Test protected endpoints** → Try `GET /api/v1/devices/` — it should return your devices instead of a 401 error.

### Testing Device Control

1. First create a device via `POST /api/v1/devices/`
2. Then control it via `PUT /api/v1/device-control/{device_id}/state`:
   ```json
   {
     "state": { "status": "on", "speed": 50 }
   }
   ```
3. Watch the simulator terminal — it should receive the command and respond with an ACK.

### Alternative: ReDoc

You can also view the API docs at: **http://localhost:8000/redoc**

---

## 🔌 Testing WebSocket (Real-time Updates)

1. Open `backend/ws_test.html` in your browser
2. Click **Connect**
3. Run the ESP32 simulator in another terminal
4. Watch telemetry and device updates appear in real-time in the log

---

## 📁 Project Structure

```
Smart-Home-IOT-Application/
├── backend/
│   ├── api/
│   │   ├── deps.py                 # Dependency injection (DB repos, auth)
│   │   ├── security.py             # Password hashing utilities
│   │   └── v1/endpoints/
│   │       ├── auth.py             # Login, Register, Logout
│   │       ├── profile.py          # User profile CRUD
│   │       ├── devices.py          # Device management
│   │       ├── device_control.py   # MQTT device control
│   │       ├── modes.py            # Automation modes
│   │       ├── sensors.py          # Telemetry data queries
│   │       └── ws.py               # WebSocket endpoint
│   ├── database/
│   │   ├── json/                   # JSON file-based repositories
│   │   ├── sql/                    # PostgreSQL repositories
│   │   ├── nosql/                  # MongoDB repositories
│   │   └── models/                 # Data models (User, Device, Mode)
│   ├── services/
│   │   ├── mqtt_service.py         # MQTT client (publish/subscribe)
│   │   ├── sync_service.py         # Syncs MQTT state → DB
│   │   ├── device_service.py       # Device business logic
│   │   ├── mode_service.py         # Mode execution logic
│   │   ├── scheduler_service.py    # Time-based automation
│   │   └── websocket_service.py    # WebSocket broadcast manager
│   ├── main.py                     # FastAPI app entry point
│   ├── requirements.txt
│   ├── .env.template
│   └── API_DOCUMENTATION.md        # Full API reference
├── Simulate/
│   ├── simulate_esp32.py           # ESP32 hardware simulator
│   └── requirements.txt
└── README.md
```

---

## 📖 API Documentation

For the full API reference including all endpoints, request/response formats, and WebSocket events, see:

**[API_DOCUMENTATION.md](backend/API_DOCUMENTATION.md)**

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `ModuleNotFoundError: No module named 'itsdangerous'` | Run `pip install itsdangerous` in your venv |
| `Connection refused` on MQTT | Make sure Mosquitto is running on port 1883 |
| `Connection refused` on MongoDB | Make sure `mongod` is running on port 27017 |
| `401 Unauthorized` on API calls | Login first via `/api/v1/auth/login` to get a session cookie |
| Swagger doesn't send cookies | Use the same browser tab for login and subsequent requests |
