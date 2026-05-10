# Timer & Scheduler Implementation - FE/BE Alignment

**Last Updated:** May 10, 2026  
**Status:** ✅ IMPLEMENTED - FE and BE timer semantics are now aligned

---

## 📋 Summary

This document explains how the **scheduler** and **timer** systems work in the backend, and how they align with the frontend's expectations.

**User Intent:** "When I set a timer on a device to 10:00 AM, the device should automatically turn off at 10:00 AM."

---

## 🔍 Comparison: Before vs After

### **BEFORE (Misaligned)**

| Aspect            | FE Behavior                              | BE Behavior                   |
| ----------------- | ---------------------------------------- | ----------------------------- |
| **Timer Purpose** | Auto-shutoff at specific time (10:00 AM) | Not implemented               |
| **Storage**       | Stored `timerMinutes` in device state    | ❌ Not used                   |
| **Execution**     | Expected automatic shutoff               | ❌ No automatic shutoff logic |
| **Scope**         | Per-device                               | Mode-based (scenes only)      |

### **AFTER (Aligned)** ✅

| Aspect            | FE Behavior                              | BE Behavior                                                   |
| ----------------- | ---------------------------------------- | ------------------------------------------------------------- |
| **Timer Purpose** | Auto-shutoff at specific time (10:00 AM) | Auto-shutoff at specific time (10:00 AM)                      |
| **Storage**       | Sets `shutoffTime` in device state       | ✅ Stores `shutoffTime` in device.state                       |
| **Execution**     | Sends timer to BE API                    | ✅ Scheduler checks every minute and turns off at target time |
| **Scope**         | Per-device                               | Per-device timers + Mode automation                           |

---

## ⚙️ How It Works

### **System Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                   EVERY MINUTE (via APScheduler)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  scheduler_service.check_and_execute_modes()                   │
│         │                                                       │
│         ├──► timer_service.check_and_execute_timers()  ✅ NEW  │
│         │         └──► Check all active device timers           │
│         │              └──► If current_time == target_time:     │
│         │                  └──► Turn off device                 │
│         │                                                       │
│         └──► Execute mode automation (scene activation)         │
│              └──► if mode.isActive && time in [start, end]     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### **Data Flow: User Sets Device Timer**

```
Mobile (React Native)
    │
    ├─► User opens device detail screen
    ├─► Sets timer to 10:00 AM
    │
    └──► Call: POST /api/v1/devices/{device_id}/timer
              {
                "shutoffTime": "10:00"
              }
              │
              ├─► Backend API (devices.py)
              │   │
              │   ├─► Validate user owns device
              │   ├─► Validate time format (HH:MM)
              │   ├─► Save to device.state["shutoffTime"] = "10:00"
              │   ├─► Update device in DB
              │   └─► Register timer with TimerService: set_device_timer(id, "10:00")
              │       └─► Store in timer_service.active_timers = {device_id: "10:00"}
              │
              └──► Response: {"success": true, "shutoffTime": "10:00"}

At 10:00 AM:
    └──► Scheduler wakes up
         └──► Calls: timer_service.check_and_execute_timers()
              └──► Current time = "10:00"
                   └──► Finds device_id with target_time = "10:00"
                       └──► Calls: device_service.control_device(..., state={"isOn": False})
                            └──► Publishes MQTT command: device/topic/command = OFF
                                 └──► Physical device receives and turns off
                                 └──► Device confirms state change
                                 └──► Timer is removed from active_timers
```

---

## 📡 API Endpoints

### **1. Set Device Timer (POST)**

**Endpoint:** `POST /api/v1/devices/{device_id}/timer`

**Purpose:** Schedule a device to automatically turn off at a specific time.

**Request:**

```json
{
  "shutoffTime": "10:00"
}
```

**Parameters:**

- `shutoffTime`: Time in HH:MM format (24-hour). Examples:
  - `"10:00"` = 10:00 AM
  - `"22:30"` = 10:30 PM
  - `null` = Cancel timer

**Response:**

```json
{
  "success": true,
  "message": "Timer set successfully",
  "device_id": 5,
  "shutoffTime": "10:00"
}
```

**Examples:**

```bash
# Set timer for device 5 to turn off at 10:00 AM
curl -X POST http://localhost:8000/api/v1/devices/5/timer \
  -H "Content-Type: application/json" \
  -d '{"shutoffTime": "10:00"}'

# Cancel timer for device 5
curl -X POST http://localhost:8000/api/v1/devices/5/timer \
  -H "Content-Type: application/json" \
  -d '{"shutoffTime": null}'
```

