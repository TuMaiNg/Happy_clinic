# 🔐 Cấu hình Google OAuth2 Client Secret

## 📋 Bạn đã có Client Secret - Bây giờ làm gì?

### Option 1: Dùng SMTP với App Password (Đơn giản - Khuyên dùng)

Nếu bạn muốn đơn giản, **KHÔNG CẦN** client secret. Chỉ cần:

1. **Lấy Gmail App Password**:
   - Vào: https://myaccount.google.com/apppasswords
   - Tạo App Password (16 ký tự)

2. **Cấu hình `.env`**:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-char-app-password
   EMAIL_FROM=Happy Care Clinic <your-email@gmail.com>
   ```

3. **Xong!** ✅

---

### Option 2: Dùng OAuth2 với Client Secret (Phức tạp)

Nếu bạn muốn dùng OAuth2:

#### Bước 1: Lưu file JSON credentials

1. **Tạo thư mục**:
   ```bash
   mkdir backend/credentials
   ```

2. **Lưu file JSON**:
   - File bạn download từ Google Cloud Console
   - Đặt tên: `google-oauth.json`
   - Lưu vào: `backend/credentials/google-oauth.json`

3. **Cấu trúc file**:
   ```json
   {
     "web": {
       "client_id": "xxxxx.apps.googleusercontent.com",
       "project_id": "happy-care-clinic",
       "auth_uri": "https://accounts.google.com/o/oauth2/auth",
       "token_uri": "https://oauth2.googleapis.com/token",
       "client_secret": "GOCSPX-xxxxxxxxxxxxx",
       "redirect_uris": ["http://localhost:3000/api/auth/google/callback"]
     }
   }
   ```

#### Bước 2: Cấu hình `.env`

```env
# Email Configuration (SMTP - Đơn giản)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Hoặc dùng OAuth2 (Phức tạp)
EMAIL_USE_OAUTH2=true
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

#### Bước 3: Cài đặt thư viện (Nếu dùng OAuth2)

```bash
cd backend
npm install googleapis google-auth-library
```

#### Bước 4: Implement OAuth2 Service

Cần tạo service mới để handle OAuth2 flow (phức tạp).

---

## 💡 Khuyến nghị

### Cho Development:
✅ **Dùng App Password** (Option 1)
- Không cần client secret
- Setup trong 2 phút
- Đủ dùng

### Cho Production:
✅ **Dùng SendGrid/Mailgun**
- Dễ hơn OAuth2
- Professional
- Free tier tốt

### Chỉ dùng OAuth2 nếu:
- Bắt buộc phải dùng Gmail API
- Cần enterprise features
- Có team chuyên về Google Cloud

---

## 🎯 Action ngay

**Nếu muốn đơn giản:**
1. Bỏ qua client secret
2. Dùng App Password
3. Cấu hình `.env` như trên
4. Xong!

**Nếu muốn dùng OAuth2:**
1. Lưu file JSON vào `backend/credentials/google-oauth.json`
2. Cài đặt: `npm install googleapis google-auth-library`
3. Tôi sẽ giúp implement OAuth2 service

---

**Bạn muốn dùng cách nào?** 🤔


