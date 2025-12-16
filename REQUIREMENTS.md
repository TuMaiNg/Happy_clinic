# 📋 Danh Sách Yêu Cầu Cần Thiết Cho Happy Care Clinic

## 🖥️ 1. YÊU CẦU HỆ THỐNG (System Requirements)

### Backend
- **Node.js**: >= 18.x
- **npm** hoặc **yarn**: Package manager
- **TypeScript**: ^5.3.3
- **MySQL**: >= 8.0
- **Port**: 3000 (mặc định)

### Frontend
- **Node.js**: >= 18.x
- **npm** hoặc **yarn**: Package manager
- **React**: ^18.3.1
- **TypeScript**: ^4.9.5
- **Port**: 3001 (mặc định)

### Database
- **MySQL Server**: >= 8.0
- **Database Name**: `clinic_booking`
- **Character Set**: UTF-8 (utf8mb4)
- **Timezone**: +07:00 (Vietnam)

---

## 📦 2. DEPENDENCIES & PACKAGES

### Backend Dependencies

#### Core
- `express`: ^4.18.2 - Web framework
- `mysql2`: ^3.6.5 - MySQL driver
- `typescript`: ^5.3.3 - TypeScript compiler
- `dotenv`: ^16.3.1 - Environment variables

#### Authentication & Security
- `jsonwebtoken`: ^9.0.2 - JWT tokens
- `bcrypt`: ^5.1.1 - Password hashing
- `helmet`: ^7.1.0 - Security headers
- `cors`: ^2.8.5 - CORS middleware

#### Validation & Middleware
- `express-validator`: ^7.0.1 - Request validation
- `morgan`: ^1.10.0 - HTTP logger
- `compression`: ^1.7.4 - Response compression

#### Notifications
- `nodemailer`: ^6.9.7 - Email service
- `twilio`: ^4.20.0 - SMS service
- `socket.io`: ^4.7.2 - Real-time communication

#### Utilities
- `date-fns`: ^3.0.6 - Date manipulation
- `node-cron`: ^4.2.1 - Scheduled tasks
- `pdfkit`: ^0.14.0 - PDF generation
- `googleapis`: ^167.0.0 - Google API integration
- `google-auth-library`: ^10.5.0 - Google OAuth

### Frontend Dependencies

#### Core
- `react`: ^18.3.1 - UI library
- `react-dom`: ^18.3.1 - React DOM renderer
- `react-router-dom`: ^7.10.1 - Routing
- `typescript`: ^4.9.5 - TypeScript

#### HTTP & Real-time
- `axios`: ^1.13.2 - HTTP client
- `socket.io-client`: ^4.8.1 - WebSocket client

#### UI Components
- `@headlessui/react`: ^2.2.9 - Headless UI components
- `@heroicons/react`: ^2.2.0 - Icon library
- `tailwindcss`: ^3.4.18 - CSS framework

#### Utilities
- `date-fns`: ^4.1.0 - Date manipulation

#### Testing
- `@testing-library/react`: ^16.3.0
- `@testing-library/jest-dom`: ^6.9.1
- `@testing-library/user-event`: ^13.5.0
- `jest`: Testing framework

---

## 🗄️ 3. DATABASE SCHEMA (14 Bảng)

### Core Tables
1. **users** - Tài khoản người dùng
   - id, email, password_hash, role, status, created_at, updated_at

2. **patients** - Thông tin bệnh nhân
   - id, user_id, full_name, phone, email, birthday, gender, address, insurance_number, medical_history

3. **doctors** - Thông tin bác sĩ
   - id, user_id, full_name, speciality, description, experience_years, license_number, avatar

4. **staff** - Thông tin nhân viên
   - id, user_id, full_name, phone, email, position, department

5. **clinic_info** - Thông tin phòng khám
   - id, name, address, phone, email, working_hours, description

### Business Tables
6. **services** - Dịch vụ khám bệnh
   - id, name, description, price, duration_minutes, status

7. **doctor_services** - Dịch vụ của bác sĩ
   - id, doctor_id, service_id

8. **doctor_schedules** - Lịch làm việc của bác sĩ
   - id, doctor_id, day_of_week, start_time, end_time, is_available

9. **time_slots** - Khung giờ khám
   - id, schedule_id, start_time, end_time, patient_count, capacity, is_available

10. **appointments** - Lịch hẹn
    - id, patient_id, doctor_id, service_id, slot_id, schedule_id, appointment_date, start_time, end_time, visit_type, symptoms, status, created_at, updated_at

11. **payments** - Thanh toán
    - id, appointment_id, amount, payment_method, status, transaction_id, paid_at

12. **notifications** - Thông báo
    - id, user_id, type, title, message, is_read, created_at

13. **system_config** - Cấu hình hệ thống
    - id, key, value, description

