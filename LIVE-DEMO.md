# 🎉 Live Demo - Happy Care Clinic

## ✅ **SERVERS ARE RUNNING!**

### Backend Server
- **URL**: http://localhost:3000
- **Status**: ✅ **RUNNING**
- **Process ID**: 24384
- **Port**: 3000 (LISTENING)

### Frontend Server
- **URL**: http://localhost:3001  
- **Status**: ✅ **RUNNING**
- **Port**: 3001

## ✅ **API Endpoints Tested**

### ✅ Doctors API
```
GET http://localhost:3000/api/doctors
Status: 200 OK
Response: { success: true, data: [4 doctors] }
```

### ✅ Services API
```
GET http://localhost:3000/api/services
Status: 200 OK
Response: { success: true, data: [8 services] }
```

### ✅ Health Check
```
GET http://localhost:3000/health
Status: 200 OK
Response: { status: 'ok', database: 'connected' }
```

## 🚀 **READY TO TEST!**

### Step 1: Open Frontend
```
👉 http://localhost:3001
```

### Step 2: Login/Register
- Create new patient account
- Or login with existing credentials

### Step 3: Book Appointment
1. Click **"Đặt lịch hẹn"** or navigate to `/book-appointment`
2. **Step 1**: Select Doctor
   - Browse 4 available doctors
   - Filter by specialty
   - Click "Chọn bác sĩ"
3. **Step 2**: Select Service
   - Choose from 8 services
   - View pricing
4. **Step 3**: Select Date & Time
   - Use beautiful calendar component
   - Select available time slot
   - See remaining slots count
5. **Step 4**: Confirm
   - Fill symptoms (optional)
   - Select visit type
   - Click **"Xác nhận đặt lịch"**

### Step 4: OTP Verification
1. **OTP Modal** appears automatically
2. **Check Backend Console** (PowerShell window):
   ```
   ✓ OTP sent to 09XX***123: 456789
   ```
3. **Enter OTP**:
   - 6-digit code from console
   - Auto-focus between inputs
   - Auto-submit when complete
4. **Click "Xác nhận"** or wait for auto-submit

### Step 5: Success!
- ✅ Appointment confirmed
- ✅ Success modal shows appointment details
- ✅ Redirect to appointments page

## 📊 **What to Watch**

### Backend Console (PowerShell)
Look for:
```
🚀 Server running on port 3000
✅ Database connected successfully
✓ OTP sent to 09XX***123: 456789
📨 Notification sent to user 1
Appointment #123 created
```

### Frontend Browser Console
- No errors
- API calls successful
- OTP modal appears

## 🎯 **Test Scenarios**

### ✅ Scenario 1: Successful Booking
1. Book appointment
2. Get OTP from backend console
3. Enter correct OTP
4. ✅ Appointment confirmed

### ✅ Scenario 2: Wrong OTP
1. Book appointment
2. Enter wrong OTP
3. See error: "Mã không đúng. Còn 2 lần thử."
4. Try again (max 3 attempts)

### ✅ Scenario 3: Resend OTP
1. Book appointment
2. Click "Gửi lại mã"
3. Wait 60 seconds (rate limit)
4. New OTP sent

## 🔍 **Features to Test**

### ✅ Calendar Component
- Beautiful date picker
- Shows available dates
- Highlights today
- Shows selected date

### ✅ Time Slot Selection
- Grid layout
- Shows remaining slots
- Disabled when full
- Visual feedback

### ✅ OTP Verification
- 6-digit input
- Auto-focus
- Paste support
- Countdown timer
- Resend button
- Error handling

## 📝 **Quick Commands**

### Check Backend
```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/doctors
curl http://localhost:3000/api/services
```

### Check Frontend
```
Open: http://localhost:3001
```

## 🐛 **If Something Goes Wrong**

### OTP Not Appearing
- Check backend console for OTP code
- Check `appointment_otp` table exists
- Run: `backend/CREATE-OTP-TABLE-MANUAL.sql`

### Frontend Errors
- Check browser console
- Verify backend is running
- Check CORS settings

### Backend Errors
- Check PowerShell console
- Verify database connection
- Check `.env` file

---

## 🎉 **EVERYTHING IS READY!**

**Backend**: ✅ Running on port 3000
**Frontend**: ✅ Running on port 3001
**APIs**: ✅ Tested and working
**OTP Flow**: ✅ Ready to test

**👉 Open http://localhost:3001 and start testing!**


