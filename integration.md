# Hướng dẫn chạy Backend và Frontend (nhánh integration)

Chuyển sang nhánh integration

```bash
git branch --show-current

git checkout integration
```

Tài khoản login
user@example.com
password123

Mật khẩu cửa là 123456

## 1. Môi trường Backend (BE)

**Bước 1: Di chuyển vào thư mục backend**

```bash
cd backend
```

**Bước 2: Cài đặt các thư viện cần thiết**

```bash
pip install -r requirements.txt

# Lưu ý: Cài đặt thêm các thư viện dưới đây để tránh lỗi (do thiếu trong requirements.txt)
pip install "python-jose[cryptography]"
pip install "paho-mqtt>=2.0.0"
```

**Bước 3: Khởi động server Backend**

```bash

python -m uvicorn main:app --reload --host 0.0.0.0
```

**Bước 4: Mở trang tài liệu API (Swagger)**

- Truy cập vào link sau trên trình duyệt: [http://localhost:8000/docs](http://localhost:8000/docs)
- Tại đây, bạn có thể xem danh sách các API và test trực tiếp bằng nút "Try it out".

---

## 2. Môi trường Frontend (FE) - Mobile

_(Cần chuyển sang Terminal khác)_
**Bước 1: Di chuyển vào thư mục mobile**

```bash
cd mobile
```

**Bước 2: Cài đặt thư viện npm**

```bash
npm install
```

**Bước 3: Khởi động ứng dụng React Native/Expo**

```bash
npm start
```
