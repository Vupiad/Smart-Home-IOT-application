# Backend API Requirements - Mobile App

**Dành cho:** Backend Team  
**Ngày:** 2026-04-13  
**Trạng thái:** Pending Implementation

---

## Base URL
```
http://[backend-host]:[port]/api/v1
```

---

## 1. Authentication Endpoints

### 1.1 Login
**Endpoint:** `POST /auth/login`

**Request:**
```json
{
  "email": "demo@smarthome.app",
  "password": "123456"
}
```

**Response (200):**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user-1",
    "email": "demo@smarthome.app",
    "fullName": "Demo User",
    "phone": "0123456789",
    "dateOfBirth": "1990-01-01"
  }
}
```

**Error (401):**
```json
{
  "detail": "Invalid email or password"
}
```

---

### 1.2 Sign Up
**Endpoint:** `POST /auth/signup`

**Request:**
```json
{
  "email": "newuser@smarthome.app",
  "password": "password123",
  "fullName": "New User",
  "phone": "0987654321",
  "dateOfBirth": "1995-05-15"
}
```

**Response (201):**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user-new",
    "email": "newuser@smarthome.app",
    "fullName": "New User",
    "phone": "0987654321",
    "dateOfBirth": "1995-05-15"
  }
}
```

**Error (400):**
```json
{
  "detail": "Email already exists"
}
```

---

## 2. Device Management Endpoints

### 2.1 Get All Devices
**Endpoint:** `GET /devices`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
[
  {
    "id": "device-fan-kitchen",
    "name": "Fan",
    "type": "fan",
    "isOn": true,
    "room": "Kitchen",
    "icon": "fan",
    "subtitle": "Speed 2"
  },
  {
    "id": "device-ac-living-room",
    "name": "Air Conditioner",
    "type": "ac",
    "isOn": true,
    "room": "Living room",
    "icon": "ac",
    "subtitle": "24 degree"
  },
  {
    "id": "device-light-kitchen",
    "name": "Light",
    "type": "light",
    "isOn": true,
    "room": "Kitchen",
    "icon": "light",
    "subtitle": "Warm White"
  }
]
```

**Device Types:** `fan`, `ac`, `light`

---

### 2.2 Get Device Detail
**Endpoint:** `GET /devices/{deviceId}`

**Headers:**
```
Authorization: Bearer {token}
```

**Response for Fan (200):**
```json
{
  "id": "device-fan-kitchen",
  "name": "Fan",
  "type": "fan",
  "isOn": true,
  "online": true,
  "level": 2,
  "timerMinutes": 10
}
```

**Response for AC (200):**
```json
{
  "id": "device-ac-living-room",
  "name": "Air Conditioner",
  "type": "ac",
  "isOn": true,
  "online": true,
  "mode": "cool",
  "temperature": 24,
  "fanSpeed": 1,
  "timerMinutes": 10,
  "humidity": 62
}
```

**Response for Light (200):**
```json
{
  "id": "device-light-kitchen",
  "name": "Light",
  "type": "light",
  "isOn": true,
  "online": true,
  "brightness": 47,
  "colorHex": "#2D5BFF",
  "timerMinutes": 90
}
```

---

### 2.3 Toggle Device Power
**Endpoint:** `PATCH /devices/{deviceId}/power`

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "isOn": true
}
```

**Response (200):**
```json
{
  "message": "Device power updated successfully"
}
```

---

### 2.4 Update Fan Settings
**Endpoint:** `PATCH /devices/{deviceId}/fan`

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "level": 3,
  "timerMinutes": 15
}
```

**Response (200):**
```json
{
  "id": "device-fan-kitchen",
  "name": "Fan",
  "type": "fan",
  "isOn": true,
  "online": true,
  "level": 3,
  "timerMinutes": 15
}
```

---

### 2.5 Update AC Settings
**Endpoint:** `PATCH /devices/{deviceId}/ac`

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "mode": "cool",
  "temperature": 25,
  "fanSpeed": 2,
  "timerMinutes": 30
}
```

**Response (200):**
```json
{
  "id": "device-ac-living-room",
  "name": "Air Conditioner",
  "type": "ac",
  "isOn": true,
  "online": true,
  "mode": "cool",
  "temperature": 25,
  "fanSpeed": 2,
  "timerMinutes": 30,
  "humidity": 62
}
```

**AC Mode Options:** `cool`, `hot`, `auto`

---

