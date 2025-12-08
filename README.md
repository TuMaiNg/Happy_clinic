# Happy Care Clinic - Hệ thống đặt lịch khám bệnh

Hệ thống đặt lịch khám bệnh chuyên nghiệp với đầy đủ tính năng cho phòng khám tư nhân.

## 🎨 Design System

### Màu sắc chuyên nghiệp
- **Primary Blue**: #0066CC (tin cậy, chuyên nghiệp)
- **Primary Green**: #00A86B (sức khỏe, chữa lành)
- **Accent Teal**: #20B2AA (y tế, hiện đại)
- **Status Colors**: Success (#00C853), Warning (#FFA726), Error (#F44336), Info (#2196F3)

### Typography
- **Font**: Inter, SF Pro Display
- **Hỗ trợ tiếng Việt**: UTF-8 đầy đủ dấu

## 🚀 Tính năng chính

### Cho Bệnh nhân
- ✅ Đăng ký/Đăng nhập với JWT
- ✅ Đặt lịch hẹn (4 bước: Chọn bác sĩ → Dịch vụ → Ngày giờ → Xác nhận)
- ✅ Quản lý lịch hẹn (Xem, Hủy, Đổi lịch, Check-in)
- ✅ Thanh toán (Tiền mặt, Thẻ, Chuyển khoản, Bảo hiểm)
- ✅ Thông báo real-time (Email, SMS, In-app)
- ✅ Xem lịch sử khám bệnh

### Cho Bác sĩ
- ✅ Quản lý lịch làm việc
- ✅ Xem lịch hẹn hôm nay/upcoming
- ✅ Quản lý bệnh nhân
- ✅ Hoàn thành lịch hẹn

### Cho Nhân viên/Admin
- ✅ Quản lý tất cả lịch hẹn
- ✅ Quản lý bệnh nhân
- ✅ Quản lý bác sĩ
- ✅ Quản lý dịch vụ
- ✅ Báo cáo & Thống kê
- ✅ Cấu hình hệ thống

## 📋 Yêu cầu hệ thống

- Node.js >= 18.x
- MySQL >= 8.0
- npm hoặc yarn

## 🔧 Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd clinic-booking
```

### 2. Cài đặt Backend

```bash
cd backend
npm install

# Tạo file .env
cp .env.example .env

# Cấu hình database trong .env
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=clinic_booking
# JWT_SECRET=your_secret_key
# PORT=3000
```

### 3. Cài đặt Frontend

```bash
cd ../frontend
npm install

# Tạo file .env
echo "REACT_APP_API_URL=http://localhost:3000/api" > .env
```

### 4. Khởi tạo Database

Đảm bảo MySQL đã chạy và database `clinic_booking` đã được tạo với 14 bảng:
- users, clinic_info, system_config, staff, doctors, patients
- services, doctor_services, doctor_schedules, time_slots
- appointments, payments, notifications, audit_logs

## 🏃 Chạy ứng dụng

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend sẽ chạy tại: `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```
Frontend sẽ chạy tại: `http://localhost:3001`

### Production Mode

**Build Backend:**
```bash
cd backend
npm run build
npm start
```

**Build Frontend:**
```bash
cd frontend
npm run build
# Serve với nginx hoặc serve static files
```

## 📁 Cấu trúc dự án

```
clinic-booking/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, JWT, env config
│   │   ├── controllers/     # API controllers
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic (email, SMS, payment)
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── jobs/            # Cron jobs (reminders)
│   │   └── server.ts        # Entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── common/      # Button, Input, Card, Modal
│   │   │   ├── layout/      # Header, Layout
│   │   │   └── features/   # BookingWizard, AppointmentCard, etc.
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── contexts/        # React Context (Auth)
│   │   └── App.tsx
│   └── package.json
│
└── README.md
```

## 🔐 Authentication

- JWT tokens với expiration
- Role-based access control (RBAC)
- Password hashing với bcrypt

## 📧 Notifications

- **Email**: Nodemailer (SMTP)
- **SMS**: Twilio (mock trong dev)
- **In-app**: Socket.IO real-time
- **Cron Jobs**: Tự động gửi nhắc nhở 24h trước lịch hẹn

## 💳 Payment

- Tính phí hủy (20% nếu < 24h)
- Hỗ trợ: Tiền mặt, Thẻ, Chuyển khoản, Bảo hiểm
- Mock payment processing (có thể tích hợp Stripe/VietQR)

## 📊 Business Rules

- **Lead Time**: Tối thiểu 2 giờ trước lịch hẹn
- **Cancellation Fee**: 20% nếu hủy < 24h
- **No-show Penalty**: 100% phí dịch vụ
- **Slot Duration**: 30 phút
- **Max Booking Ahead**: 30 ngày

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📝 API Documentation

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/forgot-password` - Quên mật khẩu

### Appointments
- `GET /api/appointments` - Lấy danh sách lịch hẹn
- `POST /api/appointments` - Tạo lịch hẹn
- `PUT /api/appointments/:id/cancel` - Hủy lịch hẹn
- `PUT /api/appointments/:id/check-in` - Check-in

### Doctors
- `GET /api/doctors` - Lấy danh sách bác sĩ
- `GET /api/doctors/:id` - Chi tiết bác sĩ

### Services
- `GET /api/services` - Lấy danh sách dịch vụ

### Time Slots
- `GET /api/timeslots/available` - Lấy khung giờ trống

### Payments
- `POST /api/payments` - Tạo thanh toán
- `GET /api/payments` - Lấy lịch sử thanh toán

### Notifications
- `GET /api/notifications` - Lấy thông báo
- `PUT /api/notifications/:id/read` - Đánh dấu đã đọc

## 🐛 Troubleshooting

### Lỗi kết nối database
- Kiểm tra MySQL đã chạy chưa
- Kiểm tra thông tin trong `.env` backend
- Đảm bảo database `clinic_booking` đã được tạo

### Lỗi CORS
- Kiểm tra `REACT_APP_API_URL` trong frontend `.env`
- Kiểm tra CORS config trong `backend/src/server.ts`

### Lỗi Socket.IO
- Đảm bảo backend đã khởi động
- Kiểm tra kết nối trong browser console

## 📄 License

ISC

## 👥 Contributors

Happy Care Clinic Development Team

---

**Lưu ý**: Đây là phiên bản development. Để deploy production, cần:
1. Cấu hình SMTP thật cho email
2. Tích hợp Twilio thật cho SMS
3. Tích hợp payment gateway thật (Stripe/VietQR)
4. Setup SSL/HTTPS
5. Cấu hình firewall và security
6. Setup monitoring và logging
