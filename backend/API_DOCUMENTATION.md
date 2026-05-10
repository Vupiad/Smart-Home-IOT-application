# Smart Home IoT API Documentation (Updated)

This document outlines the REST APIs and WebSocket endpoints for the Smart Home IoT application.

**Base URL**: `http://localhost:8000/api/v1`

---

## 1. Authentication (`/auth`)

### 1.1 Login

- **POST** `/auth/login`
- **Body:**
  ```json
  {
    "email": "demo@smarthome.app",
    "password": "yourpassword"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "message": "Login successful",
    "user": {
      "id": 1,
      "email": "demo@smarthome.app",
      "fullName": "Demo User",
      "phone": "0123456789",
      "dateOfBirth": "1990-01-01"
    }
  }
  ```

> **Note on Mobile App Integration (Session Cookies):**
> This API uses **Session Cookies** for authentication instead of JWT.
>
> - **React Native (fetch)**: Add `credentials: 'include'` to your fetch options.
> - **React Native (axios)**: Set `axios.defaults.withCredentials = true;`.
>   Once configured, React Native's native networking layer (OkHttp/NSURLSession) will automatically persist the session cookie from the login response and attach it to all future requests. No need to manually store tokens!

### 1.2 Register

- **POST** `/auth/register`
- **Body:**
  ```json
  {
    "email": "newuser@smarthome.app",
    "password": "securepassword",
    "fullName": "New User",
    "phone": "0987654321",
    "dateOfBirth": "1995-12-31"
  }
  ```
- **Response (200 OK):** Trả về giống Login (tự động đăng nhập và set session cookie).

### 1.3 Logout

- **POST** `/auth/logout`
- **Response (200 OK):** Xóa session cookie của người dùng.
  ```json
  {
    "message": "Logout successful"
  }
  ```

---

## 2. User Profile (`/profile`)

### 2.1 Get Profile

- **GET** `/profile`
- **Response (200 OK):**
  ```json
  {
    "id": 1,
    "email": "demo@smarthome.app",
    "fullName": "Demo User",
    "phone": "0123456789",
    "dateOfBirth": "1990-01-01"
  }
  ```

### 2.2 Update Profile

- **PUT** `/profile`
- **Body:**
  ```json
  {
    "fullName": "Updated Name",
    "phone": "0123456789",
    "dateOfBirth": "1992-05-20"
  }
  ```
- **Response (200 OK):** Trả về User object sau khi cập nhật.

### 2.3 Change Password

- **PUT** `/profile/password`
- **Body:**
  ```json
  {
    "currentPassword": "oldpassword",
    "newPassword": "newpassword"
  }
  ```
- **Response (200 OK):** `{"message": "Password changed successfully"}`

---

## 3. Devices CRUD (`/devices`)

_Lưu ý: Yêu cầu truyền query `?user_id=1` cho toàn bộ các endpoint CRUD._

### 3.1 Create Device

- **POST** `/devices`
- **Body:**
  ```json
  {
    "name": "Living Room Light",
    "device_type": "light",
    "base_topic": "yolohome/device/yolo_uno_01",
    "state": {
      "room": "Living Room",
      "subtitle": "Main light",
      "status": "off",
      "color": { "r": 255, "g": 255, "b": 255 },
      "brightness": 80,
      "style": "bulb"
    }
  }
  ```
- **State fields (all optional):**
  - `room`: Device location/room name
  - `subtitle`: Device description
  - `status`: Current status ("on", "off", "locked", "unlocked", etc.)
  - `color`: RGB object for lights `{ "r": 0-255, "g": 0-255, "b": 0-255 }`
  - `brightness`: Light brightness 0-100
  - `speed`: Fan speed (0-100)
  - `style`: Light style ("bulb", "pendant", "lamp")
  - `temperature`: AC temperature setting
  - `mode`: AC mode ("cool", "heat", "auto", etc.)
  - Any other device-specific attributes as needed

### 3.2 List Devices