### 2.6 Update Light Settings
**Endpoint:** `PATCH /devices/{deviceId}/light`

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "brightness": 75,
  "colorHex": "#FFFFFF",
  "timerMinutes": 120
}
```

**Response (200):**
```json
{
  "id": "device-light-kitchen",
  "name": "Light",
  "type": "light",
  "isOn": true,
  "online": true,
  "brightness": 75,
  "colorHex": "#FFFFFF",
  "timerMinutes": 120
}
```

---

## 3. User Profile Endpoints

### 3.1 Get User Profile
**Endpoint:** `GET /auth/me`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "user-1",
  "email": "demo@smarthome.app",
  "fullName": "Demo User",
  "phone": "0123456789",
  "dateOfBirth": "1990-01-01"
}
```

---

### 3.2 Update Profile
**Endpoint:** `PUT /auth/profile`

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "fullName": "Updated Name",
  "phone": "0912345678",
  "dateOfBirth": "1990-05-10"
}
```

**Response (200):**
```json
{
  "id": "user-1",
  "email": "demo@smarthome.app",
  "fullName": "Updated Name",
  "phone": "0912345678",
  "dateOfBirth": "1990-05-10"
}
```

---

### 3.3 Change Password
**Endpoint:** `POST /auth/change-password`

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "currentPassword": "123456",
  "newPassword": "newpassword123"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

**Error (400):**
```json
{
  "detail": "Incorrect current password"
}
```

---

## 4. Automation Endpoints (To Be Defined)

> **Note:** Automation feature được liệt kê trong SPEC nhưng chưa có chỉ tiết. Cần xác định:
> - Cấu trúc dữ liệu Automation
> - Các trường cần thiết (trigger, action, schedule, etc.)
> - Operations: Create, Read, Update, Delete, List
> - Status tracking

---

## 5. Energy/Usage Analytics Endpoints (To Be Defined)

> **Note:** Home Screen cần hiển thị:
> - Usage time chart
> - Top 3 automations
> - Device power consumption (trong Automation tab)
> - Monthly consumption
>
> **Endpoints cần:**
> - GET /analytics/usage-today
> - GET /analytics/usage-month
> - GET /analytics/device-consumption
> - GET /analytics/automation-consumption

---

## 6. Sensor Data Endpoints

### 6.1 Get Sensor History
**Endpoint:** `GET /sensors/{topic}/history`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
```
limit: 20 (max: 100)
```

**Response (200):**
```json
{
  "topic": "V1",
  "count": 20,
  "history": [
    {
      "timestamp": "2026-04-13T10:30:00Z",
      "temperature": 24.5,
      "humidity": 62
    },
    {
      "timestamp": "2026-04-13T10:25:00Z",
      "temperature": 24.3,
      "humidity": 61
    }
  ]
}
```

---

## 7. Error Handling Standards

### 400 Bad Request
```json
{
  "detail": "Invalid request format or missing required fields"
}
```

### 401 Unauthorized
```json
{
  "detail": "Invalid or missing authentication token"
}
```

### 403 Forbidden
```json
{
  "detail": "User does not have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

---

## 8. Authentication Method

- **Type:** JWT Bearer Token
- **Header:** `Authorization: Bearer {token}`
- **Token Location:** Response từ `/auth/login` hoặc `/auth/signup`
- **Token Expiration:** TBD (suggested: 24 hours)

---

## 9. Implementation Notes

### Required:
- [ ] All endpoints should require authentication (token) except `/auth/login` và `/auth/signup`
- [ ] Validate input data trước khi processing
- [ ] Use appropriate HTTP status codes
- [ ] Return consistent JSON response format
- [ ] Implement CORS headers for mobile app access
- [ ] Log all API calls for debugging

### Recommended:
- [ ] Implement rate limiting để prevent abuse
- [ ] Add request/response logging middleware
- [ ] Use pagination với large datasets
- [ ] Implement caching cho frequently accessed data (e.g., devices list)
- [ ] Add API versioning support

---

## 10. Testing Checklist

- [ ] Test all endpoints with valid/invalid data
- [ ] Test authentication (valid token, invalid token, expired token)
- [ ] Test device operations (toggle, update settings)
- [ ] Test error scenarios
- [ ] Test concurrent requests
- [ ] Integration test với MQTT service cho device updates

---

**Last Updated:** 2026-04-13  
**Status:** Awaiting BE Implementation & Feedback
