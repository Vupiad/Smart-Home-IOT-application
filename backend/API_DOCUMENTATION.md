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
      "token": "fake-jwt-token-for-1",
      "user": {
        "id": 1,
        "email": "demo@smarthome.app",
        "fullName": "Demo User",
        "phone": "0123456789",
        "dateOfBirth": "1990-01-01"
      }
    }
    ```

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
*   **Response (200 OK):** Trả về giống Login (Token + User object).

---

## 2. User Profile (`/profile`)

*Lưu ý: Truyền thêm query `?user_id=1` vào URL trong lúc chờ tích hợp JWT thực tế.*

### 2.1 Update Profile
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

### 2.2 Change Password
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
*   **Query:** `?user_id=1`
*   **Body:** Trạng thái mong muốn của thiết bị (UI format).
    ```json
    {
      "state": {
        "status": "on",
        "speed": 50
      }
    }
    ```
*   **Response (200 OK):** Trả về state mới và lập tức publish lệnh xuống MQTT để thiết bị thay đổi.

---

## 5. Automation Modes (`/modes`)

*Lưu ý: Yêu cầu truyền query `?user_id=1` cho toàn bộ các endpoint CRUD.*

### 5.1 Create Mode
*   **POST** `/modes`
*   **Body:** (Sử dụng 1 timeline chung `startTime`, `endTime` cho danh sách `devices` bên trong)
    ```json
    {
      "name": "Good Morning",
      "description": "Wake up sequence",
      "startTime": "06:30",
      "endTime": "08:00",
      "isActive": true,
      "devices": [
        {
          "id": 1,
          "state": { "status": "on", "color": {"r": 255, "g": 255, "b": 255} }
        },
        {
          "id": 2,
          "state": { "status": "on", "speed": 30 }
        }
      ]
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

Sử dụng endpoint này trên Frontend để tự động cập nhật UI mà không cần F5 (Polling). Backend sẽ broadcast sự kiện dưới dạng chuỗi JSON mỗi khi có dữ liệu mới.

### Sự kiện 1: Có dữ liệu Telemetry mới (Nhiệt độ, Độ ẩm)
```json
{
  "type": "telemetry_update",
  "deviceId": "yolo_uno_01",
  "data": {
    "temperature": 29.5,
    "humidity": 66.3,
    "light": 40,
    "timestamp": "2026-04-20T18:14:00"
  }
}
```

### Sự kiện 2: Thiết bị phản hồi trạng thái thực tế (Ack/State Update)
```json
{
  "type": "device_update",
  "device_id": 1,
  "state": {
    "status": "on",
    "color": { "r": 255, "g": 255, "b": 255 }
  }
}
```