- **GET** `/devices`
- **Response (200 OK):**
  ```json
  [
    {
      "id": 1,
      "owner_id": 1,
      "name": "Living Room Light",
      "device_type": "light",
      "base_topic": "yolohome/device/yolo_uno_01",
      "state": {
        "room": "Living Room",
        "subtitle": "Main light",
        "status": "on",
        "color": { "r": 255, "g": 80, "b": 20 },
        "brightness": 80,
        "style": "bulb"
      },
      "last_online": "2026-04-20T10:35:00"
    }
  ]
  ```

### 3.3 Update Device

- **PUT** `/devices/{device_id}`
- **Body:** Cùng cấu trúc với Create, có thể gửi các trường muốn update.

### 3.4 Delete Device

- **DELETE** `/devices/{device_id}`

---

## 4. Quick Device Control (`/device-control`)

### 4.1 Update Device State (Gửi lệnh MQTT)

- **PUT** `/device-control/{device_id}/state`
- **Body:** Trạng thái mong muốn của thiết bị (UI format).
  ```json
  for fan:
  {
    "state": {
      "status": "on",
      "speed": 50
    }
  }
  for led:(use both "status" and "color" for color setting, use only "status" to on/off)
  {
    "state": {
      "status": "on",
      "color": { "r": 255, "g": 255, "b": 255 }
    }
  }
  for door:
  {
    "state": {
      "status": "locked/unlocked"
    }
  }
  for AC:
  {
    "state": {
      "status": "on/off",
      "temperature": 24,
      "mode": "cool/heat/auto",
      "fanSpeed": 1
    }
  }
  ```
- **Response (200 OK):** Trả về state mới và lập tức publish lệnh xuống MQTT để thiết bị thay đổi.
- **Lưu ý đồng bộ:** Khi publish thành công, backend cũng merge state này vào DB để tránh lệch dữ liệu FE/BE.

### 4.2 Set Device Auto-Shutoff Timer

- **POST** `/devices/{device_id}/timer`
- **Purpose:** Lên lịch tắt thiết bị tự động vào một giờ cụ thể.
- **Body:**
  ```json
  {
    "shutoffTime": "10:00"
  }
  ```
- **Parameters:**
  - `shutoffTime`: Giờ tắt thiết bị (định dạng HH:MM, 24h). Ví dụ:
    - `"10:00"` = 10:00 sáng
    - `"22:30"` = 22:30 (10:30 tối)
    - `null` = Hủy timer

- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Timer set successfully",
    "device_id": 5,
    "shutoffTime": "10:00"
  }
  ```
- **Ví dụ curl:**

  ```bash
  # Đặt timer tắt thiết bị 5 lúc 10:00 AM
  curl -X POST http://localhost:8000/api/v1/devices/5/timer \
    -H "Content-Type: application/json" \
    -d '{"shutoffTime": "10:00"}'

  # Hủy timer cho thiết bị 5
  curl -X POST http://localhost:8000/api/v1/devices/5/timer \
    -H "Content-Type: application/json" \
    -d '{"shutoffTime": null}'
  ```

- **Hoạt động:**
  - Lưu `shutoffTime` vào `device.state` trong DB
  - Đăng ký timer với backend scheduler
  - Mỗi phút, backend kiểm tra nếu thời gian hiện tại khớp `shutoffTime`
  - Nếu khớp, backend tự động gửi lệnh MQTT tắt thiết bị
  - Timer bị xóa sau khi thực thi

### 4.3 Get Device Timer Status

- **GET** `/devices/{device_id}/timer`
- **Purpose:** Lấy thông tin timer hiện tại của thiết bị (nếu có).
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Timer retrieved successfully",
    "device_id": 5,
    "shutoffTime": "10:00"
  }
  ```
- **Response (nếu không có timer):**
  ```json
  {
    "success": true,
    "message": "Timer retrieved successfully",
    "device_id": 5,
    "shutoffTime": null
  }
  ```
- **Ví dụ curl:**
  ```bash
  curl http://localhost:8000/api/v1/devices/5/timer
  ```

---

## 5. Automation Modes (`/modes`)

### 5.1 Create Mode

