# Frontend Setup Guide - React Native Expo

## 📋 Những gì vừa được update

Frontend Mobile (React Native Expo) đã được kết nối với Backend API:

### ✅ Tạo mới:

- `src/shared/constants/api.ts` - Constants cho tất cả API endpoints
- `src/shared/services/api.client.ts` - API client wrapper (xử lý cookies & errors)
- `src/features/profile/services/profile.service.ts` - Profile API methods (getProfile, logout)

### ✅ Cập nhật:

- `src/features/auth/services/auth.service.ts` - Gọi real backend API thay vì mock data
- `src/features/auth/types.ts` - Loại bỏ userId (backend lấy từ session)
- `src/features/auth/state/AuthContext.tsx` - Thêm logout method
- `src/features/profile/screens/EditProfileScreen.tsx` - Remove userId từ payload
- `src/features/profile/screens/ChangePasswordScreen.tsx` - Remove userId từ payload

---

## 🚀 Cách chạy Frontend + Backend

### 1️⃣ Chạy Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
```

Backend sẽ chạy ở `http://localhost:8000`

**Kiểm tra**: Mở browser → `http://localhost:8000/docs` → Swagger API docs

### 2️⃣ Chạy Frontend

```bash
cd mobile
npm install  # Nếu chưa install
npm start    # Hoặc: expo start
```

Sau đó chọn:

- `w` → Web (dùng trình duyệt)
- `a` → Android emulator
- `i` → iOS simulator

---

## 🔧 Cấu hình API URL

**File:** `mobile/src/shared/constants/api.ts`

### Nếu backend và frontend ở cùng máy:

```typescript
export const API_BASE_URL = isDev
  ? "http://localhost:8000/api/v1"
  : "https://api.smarthome.app/api/v1";
```

### Nếu backend ở máy khác (IP 192.168.1.100):

```typescript
export const API_BASE_URL = isDev
  ? "http://192.168.1.100:8000/api/v1"
  : "https://api.smarthome.app/api/v1";
```

> **Tip:** Dùng `ipconfig` (Windows) hoặc `ifconfig` (Mac/Linux) để tìm IP máy

---

## 🧪 Test các API Endpoint

### 1. **Test Register**

```
📱 Frontend: Profile Screen → [Chưa có nút register] → Cần navigate từ Login screen
API: POST /api/v1/auth/register
```

### 2. **Test Login**

```
📱 Frontend: Login Screen
1. Nhập email & password
2. Ấn "Sign In"
3. Nên chuyển sang Home screen

API: POST /api/v1/auth/login
Response: Session cookie tự động lưu
```

### 3. **Test Get Profile**

```
📱 Frontend: Profile Screen
- Hiển thị: fullName, email, phone, dateOfBirth

API: GET /api/v1/profile
- Yêu cầu: Session cookie (tự động gửi)
```

### 4. **Test Update Profile**

```
📱 Frontend: Profile Screen → "Edit Profile" button
1. Sửa fullName, phone, dateOfBirth
2. Ấn "Save Changes"
3. Quay lại Profile Screen, xem thay đổi được lưu

API: PUT /api/v1/profile
- Body: { fullName, phone, dateOfBirth }
```

### 5. **Test Change Password**

```
📱 Frontend: Profile Screen → "Change Password" button
1. Nhập current password
2. Nhập new password (2 lần)
3. Ấn "Change"
4. Nên show "Success" message

API: PUT /api/v1/profile/password
- Body: { currentPassword, newPassword }
```

### 6. **Test Logout**

```
📱 Frontend: Profile Screen → "Log Out" button
1. Ấn "Log Out"
2. Session cookie xóa
3. Quay lại Login screen

API: POST /api/v1/auth/logout
```

---

## 🐛 Troubleshooting

### ❌ Error: "Connection refused"

**Nguyên nhân:** Backend không chạy hoặc API URL sai

**Cách sửa:**

```bash
# 1. Kiểm tra backend có chạy không
http://localhost:8000/health

# 2. Kiểm tra API_BASE_URL trong api.ts
# 3. Restart frontend app
```

### ❌ Error: "401 Unauthorized"

**Nguyên nhân:** Chưa login hoặc session cookie mất

**Cách sửa:**

- Login lại
- Check xem session cookie có được lưu không (DevTools → Application → Cookies)

### ❌ Error: "CORS error"

**Nguyên nhân:** Backend CORS config không cho phép frontend

**Cách kiểm tra:** Xem `backend/main.py` - `allow_origins` setting

```python
# CORS config trong main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8081",  # Expo web
        # ...
    ],
    allow_credentials=True,  # Gửi cookies
)
```

---

## 📱 Test trên Physical Device

Để test trên điện thoại thật (không dùng emulator):

### 1. **Tìm IP máy backend:**

```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

### 2. **Update API_BASE_URL:**

```typescript
// mobile/src/shared/constants/api.ts
export const API_BASE_URL = isDev
  ? "http://YOUR_IP:8000/api/v1"
  : "https://api.smarthome.app/api/v1";
```

### 3. **Chạy app:**

```bash
npm start
# Quét QR code bằng Expo Go app hoặc camera
```

---

## 🔐 Authentication Flow

```
User Login
    ↓
Frontend gọi: POST /api/v1/auth/login
    ↓
Backend tạo session & gửi session cookie
    ↓
Api Client (api.client.ts) tự động lưu cookie:
  - credentials: 'include' (gửi cookies)
    ↓
Mọi request tiếp theo sẽ tự động attach cookie:
  - GET /api/v1/profile
  - PUT /api/v1/profile
  - PUT /api/v1/profile/password
    ↓
Backend kiểm tra session từ cookie
  → Nếu valid: trả response
  → Nếu invalid: trả 401 Unauthorized
```

---

## 📚 API Documentation

**Xem đầy đủ tại:** `backend/API_DOCUMENTATION.md`

**API Endpoints được kết nối:**

| Feature         | Endpoint            | Method |
| --------------- | ------------------- | ------ |
| Login           | `/auth/login`       | POST   |
| Register        | `/auth/register`    | POST   |
| Logout          | `/auth/logout`      | POST   |
| Get Profile     | `/profile`          | GET    |
| Update Profile  | `/profile`          | PUT    |
| Change Password | `/profile/password` | PUT    |

---

## ✨ Next Steps

- [ ] Integrate Devices API (GET, POST, PUT, DELETE)
- [ ] Integrate Device Control API (MQTT commands)
- [ ] Integrate Modes API (automation)
- [ ] Integrate Sensors API (telemetry)
- [ ] Add persistent auth (store session in AsyncStorage)
- [ ] Add error boundaries & better error handling
- [ ] Add loading spinners & animations