14. **audit_logs** - Nhật ký hoạt động
    - id, user_id, action, table_name, record_id, old_values, new_values, ip_address, created_at

---

## 🔐 4. ENVIRONMENT VARIABLES

### Backend (.env)

#### Database
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=clinic_booking
DB_USER=root
DB_PASSWORD=your_password
```

#### JWT
```env
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_REFRESH_SECRET=your_super_secret_refresh_key_min_32_chars
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
```

#### Server
```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3001
```

#### Email (SMTP)
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=Happy Care Clinic <noreply@happycareclinic.com>
EMAIL_USE_OAUTH2=false
GOOGLE_OAUTH2_CREDENTIALS_PATH=credentials/google-oauth.json
```

#### Google OAuth (Optional)
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

#### SMS (Twilio/Viettel)
```env
SMS_ENABLED=false
SMS_PROVIDER=mock
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
VIETTEL_API_KEY=your_viettel_api_key
VIETTEL_API_SECRET=your_viettel_api_secret
VIETTEL_BRANDNAME=your_brandname
VIETTEL_ENDPOINT=https://api.viettelpost.vn
```

#### Business Rules
```env
MIN_LEAD_TIME_HOURS=2
CANCELLATION_FEE_PERCENT=20
NO_SHOW_FEE_PERCENT=100
MAX_BOOKING_DAYS_AHEAD=30
SLOT_DURATION_MINUTES=30
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:3000/api
```

---

## 🛣️ 5. API ENDPOINTS

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Đăng ký tài khoản
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/forgot-password` - Quên mật khẩu
- `POST /api/auth/reset-password` - Đặt lại mật khẩu
- `GET /api/auth/me` - Lấy thông tin user hiện tại
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback

### Appointments (`/api/appointments`)
- `GET /api/appointments` - Lấy danh sách lịch hẹn (có filter)
- `GET /api/appointments/:id` - Chi tiết lịch hẹn
- `POST /api/appointments` - Tạo lịch hẹn mới
- `PUT /api/appointments/:id` - Cập nhật lịch hẹn
- `PUT /api/appointments/:id/cancel` - Hủy lịch hẹn
- `PUT /api/appointments/:id/confirm` - Xác nhận lịch hẹn (staff/admin)
- `PUT /api/appointments/:id/reject` - Từ chối lịch hẹn (staff/admin)
- `PUT /api/appointments/:id/check-in` - Check-in lịch hẹn
- `PUT /api/appointments/:id/complete` - Hoàn thành lịch hẹn (doctor)

### Doctors (`/api/doctors`)
- `GET /api/doctors` - Lấy danh sách bác sĩ
- `GET /api/doctors/:id` - Chi tiết bác sĩ
- `POST /api/doctors` - Tạo bác sĩ (admin/staff)
- `PUT /api/doctors/:id` - Cập nhật bác sĩ (admin/staff)
- `DELETE /api/doctors/:id` - Xóa bác sĩ (admin)

### Services (`/api/services`)
- `GET /api/services` - Lấy danh sách dịch vụ
- `GET /api/services/:id` - Chi tiết dịch vụ
- `POST /api/services` - Tạo dịch vụ (admin/staff)
- `PUT /api/services/:id` - Cập nhật dịch vụ (admin/staff)
- `DELETE /api/services/:id` - Xóa dịch vụ (admin)

### Time Slots (`/api/timeslots`)
- `GET /api/timeslots/available` - Lấy khung giờ trống
- `GET /api/timeslots` - Lấy tất cả khung giờ (admin/staff)

### Schedules (`/api/schedules`)
- `GET /api/schedules` - Lấy lịch làm việc
- `GET /api/schedules/doctor/:doctorId` - Lịch làm việc của bác sĩ
- `POST /api/schedules` - Tạo lịch làm việc (admin/staff/doctor)
- `PUT /api/schedules/:id` - Cập nhật lịch làm việc
- `DELETE /api/schedules/:id` - Xóa lịch làm việc

### Patients (`/api/patients`)
- `GET /api/patients` - Lấy danh sách bệnh nhân (staff/admin)
- `GET /api/patients/:id` - Chi tiết bệnh nhân
- `PUT /api/patients/:id` - Cập nhật thông tin bệnh nhân

### Payments (`/api/payments`)
- `GET /api/payments` - Lấy lịch sử thanh toán
- `GET /api/payments/:id` - Chi tiết thanh toán
- `POST /api/payments` - Tạo thanh toán
- `PUT /api/payments/:id/confirm` - Xác nhận thanh toán

### Notifications (`/api/notifications`)
- `GET /api/notifications` - Lấy thông báo
- `GET /api/notifications/unread` - Lấy thông báo chưa đọc
- `GET /api/notifications/count` - Đếm thông báo chưa đọc
- `PUT /api/notifications/:id/read` - Đánh dấu đã đọc
- `PUT /api/notifications/read-all` - Đánh dấu tất cả đã đọc

### Config (`/api/config`)
- `GET /api/config` - Lấy cấu hình hệ thống
- `PUT /api/config/:key` - Cập nhật cấu hình (admin)

### Reports (`/api/reports`)
- `GET /api/reports/appointments` - Báo cáo lịch hẹn
- `GET /api/reports/revenue` - Báo cáo doanh thu
- `GET /api/reports/doctors` - Báo cáo bác sĩ

### Audit Logs (`/api/audit`)
- `GET /api/audit` - Lấy nhật ký hoạt động (admin)

### OTP (`/api/otp`)
- `POST /api/otp/send` - Gửi OTP
- `POST /api/otp/verify` - Xác thực OTP

---

## 👥 6. USER ROLES & PERMISSIONS

### Patient (Bệnh nhân)
- ✅ Đăng ký/Đăng nhập
- ✅ Xem thông tin cá nhân
- ✅ Đặt lịch hẹn
- ✅ Xem lịch hẹn của mình
- ✅ Hủy lịch hẹn của mình
- ✅ Thanh toán
- ✅ Xem thông báo
- ✅ Xem lịch sử khám bệnh

### Doctor (Bác sĩ)
- ✅ Đăng nhập
- ✅ Xem lịch hẹn hôm nay
- ✅ Xem lịch hẹn sắp tới
- ✅ Quản lý lịch làm việc
- ✅ Hoàn thành lịch hẹn
- ✅ Xem thông tin bệnh nhân
- ✅ Xem thông báo

### Staff (Nhân viên/Lễ tân)
- ✅ Đăng nhập
- ✅ Xem tất cả lịch hẹn
- ✅ Xác nhận/Từ chối lịch hẹn
- ✅ Check-in bệnh nhân
- ✅ Quản lý bệnh nhân
- ✅ Quản lý bác sĩ
- ✅ Quản lý dịch vụ
- ✅ Tạo lịch hẹn cho bệnh nhân
- ✅ Xem thông báo

### Admin (Quản trị viên)
- ✅ Tất cả quyền của Staff
- ✅ Xóa bác sĩ
- ✅ Xóa dịch vụ
- ✅ Quản lý nhân viên
- ✅ Xem báo cáo & thống kê
- ✅ Cấu hình hệ thống
- ✅ Xem audit logs

---

## 🎨 7. DESIGN SYSTEM

### Màu sắc (Color Palette)
- **Primary Blue**: `#0066CC` - Tin cậy, chuyên nghiệp
- **Primary Green**: `#00A86B` - Sức khỏe, chữa lành
- **Accent Teal**: `#20B2AA` - Y tế, hiện đại
- **Success**: `#00C853` - Thành công
- **Warning**: `#FFA726` - Cảnh báo
- **Error**: `#F44336` - Lỗi
- **Info**: `#2196F3` - Thông tin

