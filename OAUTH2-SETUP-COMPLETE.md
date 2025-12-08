# ✅ OAuth2 Setup Hoàn Tất!

## 📋 Đã cấu hình:

1. ✅ **File credentials**: `backend/credentials/google-oauth.json`
2. ✅ **Thư viện**: `googleapis`, `google-auth-library` (đã cài)
3. ✅ **OAuth2 Service**: `backend/src/services/gmail-oauth.service.ts`
4. ✅ **Email Service**: Đã update để support OAuth2
5. ✅ **Routes**: `/api/auth/google/*` (authorization endpoints)

---

## 🚀 Bước tiếp theo: Authorize OAuth2 (Lần đầu)

### Bước 1: Cấu hình `.env`

**File**: `backend/.env`

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=  # Có thể để trống nếu dùng OAuth2
EMAIL_FROM=Happy Care Clinic <your-email@gmail.com>

# OAuth2 Configuration
EMAIL_USE_OAUTH2=true
GOOGLE_OAUTH2_CREDENTIALS_PATH=credentials/google-oauth.json
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

### Bước 2: Start backend server

```bash
cd backend
npm run dev
```

### Bước 3: Get Authorization URL

**Option A: Qua API**
```bash
# GET request
curl http://localhost:3000/api/auth/google/url
```

**Response:**
```json
{
  "success": true,
  "authUrl": "https://accounts.google.com/o/oauth2/auth?...",
  "message": "Visit this URL to authorize Gmail access"
}
```

**Option B: Trực tiếp trong browser**
```
http://localhost:3000/api/auth/google/url
```

### Bước 4: Authorize

1. **Copy `authUrl`** từ response
2. **Mở trong browser**
3. **Login** với Gmail account
4. **Click "Allow"** để authorize
5. **Redirect** về callback URL
6. **Token sẽ được lưu tự động** vào `backend/credentials/gmail-token.json`

### Bước 5: Kiểm tra status

```bash
# GET request
curl http://localhost:3000/api/auth/google/status
```

**Response:**
```json
{
  "success": true,
  "configured": true,
  "hasToken": true,
  "ready": true
}
```

---

## ✅ Sau khi authorize xong:

- ✅ **Token được lưu**: `backend/credentials/gmail-token.json`
- ✅ **Email service tự động dùng OAuth2**
- ✅ **Token tự động refresh** khi hết hạn
- ✅ **Không cần authorize lại** (trừ khi revoke)

---

## 🔄 Cách hoạt động:

### Email Service Flow:

1. **Check OAuth2**: Nếu `EMAIL_USE_OAUTH2=true` và có token → dùng OAuth2
2. **Fallback SMTP**: Nếu OAuth2 fail → tự động fallback về SMTP
3. **Auto Refresh**: Token tự động refresh khi gần hết hạn

### OAuth2 vs SMTP:

| Feature | OAuth2 | SMTP (App Password) |
|--------|--------|---------------------|
| Setup | Phức tạp (cần authorize) | Đơn giản (2 phút) |
| Security | ✅ Enterprise-grade | ✅ Good |
| Token Refresh | ✅ Tự động | ❌ Không cần |
| Production | ✅ Recommended | ⚠️ Limited |

---

## 🎯 Quick Test:

### Test OAuth2 Email:

```bash
# 1. Check status
curl http://localhost:3000/api/auth/google/status

# 2. Nếu chưa authorize, get URL
curl http://localhost:3000/api/auth/google/url

# 3. Authorize trong browser

# 4. Test email (qua appointment booking)
# Email sẽ tự động gửi khi:
# - Patient books appointment
# - OTP verification
# - Appointment reminders
```

---

## ⚠️ Lưu ý:

1. ✅ **Token file** (`gmail-token.json`) đã được ignore trong Git
2. ✅ **Credentials file** (`google-oauth.json`) đã được ignore trong Git
3. ✅ **KHÔNG share** token hoặc credentials
4. ✅ **Token refresh** tự động, không cần can thiệp

---

## 🔧 Troubleshooting:

### Lỗi: "OAuth2 client not initialized"
- ✅ Kiểm tra file `credentials/google-oauth.json` có tồn tại
- ✅ Kiểm tra format JSON đúng

### Lỗi: "Authorization failed"
- ✅ Kiểm tra redirect URI trong Google Cloud Console
- ✅ Redirect URI phải match: `http://localhost:3000/api/auth/google/callback`

### Lỗi: "Token expired"
- ✅ Token sẽ tự động refresh
- ✅ Nếu vẫn lỗi, authorize lại

### Email không gửi được:
- ✅ Check logs: `✅ Email sent via Gmail API` hoặc `✅ Email sent to ...`
- ✅ Nếu OAuth2 fail, sẽ tự động fallback về SMTP
- ✅ Check `.env` config

---

## 💡 Khuyến nghị:

### Development:
- ✅ **Dùng App Password** (đơn giản hơn)
- ⚠️ OAuth2 phức tạp, chỉ dùng nếu cần

### Production:
- ✅ **Dùng OAuth2** (nếu dùng Gmail)
- ✅ **Hoặc SendGrid/Mailgun** (dễ hơn)

---

## 🎉 Xong!

**Bây giờ bạn có thể:**
1. Start backend: `npm run dev`
2. Get auth URL: `http://localhost:3000/api/auth/google/url`
3. Authorize trong browser
4. Email sẽ hoạt động với OAuth2!

**Hoặc nếu muốn đơn giản:**
- Bỏ `EMAIL_USE_OAUTH2=true` trong `.env`
- Dùng App Password như bình thường

---

**Chúc bạn thành công!** 🚀