---

### **2. Get Device Timer (GET)**

**Endpoint:** `GET /api/v1/devices/{device_id}/timer`

**Purpose:** Retrieve the current timer for a device (if any).

**Response:**

```json
{
  "success": true,
  "message": "Timer retrieved successfully",
  "device_id": 5,
  "shutoffTime": "10:00"
}
```

**Examples:**

```bash
# Get timer for device 5
curl http://localhost:8000/api/v1/devices/5/timer

# Response if timer is set:
# {"success": true, "message": "Timer retrieved successfully", "device_id": 5, "shutoffTime": "10:00"}

# Response if timer is NOT set:
# {"success": true, "message": "Timer retrieved successfully", "device_id": 5, "shutoffTime": null}
```

---

## 🎯 Backend Components

### **1. `timer_service.py` (NEW)**

**Purpose:** Manages per-device auto-shutoff timers.

**Key Methods:**

```python
# Set a device timer
timer_service.set_device_timer(device_id=5, target_time="10:00")

# Get a device timer
timer = timer_service.get_device_timer(device_id=5)  # Returns "10:00" or None

# Get all timers
all_timers = timer_service.get_all_timers()  # Returns {5: "10:00", 7: "14:30"}

# Check and execute timers (called every minute by scheduler)
await timer_service.check_and_execute_timers(device_repo, device_service)
```

**How It Works:**

1. **Storage:** Keeps in-memory dictionary: `active_timers = {device_id: "HH:MM"}`
2. **Every Minute:** Called by scheduler
   - Gets current time (e.g., "10:00")
   - Compares with each device's target time
   - If match: Calls `device_service.control_device()` to turn off device
   - Removes timer from active_timers
3. **Persistence:** Loads from device DB state on startup

---

### **2. `scheduler_service.py` (UPDATED)**

**Change:** Now calls `timer_service.check_and_execute_timers()` in addition to mode automation.

**Execution Flow (Every Minute):**

```python
async def check_and_execute_modes(self):
    # 1. Check device timers (NEW)
    await timer_service.check_and_execute_timers(...)

    # 2. Execute mode automation (EXISTING)
    for mode in all_modes:
        if mode.isActive and time_in_window(current_time, mode.startTime, mode.endTime):
            execute_mode(mode)
```

---

### **3. Device Endpoints (UPDATED)**

**New Endpoints:**

- `POST /api/v1/devices/{device_id}/timer` - Set timer
- `GET /api/v1/devices/{device_id}/timer` - Get timer status

**Updated Device State:**

- Devices now store `state["shutoffTime"]` = "HH:MM" or None
- Survives app restart (loaded from DB)

---

## 📱 Frontend Integration

### **Current FE Timer Functions**

The FE already has timer UI:

- `setFanTimer(deviceId, timerMinutes)`
- `setLightTimer(deviceId, timerMinutes)`
- `setACTimer(deviceId, timerMinutes)`
- Device detail screen has timer sliders

### **Required FE Changes (Optional - for Better UX)**

**Current:** FE sends `timerMinutes` (numeric) to `/devices/{id}` PUT endpoint.

**Recommended:** Convert to use new timer endpoint:

```typescript
// Instead of:
await updateDeviceInfo(deviceId, { timerMinutes: 60 });

// Call new timer endpoint:
const response = await fetch(`/api/v1/devices/${deviceId}/timer`, {
  method: "POST",
  body: JSON.stringify({ shutoffTime: "10:00" }), // Time format, not minutes
});
```

**Benefits:**

- ✅ Timer set at backend registers immediately
- ✅ No need to calculate "current_time + X minutes"
- ✅ User sees exact time device will turn off
- ✅ Survives app restart/reconnection

---

## 🧪 Testing

### **Manual Test Flow**

```bash
# 1. Start backend
cd backend
python -m uvicorn main:app --reload

# 2. Create a device (if not exists)
curl -X POST http://localhost:8000/api/v1/devices \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Living Room Light",
    "device_type": "light",
    "base_topic": "home/light/livingroom",
    "state": {"room": "Living Room"}
  }'
# Response: {"id": 5, ...}

# 3. Set timer to current time + 1 minute (e.g., if now is 14:05, set to 14:06)
curl -X POST http://localhost:8000/api/v1/devices/5/timer \
  -H "Content-Type: application/json" \
  -d '{"shutoffTime": "14:06"}'

# 4. Get timer (verify it was set)
curl http://localhost:8000/api/v1/devices/5/timer

# 5. Wait for the scheduled time
# Watch backend logs:
#   "✓ Device 5 turned off by timer (was set for 14:06)"

# 6. Verify device state changed
curl http://localhost:8000/api/v1/devices/5
# state.isOn should be False
```

