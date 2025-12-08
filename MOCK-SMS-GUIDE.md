# 📱 Mock SMS Guide - Hướng dẫn dùng Mock SMS

## ✅ Mock SMS đã hoạt động sẵn!

**Không cần setup gì cả!** Mock SMS đã được cấu hình mặc định.

---

## 🎯 Cách hoạt động

### Khi không có Twilio credentials:

1. **SMS sẽ KHÔNG gửi thật**
2. **Chỉ log ra console** (backend terminal)
3. **OTP sẽ hiển thị** trong console log

### Ví dụ:

Khi patient đặt lịch và nhận OTP, bạn sẽ thấy trong **backend console**:

```
📱 SMS (mock) to 09XX***123: Happy Care - Mã xác nhận đặt lịch: 456789. Có hiệu lực trong 5 phút.
✓ OTP sent to 09XX***123: 456789
```

**→ Dùng mã `456789` này để nhập vào frontend!**

---

## 🔍 Xem OTP ở đâu?

### Bước 1: Start backend

```bash
cd backend
npm run dev
```

### Bước 2: Đặt lịch hẹn

1. Vào frontend
2. Đặt lịch hẹn
3. Nhập số điện thoại
4. Click "Xác nhận đặt lịch"

### Bước 3: Xem console

**Backend terminal sẽ hiển thị:**

```
📱 SMS (mock) to 09XX***123: Happy Care - Mã xác nhận đặt lịch: 456789. Có hiệu lực trong 5 phút.
✓ OTP sent to 09XX***123: 456789
```

**→ Copy mã `456789` và nhập vào frontend!**

---

## 📋 Cấu hình Mock SMS

### Option 1: Không cấu hình gì (Mặc định)

**File**: `backend/.env`

```env
# Không cần thêm gì cả
# Hoặc để trống:
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

**→ Mock SMS sẽ tự động hoạt động!**

### Option 2: Explicit config (Tùy chọn)

**File**: `backend/.env`

```env
# Explicit disable Twilio
SMS_ENABLED=false
SMS_PROVIDER=mock
```

---

## 🎯 Khi nào dùng Mock?

### ✅ Dùng Mock khi:

1. **Development/Testing**
   - Không cần SMS thật
   - Chỉ test logic
   - Tiết kiệm chi phí

2. **Local development**
   - Làm việc trên máy local
   - Không cần setup Twilio

3. **Demo/Presentation**
   - Demo cho khách hàng
   - OTP hiển thị trong console

### ❌ KHÔNG dùng Mock khi:

1. **Production**
   - Cần SMS thật đến customer
   - Phải setup Twilio hoặc Viettel

2. **Staging/Testing thật**
   - Cần test SMS flow thật
   - Verify SMS có đến không

---

## 📊 So sánh Mock vs Twilio

| Feature | Mock | Twilio |
|---------|------|--------|
| **Setup** | ✅ 0 phút | ⚠️ 5 phút |
| **Cost** | ✅ Free | ⚠️ ~180 VNĐ/SMS |
| **SMS thật** | ❌ Không | ✅ Có |
| **OTP location** | Console log | SMS đến phone |
| **Phù hợp** | Development | Production |

---

## 🔧 Cách test Mock SMS

### Test 1: Đặt lịch hẹn

1. **Start backend**: `npm run dev`
2. **Start frontend**: `npm start`
3. **Đặt lịch hẹn** với số điện thoại bất kỳ
4. **Xem console** backend → Copy OTP
5. **Nhập OTP** vào frontend

### Test 2: Xem log format

**Console output:**
```
📱 SMS (mock) to 09XX***123: Happy Care - Mã xác nhận đặt lịch: 456789. Có hiệu lực trong 5 phút.
```

**Format:**
- `09XX***123`: Số điện thoại đã mask
- `456789`: Mã OTP (6 số)
- Message: Nội dung SMS

---

## 💡 Tips

### 1. Luôn check console khi test

**Backend terminal** là nơi bạn sẽ thấy OTP!

### 2. OTP format

- **6 số**: `123456`
- **Expires**: 5 phút
- **Attempts**: Tối đa 3 lần

### 3. Resend OTP

- Click "Gửi lại mã" trong frontend
- OTP mới sẽ hiển thị trong console

### 4. Multiple OTPs

Nếu có nhiều OTP trong console:
- **Lấy OTP mới nhất** (dòng cuối cùng)
- OTP cũ đã hết hạn

---

## 🚀 Quick Start

### Không cần làm gì cả!

1. ✅ **Mock SMS đã hoạt động sẵn**
2. ✅ **Không cần config `.env`**
3. ✅ **Chỉ cần start backend**
4. ✅ **Xem OTP trong console**

---

## 📝 Example Console Output

```
🚀 Server running on port 3000
📍 Environment: development
🔗 API: http://localhost:3000/api
⚠️ SMS Service: No credentials found, using mock mode
✅ Database connected

... (khi có request đặt lịch) ...

📱 SMS (mock) to 09XX***123: Happy Care - Mã xác nhận đặt lịch: 456789. Có hiệu lực trong 5 phút.
✓ OTP sent to 09XX***123: 456789
```

---

## ⚠️ Lưu ý

1. ✅ **Mock SMS KHÔNG gửi SMS thật**
   - Chỉ log ra console
   - Customer KHÔNG nhận được SMS

2. ✅ **Chỉ dùng cho Development**
   - Production phải dùng Twilio hoặc Viettel

3. ✅ **OTP vẫn hoạt động bình thường**
   - Logic verify OTP vẫn đúng
   - Chỉ khác là không gửi SMS thật

---

## 🎉 Kết luận

**Mock SMS = Đơn giản nhất!**

- ✅ Không cần setup
- ✅ Không tốn phí
- ✅ Đủ cho development
- ✅ OTP hiển thị trong console

**Chỉ cần:**
1. Start backend
2. Đặt lịch hẹn
3. Xem console → Copy OTP
4. Nhập vào frontend

**Xong!** 🚀