### Typography
- **Font Family**: Inter, SF Pro Display, system-ui
- **Font Size**: 12px, 14px, 16px, 18px, 24px, 32px
- **Font Weight**: 400 (Regular), 500 (Medium), 600 (Semi-bold), 700 (Bold)
- **Line Height**: 1.5, 1.6
- **Character Encoding**: UTF-8 (hỗ trợ tiếng Việt đầy đủ)

### Spacing
- **Base Unit**: 4px
- **Spacing Scale**: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px

### Breakpoints (Responsive)
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

---

## 🔔 8. NOTIFICATION TYPES

### Email Notifications
- Đăng ký thành công
- Xác nhận đặt lịch
- Nhắc nhở lịch hẹn (24h trước)
- Hủy lịch hẹn
- Thay đổi lịch hẹn
- Thanh toán thành công

### SMS Notifications (Optional)
- Xác nhận đặt lịch
- Nhắc nhở lịch hẹn (24h trước)
- Hủy lịch hẹn

### In-App Notifications (Socket.IO)
- Lịch hẹn mới
- Xác nhận/Từ chối lịch hẹn
- Thông báo hệ thống
- Cập nhật trạng thái lịch hẹn

---

## 💳 9. PAYMENT METHODS

1. **Tiền mặt** (Cash)
2. **Thẻ tín dụng/Ghi nợ** (Credit/Debit Card)
3. **Chuyển khoản** (Bank Transfer)
4. **Bảo hiểm y tế** (Insurance)

### Payment Status
- `pending` - Chờ thanh toán
- `paid` - Đã thanh toán
- `refunded` - Đã hoàn tiền
- `failed` - Thanh toán thất bại

---

## 📊 10. BUSINESS RULES