- **POST** `/modes`
- **Body:** (Sử dụng 1 timeline chung `startTime`, `endTime` cho danh sách `devices` bên trong)
  ```json
  {
    "name": "Good Morning",
    "startTime": "06:30",
    "endTime": "08:00",
    "devices": [
      {
        "id": 1,
        "state": { "status": "on", "color": { "r": 255, "g": 255, "b": 255 } }
      },
      {
        "id": 2,
        "state": { "status": "on", "speed": 30 }
      },
      {
        "id": 3,
        "state": { "status": "locked" }
      }
    ],
    "isActive": false
  }
  ```

### 5.2 List & Get Modes

- **GET** `/modes` (Trả về array các modes)
- **GET** `/modes/{mode_id}` (Trả về chi tiết 1 mode)

### 5.3 Toggle Mode (Bật/Tắt nhanh)

- **PATCH** `/modes/{mode_id}/toggle`
- **Body:**
  ```json
  {
    "isActive": true
  }
  ```
- _Tính năng đặc biệt: Nếu toggle sang `true` và thời gian hiện tại nằm trong khung `startTime`-`endTime`, Mode sẽ được kích hoạt thực thi ngay lập tức._

---

## 6. Telemetry & Sensors (`/sensors`)

### 6.1 Get Current Telemetry

- **GET** `/sensors/current?device_id=yolo_uno_01` (device_id là optional)
- **Response (200 OK):**
  ```json
  {
    "data": {
      "topic": "yolohome/device/yolo_uno_01/telemetry",
      "deviceId": "yolo_uno_01",
      "temperature": 29.5,
      "humidity": 66.3,
      "light": 40,
      "timestamp": "2026-04-20T18:14:00.123"
    }
  }
  ```

### 6.2 Get Telemetry History

- **GET** `/sensors/{topic}/history?limit=20`
- _(Ví dụ: `/sensors/yolohome/device/yolo_uno_01/telemetry/history`)_

---

## 7. WebSocket (Real-time Events)

**Endpoint:** `ws://localhost:8000/ws`

Sử dụng endpoint này trên Frontend/Mobile để tự động cập nhật UI mà không cần polling. Backend sẽ broadcast sự kiện dưới dạng chuỗi JSON mỗi khi có dữ liệu mới.

### 7.1 Kết nối

Kết nối đến WebSocket endpoint. Không cần authentication header — chỉ cần mở kết nối:

```javascript
// React Native / Web
const ws = new WebSocket("ws://localhost:8000/ws");

ws.onopen = () => console.log("Connected");

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "telemetry_update") {
    // Cập nhật nhiệt độ, độ ẩm, ánh sáng trên UI
    console.log("Sensor:", data);
  }

  if (data.type === "device_update") {
    // Cập nhật trạng thái thiết bị trên UI
    console.log("Device:", data);
  }
};

ws.onclose = () => console.log("Disconnected");
```

> **Keep-alive:** Client có thể gửi chuỗi `"ping"`, server sẽ trả lời `"pong"`.

### 7.2 Sự kiện: Telemetry Update (Dữ liệu cảm biến mới)

Được broadcast mỗi khi ESP32 gửi telemetry lên MQTT.

```json
{
  "type": "telemetry_update",
  "data": {
    "temperature": 29.5,
    "humidity": 66.3,
    "light": 40,
    "timestamp": "2026-04-20T18:14:00"
  }
}
```

### 7.3 Sự kiện: Device Update (Thiết bị thay đổi trạng thái)

Được broadcast mỗi khi thiết bị phản hồi trạng thái thực tế qua MQTT (ack/state).

```json
// Light
{
  "type": "device_update",
  "device_id": 1,
  "state": {
    "status": "on",
    "color": { "r": 255, "g": 255, "b": 255 }
  }
}

// Fan
{
  "type": "device_update",
  "device_id": 2,
  "state": {
    "status": "on",
    "speed": 50
  }
}

// Door
{
  "type": "device_update",
  "device_id": 3,
  "state": {
    "status": "locked"
  }
}
```
