# 🚀 Demo Guide - Happy Care Clinic

## ✅ Servers Status

### Backend Server
- **URL**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health
- **API Docs**: http://localhost:3000/api

### Frontend Server  
- **URL**: http://localhost:3001
- **React App**: http://localhost:3001

## 🧪 Test OTP Flow

### 1. **Open Frontend**
```
http://localhost:3001
```

### 2. **Login/Register as Patient**
- Register new account hoặc login với existing account
- Role: `patient`

### 3. **Book Appointment**
1. Click "Đặt lịch hẹn" hoặc navigate to `/book-appointment`
2. **Step 1**: Chọn bác sĩ
   - Browse doctors
   - Filter by specialty
   - Click "Chọn bác sĩ"
3. **Step 2**: Chọn dịch vụ
   - Select service
   - View price
4. **Step 3**: Chọn ngày & giờ
   - Use calendar to select date
   - Select available time slot
5. **Step 4**: Xác nhận
   - Fill symptoms (optional)
   - Select visit type
   - Click "Xác nhận đặt lịch"

### 4. **OTP Verification**
- After clicking "Xác nhận đặt lịch":
  - OTP modal appears
  - Check **backend console** for OTP code:
    ```
    ✓ OTP sent to 09XX***123: 456789
    ```
  - Enter 6-digit OTP
  - Click "Xác nhận" or auto-submit when all digits filled

### 5. **Success**
- Appointment confirmed
- Success modal shows
- Redirect to appointments page

## 📱 OTP Features to Test

### ✅ OTP Generation
- 6-digit code generated
- Saved to database
- Sent via SMS (mocked - check console)

### ✅ OTP Verification
- Correct OTP → Appointment confirmed
- Wrong OTP → Error message, attempt counter
- 3 failed attempts → Blocked, need resend
- Expired OTP (>5 min) → Need resend

### ✅ OTP Resend
- Click "Gửi lại mã"
- Rate limit: 60 seconds
- New OTP generated and sent

### ✅ Phone Masking
- Phone displayed as: `09XX***123`
- Security feature

## 🔍 Check Backend Console

### OTP Generation
```
✓ OTP sent to 09XX***123: 456789
```

### OTP Verification
```
✓ OTP verified for appointment #123
```

### Appointment Status
```
Appointment #123: pending → confirmed
```

## 🧪 API Endpoints to Test

### 1. Create Appointment (with OTP)
```bash
POST http://localhost:3000/api/appointments
Authorization: Bearer <token>
Body: {
  "doctorId": 1,
  "serviceId": 1,
  "slotId": 1,
  "appointmentDate": "2025-12-10T08:00:00",
  "visitType": "first-visit",
  "symptoms": "Headache"
}

Response: {
  "success": true,
  "data": {
    "appointmentId": 123,
    "requiresOTP": true,
    "phone": "09XX***123",
    "expiresIn": 300
  }
}
```

### 2. Verify OTP
```bash
POST http://localhost:3000/api/appointments/123/verify-otp
Body: {
  "otp": "456789"
}

Response: {
  "success": true,
  "verified": true,
  "message": "Xác nhận thành công!"
}
```

### 3. Resend OTP
```bash
POST http://localhost:3000/api/appointments/123/resend-otp

Response: {
  "success": true,
  "message": "Đã gửi lại mã OTP",
  "phone": "09XX***123"
}
```

### 4. Check OTP Status
```bash
GET http://localhost:3000/api/appointments/123/otp-status

Response: {
  "success": true,
  "data": {
    "verified": false,
    "hasActiveOTP": true,
    "attempts": 0,
    "maxAttempts": 3
  }
}
```

## 🎯 Test Scenarios

### Scenario 1: Successful Booking
1. Book appointment
2. Get OTP from console
3. Enter correct OTP
4. ✅ Appointment confirmed

### Scenario 2: Wrong OTP
1. Book appointment
2. Enter wrong OTP
3. See error: "Mã không đúng. Còn 2 lần thử."
4. Try again (max 3 attempts)

### Scenario 3: Expired OTP
1. Book appointment
2. Wait 5+ minutes
3. Try to verify
4. See error: "Mã đã hết hạn"
5. Click "Gửi lại mã"

### Scenario 4: Rate Limit
1. Book appointment
2. Click "Gửi lại mã" immediately
3. See error: "Vui lòng đợi X giây"
4. Wait 60 seconds
5. Resend works

## 📊 Database Check

### Check OTP Records
```sql
SELECT * FROM appointment_otp 
WHERE appointment_id = 123
ORDER BY created_at DESC;
```

### Check Appointment Status
```sql
SELECT id, status, created_at, confirmed_at 
FROM appointments 
WHERE id = 123;
```

## 🐛 Troubleshooting

### OTP Not Received
- Check backend console for OTP code
- SMS is mocked, so OTP appears in console only

### OTP Verification Fails
- Check OTP hasn't expired (5 min)
- Check attempts < 3
- Verify OTP code matches console

### Frontend Not Loading
- Check port 3001 is available
- Check backend is running on 3000
- Check CORS settings

### Backend Errors
- Check database connection
- Check `.env` file exists
- Check `appointment_otp` table exists

## 🎉 Success Indicators

✅ Backend running on port 3000
✅ Frontend running on port 3001
✅ OTP modal appears after booking
✅ OTP code visible in backend console
✅ OTP verification works
✅ Appointment status changes to "confirmed"
✅ Success modal shows

---

**Happy Testing! 🚀**


