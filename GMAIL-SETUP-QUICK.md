# 🚀 Gmail Setup - Quick Guide

## ⚡ Cách 1: Gmail App Password (Đơn giản nhất - Khuyên dùng)

### Bước 1: Bật 2-Step Verification
1. Vào: https://myaccount.google.com/security
2. Tìm **"2-Step Verification"** → Click **Turn on**
3. Làm theo hướng dẫn (cần số điện thoại)

### Bước 2: Tạo App Password
1. Vào: https://myaccount.google.com/apppasswords
   - Hoặc: Security → 2-Step Verification → App passwords
2. Chọn:
   - **App**: "Mail"
   - **Device**: "Other (Custom name)" → Nhập: `Happy Care Clinic`
3. Click **Generate**
4. **Copy mật khẩu 16 ký tự** (ví dụ: `abcd efgh ijkl mnop`)

### Bước 3: Cấu hình `.env`
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=abcdefghijklmnop  # App Password (bỏ khoảng trắng)
EMAIL_FROM=Happy Care Clinic <your-email@gmail.com>
```

### Bước 4: Restart backend
```bash
cd backend
npm run dev
```

✅ **Xong!** Email sẽ hoạt động ngay.

---

## 🔧 Cách 2: Google Cloud Service Account (Production)

Nếu bạn đang ở Google Cloud Console và muốn dùng OAuth2:

### Bước 1: Tạo Service Account (Bạn đang ở đây)
1. **Service account name**: `happy-care-clinic-email`
2. **Service account ID**: Sẽ tự generate (hoặc để mặc định)
3. **Description**: `Service account for sending emails via Gmail API`
4. Click **"Create and continue"**

### Bước 2: Grant Permissions (Optional)
- Có thể bỏ qua, click **"Continue"**

### Bước 3: Grant Access to Users (Optional)
- Có thể bỏ qua, click **"Done"**

### Bước 4: Tạo Key
1. Vào **Service Accounts** → Click vào service account vừa tạo
2. Tab **"Keys"** → **"Add Key"** → **"Create new key"**
3. Chọn **JSON** → Click **"Create"**
4. File JSON sẽ download về

### Bước 5: Enable Gmail API
1. Vào **APIs & Services** → **Library**
2. Tìm **"Gmail API"** → Click **Enable**

### Bước 6: Cấu hình OAuth2
- Cần setup OAuth2 consent screen
- Tạo OAuth2 credentials
- Cấu hình redirect URIs

⚠️ **Lưu ý**: OAuth2 phức tạp hơn, cần nhiều bước setup.

---

## 💡 Khuyến nghị

### Development/Testing:
✅ **Dùng Gmail App Password** (Cách 1)
- Đơn giản, nhanh
- Setup trong 2 phút
- Đủ cho development

### Production:
✅ **Dùng SendGrid hoặc Mailgun**
- Dễ setup hơn OAuth2
- Free tier tốt
- Professional hơn

### Enterprise:
✅ **Dùng Google Cloud Service Account + OAuth2**
- Phức tạp nhưng mạnh
- Cần domain verification
- Phù hợp enterprise

---

## 🎯 Action ngay bây giờ

**Nếu bạn muốn đơn giản:**
1. **Đóng Google Cloud Console**
2. **Làm theo Cách 1** (Gmail App Password)
3. **Xong trong 2 phút!**

**Nếu bạn muốn tiếp tục với Service Account:**
1. Điền form:
   - Name: `happy-care-clinic-email`
   - ID: để mặc định
   - Description: `Email service for clinic notifications`
2. Click **"Create and continue"**
3. Skip Step 2 & 3 (optional)
4. Tạo JSON key
5. Enable Gmail API
6. Setup OAuth2 (phức tạp)

---

**Tôi khuyên dùng Cách 1 (App Password) cho development!** 🚀