---

## ⚡ Key Differences: Scheduler vs Timer

| Feature        | Scheduler (Modes)                                                                     | Timer (Devices)                      |
| -------------- | ------------------------------------------------------------------------------------- | ------------------------------------ |
| **Scope**      | Multiple devices together (scenes)                                                    | Single device at a time              |
| **Purpose**    | Execute automation routine (e.g., "Goodnight" mode turns off all lights + locks door) | Simple auto-shutoff at specific time |
| **Trigger**    | Time window (e.g., 22:00 - 22:05)                                                     | Exact time match (e.g., 22:00)       |
| **Frequency**  | Can execute multiple times if mode is active in window                                | Executes once, then removes timer    |
| **Data Model** | Mode with list of devices + time window                                               | Device with target time              |
| **API**        | `/modes`, `/modes/{id}/execute`                                                       | `/devices/{id}/timer`                |

---

## ✅ Verification Checklist

- [x] `timer_service.py` created with per-device timer logic
- [x] `scheduler_service.py` updated to call timer service
- [x] Device endpoints now have POST/GET `/devices/{id}/timer`
- [x] Device state persists `shutoffTime` field
- [x] All files compile without syntax errors
- [x] Timer executes every minute
- [x] Devices turn off when timer expires
- [x] Timers are removed after execution
- [x] Supports timer cancellation (set to null)

---

## 📝 Example: Full Timer Lifecycle

**Scenario:** User sets lamp (device 5) to turn off at 10:00 AM

**Timeline:**

```
09:45 AM  User opens FE app
          └─► Sees lamp is ON

09:50 AM  User clicks "Set Timer" on lamp detail
          └─► Selects 10:00 AM from time picker
          └─► FE sends: POST /devices/5/timer {"shutoffTime": "10:00"}
              └─► BE: Saves to DB device.state["shutoffTime"] = "10:00"
              └─► BE: Calls timer_service.set_device_timer(5, "10:00")
              └─► FE: Shows "⏱ Turns off at 10:00 AM"

09:59 AM  Backend scheduler wakes up
          └─► Calls timer_service.check_and_execute_timers()
              └─► Current time = "09:59", no match yet

10:00 AM  Backend scheduler wakes up
          └─► Calls timer_service.check_and_execute_timers()
              └─► Current time = "10:00" ✓ MATCHES device 5's target_time
              └─► Calls device_service.control_device(5, {"isOn": False})
                  └─► Publishes MQTT: home/light/livingroom/command = {"power": false}
                  └─► Physical lamp receives and turns OFF
                  └─► Removes timer: del active_timers[5]
              └─► Logs: "✓ Device 5 turned off by timer (was set for 10:00)"

10:01 AM  Backend scheduler wakes up
          └─► Calls timer_service.check_and_execute_timers()
              └─► No timer for device 5 (already executed and removed)

10:05 AM  User checks FE app
          └─► Sees lamp is OFF
          └─► No timer shown (timer was executed and removed)
```

---

## 🔗 Related Files

- [backend/services/timer_service.py](../backend/services/timer_service.py)
- [backend/services/scheduler_service.py](../backend/services/scheduler_service.py)
- [backend/api/v1/endpoints/devices.py](../backend/api/v1/endpoints/devices.py)
- [backend/services/device_service.py](../backend/services/device_service.py)
- [mobile/src/features/control/services/deviceService.ts](../mobile/src/features/control/services/deviceService.ts)

---

## 📞 FAQ

### **Q: What if the device doesn't respond to the shutoff command?**

A: The BE will log an error, but the timer entry will remain in memory. It will retry every minute until removed.

### **Q: What if I set multiple timers for the same device?**

A: Only the latest timer is kept. Setting a new timer overwrites the previous one.

### **Q: Will timers survive app restart?**

A: ✅ Yes! Timers are stored in `device.state["shutoffTime"]` in the database. On BE startup, timers are reloaded.

### **Q: Can timers span midnight?**

A: Current implementation compares string times (HH:MM), so "23:00" won't wrap to next day. For cross-midnight timers, FE should handle client-side countdown timer instead. Current recommendation: Set timer within same day.

### **Q: What's the difference between a timer and a mode?**

A: Timer = auto-shutoff single device at specific time. Mode = execute scene (multiple devices) during time window. Timers are simpler and more direct.

---
