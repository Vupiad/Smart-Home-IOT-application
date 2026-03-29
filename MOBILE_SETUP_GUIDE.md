# Mobile App - Quick Start Guide for Team Members

Hướng dẫn cho các thành viên pull code về và code screen của mình.

---

## **1️⃣ Chuẩn bị (Lần đầu tiên)**

### Cài Node.js & Yarn (nếu chưa cài)

```powershell
# Kiểm tra xem cài rồi chưa
node --version
yarn --version
```

Nếu chưa cài, tải từ: [nodejs.org](https://nodejs.org/)

### Cài Expo CLI (Global - chỉ cần cài 1 lần)

```powershell
npm install -g expo-cli
expo --version
```

---

## **2️⃣ Pull Code về**

### Checkout nhánh mobile

```powershell
# Vào thư mục dự án
cd "d:\SCHOOL\0. BK\HK252\ĐỒ ÁN TỔNG HỢP\Smart-Home-IOT-application"

# Kiểm tra branch hiện tại
git branch --show-current

# Checkout sang mobile
git checkout mobile

# Pull code mới nhất
git pull origin mobile
```

### Cài dependencies

```powershell
cd mobile
yarn install
```

(Nếu bị lỗi yarn, dùng `npm install` thay)

---

## **3️⃣ Chạy App**

Ở folder `mobile`, chạy:

```powershell
yarn start
```

Hoặc nếu dùng npm:

```powershell
npm start
```

Cửa sổ sẽ hiển thị QR code. Tải app **Expo Go ** trên điện thoại quét QR code. Hoặc quét QR code bằng camera cho Iphone

---

## **4️⃣ Code Screen của Bạn**

---

## **5️⃣ Commit & Push**

Sau khi code xong feature:

```powershell
# Kiểm tra branch
git branch --show-current

# Xem thay đổi
git status

# Add files
git add .

# Commit
git commit -m "feat: Add home screen"

# Push
git push origin mobile
```

**Commit message format:**

- `feat: ` - Tính năng mới
- `fix: ` - Sửa lỗi
- `refactor: ` - Cải thiện code
- `style: ` - CSS/styling
- `docs: ` - Documentation

Ví dụ:

```powershell
git commit -m "feat: Add device control screen with MQTT integration"
git commit -m "fix: Header time update issue"
git commit -m "style: Update header colors"
```

---

## **6️⃣ Header Component Usage**

Header component đã có sẵn, dùng ở mỗi screen:

```tsx
import { Header } from "@/shared/components";
```

---