### Appointment Rules
- **Lead Time**: Tối thiểu 2 giờ trước lịch hẹn
- **Max Booking Ahead**: Tối đa 30 ngày trước
- **Slot Duration**: 30 phút mỗi khung giờ
- **Cancellation Fee**: 20% nếu hủy < 24h trước lịch hẹn
- **No-show Penalty**: 100% phí dịch vụ

### Appointment Status Flow
1. `pending` → Chờ xác nhận
2. `confirmed` → Đã xác nhận
3. `checked-in` → Đã check-in
4. `completed` → Đã hoàn thành
5. `cancelled` → Đã hủy
6. `rejected` → Đã từ chối
7. `no-show` → Không đến

### Visit Types
- `first-visit` - Khám lần đầu
- `follow-up` - Tái khám

---

## 🧪 11. TESTING REQUIREMENTS

### Backend Tests
- Unit tests cho Models
- Integration tests cho Controllers
- API endpoint tests
- Database transaction tests
- Authentication & Authorization tests

### Frontend Tests
- Component unit tests
- Integration tests
- User interaction tests
- Routing tests
- API service tests

### Test Coverage Target
- **Minimum**: 70%
- **Recommended**: 80%+

---

## 🚀 12. DEPLOYMENT REQUIREMENTS

### Production Environment
- **Node.js**: >= 18.x (LTS)
- **MySQL**: >= 8.0
- **SSL/HTTPS**: Required
- **Domain**: Custom domain với SSL certificate
- **Process Manager**: PM2 hoặc systemd
- **Reverse Proxy**: Nginx hoặc Apache

### Security Checklist
- [ ] JWT secrets phải đủ mạnh (min 32 ký tự)
- [ ] Database password phải mạnh
- [ ] CORS chỉ cho phép domain production
- [ ] Helmet.js enabled
- [ ] Rate limiting enabled
- [ ] Input validation cho tất cả endpoints
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] HTTPS only
- [ ] Environment variables không commit lên git

### Monitoring & Logging
- [ ] Error logging (Winston, Morgan)
- [ ] Application monitoring (PM2, New Relic, etc.)
- [ ] Database monitoring
- [ ] Uptime monitoring
- [ ] Performance monitoring

### Backup
- [ ] Database backup hàng ngày
- [ ] File backup (nếu có upload)
- [ ] Backup retention policy

---

## 📱 13. BROWSER SUPPORT

### Desktop
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

### Mobile
- iOS Safari (latest 2 versions)
- Chrome Mobile (latest 2 versions)
- Samsung Internet (latest 2 versions)

---

## 📝 14. DOCUMENTATION NEEDED

- [ ] API Documentation (Swagger/OpenAPI)
- [ ] Database Schema Documentation
- [ ] Setup Guide
- [ ] Deployment Guide
- [ ] User Manual
- [ ] Admin Manual
- [ ] Developer Guide
- [ ] Troubleshooting Guide

---

## 🔧 15. DEVELOPMENT TOOLS

### Recommended IDE/Editors
- Visual Studio Code
- WebStorm
- Sublime Text

### Recommended Extensions (VS Code)
- ESLint
- Prettier
- TypeScript
- MySQL
- GitLens
- REST Client

### Version Control
- Git
- GitHub/GitLab/Bitbucket

### Database Tools
- MySQL Workbench
- phpMyAdmin
- DBeaver
- TablePlus

---

## ✅ 16. CHECKLIST TRƯỚC KHI DEPLOY

### Backend
- [ ] Tất cả environment variables đã được cấu hình
- [ ] Database đã được tạo và migrate
- [ ] JWT secrets đã được set
- [ ] Email service đã được cấu hình (nếu dùng)
- [ ] SMS service đã được cấu hình (nếu dùng)
- [ ] CORS đã được cấu hình đúng
- [ ] Error handling đã được test
- [ ] Logging đã được setup
- [ ] Tests đã pass

### Frontend
- [ ] API URL đã được cấu hình đúng
- [ ] Build thành công không có lỗi
- [ ] Responsive design đã được test
- [ ] Cross-browser testing đã pass
- [ ] Performance optimization đã được thực hiện

### Database
- [ ] Tất cả tables đã được tạo
- [ ] Indexes đã được tạo cho các cột thường query
- [ ] Foreign keys đã được set
- [ ] Backup strategy đã được setup

### Security
- [ ] Passwords đã được hash
- [ ] JWT tokens đã được validate
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Rate limiting

---

## 📞 17. SUPPORT & MAINTENANCE

### Regular Maintenance Tasks
- Database optimization (hàng tuần)
- Log rotation (hàng ngày)
- Backup verification (hàng tuần)
- Security updates (hàng tháng)
- Dependency updates (hàng quý)
- Performance monitoring (liên tục)

---

**Lưu ý**: Đây là danh sách tổng hợp các yêu cầu cần thiết cho hệ thống Happy Care Clinic. Một số mục có thể tùy chọn tùy theo nhu cầu cụ thể của phòng khám.

