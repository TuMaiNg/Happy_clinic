# 📱 Twilio SMS Setup - Quick Guide

## ⚡ Setup trong 5 phút

### Bước 1: Đăng ký Twilio

1. **Vào**: https://www.twilio.com/try-twilio
2. **Đăng ký** account (miễn phí)
3. **Verify** phone number của bạn
4. **Nhận** $15.50 credit (đủ cho ~2,000 SMS)

### Bước 2: Lấy Credentials

Sau khi đăng ký, vào **Twilio Console**:

1. **Account SID**: 
   - Vào Dashboard → Copy "Account SID"
   - Format: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

2. **Auth Token**:
   - Vào Dashboard → Copy "Auth Token"
   - Format: `your_auth_token_here`

3. **Phone Number**:
   - Vào Phone Numbers → Get a number
   - Chọn country: **Vietnam** (hoặc US nếu VN không có)
   - Copy số điện thoại (format: `+1234567890`)

### Bước 3: Cấu hình `.env`

**File**: `backend/.env`

```env
# SMS Configuration
SMS_ENABLED=true
SMS_PROVIDER=twilio

# Twilio Credentials
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### Bước 4: Restart Backend

```bash
cd backend
npm run dev
```

### Bước 5: Test

**Test qua OTP booking:**
1. Đặt lịch hẹn
2. Nhập số điện thoại
3. Kiểm tra SMS có đến không

**Hoặc test trực tiếp:**
```bash
# Test SMS service
curl -X POST http://localhost:3000/api/test/sms \
  -H "Content-Type: application/json" \
  -d '{"phone": "+84901234567", "message": "Test SMS"}'
```

---

## ✅ Sau khi setup

- ✅ **SMS sẽ gửi thật** qua Twilio
- ✅ **OTP sẽ đến** số điện thoại thật
- ✅ **Appointment reminders** sẽ gửi SMS
- ✅ **Console log** sẽ hiển thị: `✅ SMS sent via Twilio to ...`

---

## 💰 Giá cả

- **Free Trial**: $15.50 credit
- **SMS tại VN**: ~$0.0075/SMS = ~180 VNĐ/SMS
- **SMS tại US**: ~$0.0075/SMS

**Ví dụ:**
- 1,000 SMS = ~$7.50 = ~180,000 VNĐ
- Free trial đủ cho ~2,000 SMS

---

## ⚠️ Lưu ý

1. ✅ **Phone number format**: Phải có `+` và country code
   - ✅ Đúng: `+84901234567`
   - ❌ Sai: `0901234567`

2. ✅ **Vietnam numbers**: Twilio có thể không support số VN
   - Giải pháp: Dùng US number, SMS vẫn gửi được đến VN

3. ✅ **Rate limits**: Twilio có rate limits
   - Free tier: ~1 SMS/second
   - Upgrade nếu cần nhiều hơn

---

## 🔧 Troubleshooting

### Lỗi: "Invalid phone number"
- ✅ Kiểm tra format: Phải có `+` và country code
- ✅ Ví dụ: `+84901234567` (VN), `+1234567890` (US)

### Lỗi: "Authentication failed"
- ✅ Kiểm tra Account SID và Auth Token
- ✅ Copy chính xác từ Twilio Console

### SMS không đến
- ✅ Kiểm tra phone number format
- ✅ Kiểm tra Twilio Console → Logs → Messaging
- ✅ Kiểm tra balance (còn credit không)

### Vẫn dùng mock
- ✅ Kiểm tra `.env` có đúng không
- ✅ Restart backend sau khi đổi `.env`
- ✅ Check console log: `✅ SMS Service: Twilio configured`

---

## 🎯 Alternative: Dùng Mock (Development)

Nếu không muốn setup Twilio ngay:

**File**: `backend/.env`
```env
SMS_ENABLED=false
SMS_PROVIDER=mock
```

**OTP sẽ hiển thị trong console:**
```
📱 SMS (mock) to 09XX***123: Happy Care - Mã xác nhận đặt lịch: 456789
```

---

## 📊 So sánh

| Method | Setup | Cost | Real SMS |
|--------|-------|------|----------|
| **Twilio** | 5 phút | ~180 VNĐ/SMS | ✅ |
| **Mock** | 0 phút | Free | ❌ |

---

**Chúc bạn setup thành công!** 🚀


