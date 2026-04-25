# Smart Home IoT API Documentation (Updated)

This document outlines the REST APIs and WebSocket endpoints for the Smart Home IoT application.

**Base URL**: `http://localhost:8000/api/v1`

---

## 1. Authentication (`/auth`)

### 1.1 Login
*   **POST** `/auth/login`
*   **Body:**
    ```json
    {
      "email": "demo@smarthome.app",
      "password": "yourpassword"
    }
    ```
*   **Response (200 OK):**
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
> - **React Native (fetch)**: Add `credentials: 'include'` to your fetch options.
> - **React Native (axios)**: Set `axios.defaults.withCredentials = true;`.
> Once configured, React Native's native networking layer (OkHttp/NSURLSession) will automatically persist the session cookie from the login response and attach it to all future requests. No need to manually store tokens!

### 1.2 Register
*   **POST** `/auth/register`
*   **Body:**
    ```json
    {
      "email": "newuser@smarthome.app",
      "password": "securepassword",
      "fullName": "New User",
      "phone": "0987654321",
      "dateOfBirth": "1995-12-31"
    }
    ```
*   **Response (200 OK):** Trả về giống Login (tự động đăng nhập và set session cookie).

### 1.3 Logout
*   **POST** `/auth/logout`
*   **Response (200 OK):** Xóa session cookie của người dùng.
    ```json
    {
      "message": "Logout successful"
    }
    ```

---

## 2. User Profile (`/profile`)

### 2.1 Get Profile
*   **GET** `/profile`
*   **Response (200 OK):**
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
*   **PUT** `/profile`
*   **Body:**
    ```json
    {
      "fullName": "Updated Name",
      "phone": "0123456789",
      "dateOfBirth": "1992-05-20"
    }
    ```
*   **Response (200 OK):** Trả về User object sau khi cập nhật.

### 2.3 Change Password
*   **PUT** `/profile/password`
*   **Body:**
    ```json
    {
      "currentPassword": "oldpassword",
      "newPassword": "newpassword"
    }
    ```
*   **Response (200 OK):** `{"message": "Password changed successfully"}`

---

## 3. Devices CRUD (`/devices`)

*Lưu ý: Yêu cầu truyền query `?user_id=1` cho toàn bộ các endpoint CRUD.*

### 3.1 Create Device
*   **POST** `/devices`
*   **Body:**
    ```json
    {
      "name": "Living Room Light",
      "device_type": "light",
      "base_topic": "yolohome/device/yolo_uno_01",
      "state": {
        "status": "off",
        "color": { "r": 255, "g": 255, "b": 255 }
      }
    }
    ```

### 3.2 List Devices
*   **GET** `/devices`
*   **Response (200 OK):**
    ```json
    [
      {
        "id": 1,
        "owner_id": 1,
        "name": "Living Room Light",
        "device_type": "light",
        "base_topic": "yolohome/device/yolo_uno_01",
        "state": { "status": "on", "color": {"r": 255, "g": 80, "b": 20} },
        "last_online": "2026-04-20T10:35:00"
      }
    ]
    ```

### 3.3 Update Device
*   **PUT** `/devices/{device_id}`
*   **Body:** Cùng cấu trúc với Create, có thể gửi các trường muốn update.

### 3.4 Delete Device
*   **DELETE** `/devices/{device_id}`

---

## 4. Quick Device Control (`/device-control`)

### 4.1 Update Device State (Gửi lệnh MQTT)
*   **PUT** `/device-control/{device_id}/state`
*   **Body:** Trạng thái mong muốn của thiết bị (UI format).
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
    ```
*   **Response (200 OK):** Trả về state mới và lập tức publish lệnh xuống MQTT để thiết bị thay đổi.

---

## 5. Automation Modes (`/modes`)

### 5.1 Create Mode
*   **POST** `/modes`
*   **Body:** (Sử dụng 1 timeline chung `startTime`, `endTime` cho danh sách `devices` bên trong)
    ```json
    {
      "name": "Good Morning",
      "startTime": "06:30",
      "endTime": "08:00",
      "devices": [
        {
          "id": 1,
          "state": { "status": "on", "color": {"r": 255, "g": 255, "b": 255} }
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
*   **GET** `/modes` (Trả về array các modes)
*   **GET** `/modes/{mode_id}` (Trả về chi tiết 1 mode)

### 5.3 Toggle Mode (Bật/Tắt nhanh)
*   **PATCH** `/modes/{mode_id}/toggle`
*   **Body:**
    ```json
    {
      "isActive": true
    }
    ```
*   *Tính năng đặc biệt: Nếu toggle sang `true` và thời gian hiện tại nằm trong khung `startTime`-`endTime`, Mode sẽ được kích hoạt thực thi ngay lập tức.*

---

## 6. Telemetry & Sensors (`/sensors`)

### 6.1 Get Current Telemetry
*   **GET** `/sensors/current?device_id=yolo_uno_01` (device_id là optional)
*   **Response (200 OK):**
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
*   **GET** `/sensors/{topic}/history?limit=20`
*   *(Ví dụ: `/sensors/yolohome/device/yolo_uno_01/telemetry/history`)*

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

