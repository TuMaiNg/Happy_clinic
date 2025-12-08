# Unit Tests - Happy Care Clinic

Hướng dẫn chạy unit tests cho hệ thống Happy Care Clinic.

## 📋 Cấu trúc Tests

### Backend Tests
```
backend/src/tests/
├── unit/
│   ├── appointment.test.ts      # Tests cho appointment booking
│   ├── payment.test.ts          # Tests cho payment service
│   ├── notification.test.ts     # Tests cho notification service
│   └── insurance.test.ts         # Tests cho insurance verification
└── setup.ts                      # Jest setup file
```

### Frontend Tests
```
frontend/src/
├── components/features/appointments/__tests__/
│   ├── BookingWizard.test.tsx    # Tests cho booking wizard
│   └── AppointmentCard.test.tsx  # Tests cho appointment card
└── services/__tests__/
    ├── payment.service.test.ts   # Tests cho payment service
    └── notification.service.test.ts # Tests cho notification service
```

## 🚀 Chạy Tests

### Backend Tests

```bash
cd backend

# Chạy tất cả tests
npm test

# Chạy với coverage
npm test -- --coverage

# Chạy một file test cụ thể
npm test -- appointment.test.ts

# Chạy với watch mode
npm test -- --watch
```

### Frontend Tests

```bash
cd frontend

# Chạy tất cả tests
npm test

# Chạy với coverage
npm test -- --coverage

# Chạy một file test cụ thể
npm test -- BookingWizard.test.tsx

# Chạy với watch mode
npm test -- --watch
```

## 📊 Test Coverage

### Backend Coverage

Các test cases đã được implement:

1. **Appointment Controller** (`appointment.test.ts`)
   - ✅ Tạo appointment thành công với dữ liệu hợp lệ
   - ✅ Từ chối booking trong vòng 2 giờ (lead time)
   - ✅ Từ chối booking khi slot đã đầy
   - ✅ Từ chối duplicate booking
   - ✅ Tính phí hủy 20% nếu < 24h
   - ✅ Không tính phí nếu hủy > 24h
   - ✅ Từ chối hủy appointment không thể hủy
   - ✅ Check-in appointment đã xác nhận
   - ✅ Từ chối check-in appointment chưa xác nhận

2. **Payment Service** (`payment.test.ts`)
   - ✅ Tính phí appointment không có bảo hiểm
   - ✅ Tính phí appointment có bảo hiểm (80%, 50%)
   - ✅ Bỏ qua bảo hiểm không hợp lệ
   - ✅ Tính phí hủy 20% nếu < 24h
   - ✅ Không tính phí nếu hủy > 24h
   - ✅ Xử lý thanh toán tiền mặt
   - ✅ Xử lý thanh toán thẻ tín dụng
   - ✅ Xử lý chuyển khoản ngân hàng
   - ✅ Xử lý thanh toán bảo hiểm
   - ✅ Từ chối phương thức thanh toán không hợp lệ

3. **Notification Service** (`notification.test.ts`)
   - ✅ Gửi reminder email và in-app notification
   - ✅ Xử lý lỗi gửi email gracefully
   - ✅ Tìm và gửi reminders cho appointments 24h trước
   - ✅ Bỏ qua appointments đã có reminder hôm nay
   - ✅ Xử lý lỗi cho từng appointment riêng lẻ
   - ✅ Retry pending notifications
   - ✅ Đánh dấu failed sau 3 lần retry

4. **Insurance Controller** (`insurance.test.ts`)
   - ✅ Xác minh mã bảo hiểm hợp lệ
   - ✅ Từ chối mã bảo hiểm quá ngắn
   - ✅ Từ chối mã bảo hiểm rỗng
   - ✅ Trả về chi tiết coverage

### Frontend Coverage

1. **BookingWizard Component** (`BookingWizard.test.tsx`)
   - ✅ Render step 1: chọn bác sĩ
   - ✅ Filter bác sĩ theo chuyên khoa
   - ✅ Chuyển sang step 2 sau khi chọn bác sĩ
   - ✅ Chuyển sang step 3 sau khi chọn dịch vụ
   - ✅ Load available time slots khi chọn ngày
   - ✅ Hiển thị lỗi khi thiếu thông tin bắt buộc
   - ✅ Submit appointment thành công

2. **AppointmentCard Component** (`AppointmentCard.test.tsx`)
   - ✅ Render appointment details
   - ✅ Hiển thị status badge đúng
   - ✅ Hiển thị cảnh báo phí hủy khi có
   - ✅ Gọi onCancel khi click nút hủy
   - ✅ Gọi onCheckIn khi click nút check-in
   - ✅ Chỉ hiển thị check-in button cho confirmed appointments
   - ✅ Hiển thị màu status khác nhau

3. **Payment Service** (`payment.service.test.ts`)
   - ✅ Tạo payment thành công
   - ✅ Xử lý lỗi tạo payment
   - ✅ Fetch tất cả payments
   - ✅ Fetch payments với filters
   - ✅ Confirm payment

4. **Notification Service** (`notification.service.test.ts`)
   - ✅ Kết nối Socket.IO server
   - ✅ Join user room khi connect
   - ✅ Disconnect socket
   - ✅ Đăng ký notification callback
   - ✅ Fetch tất cả notifications
   - ✅ Đánh dấu notification đã đọc

## 🧪 Test Examples

### Example 1: Test Appointment Booking

```typescript
it('should create appointment with valid data', async () => {
  const appointmentDate = new Date();
  appointmentDate.setHours(appointmentDate.getHours() + 3);

  // ... setup mocks
  await createAppointment(mockRequest, mockResponse);

  expect(AppointmentModel.create).toHaveBeenCalled();
  expect(TimeSlotModel.incrementPatientCount).toHaveBeenCalled();
});
```

### Example 2: Test Payment Fee Calculation

```typescript
it('should calculate correct fee with insurance (80% coverage)', () => {
  const appointment = { service: { price: 200000 } };
  const insurance = { isValid: true, coveragePercent: 80 };

  const fee = paymentService.calculateAppointmentFee(appointment, insurance);

  expect(fee.insuranceCoverage).toBe(160000);
  expect(fee.finalAmount).toBe(40000);
});
```

### Example 3: Test Component Interaction

```typescript
it('should proceed to step 2 after selecting doctor', async () => {
  render(<BookingWizard />);
  
  await waitFor(() => {
    expect(screen.getByText('BS. Nguyễn Văn A')).toBeInTheDocument();
  });

  fireEvent.click(screen.getByText('Chọn bác sĩ →'));

  await waitFor(() => {
    expect(screen.getByText('Chọn dịch vụ')).toBeInTheDocument();
  });
});
```

## 📈 Coverage Goals

- **Backend**: > 80% coverage
- **Frontend**: > 70% coverage
- **Critical Paths**: 100% coverage (booking, payment, cancellation)

## 🔧 Configuration

### Jest Config (Backend)
- Test environment: Node.js
- Coverage: text, lcov, html
- Setup file: `src/tests/setup.ts`

### Jest Config (Frontend)
- Test environment: jsdom
- Setup file: `src/setupTests.ts`
- Mock: window.matchMedia, IntersectionObserver

## 🐛 Debugging Tests

### Backend
```bash
# Run with verbose output
npm test -- --verbose

# Run specific test
npm test -- --testNamePattern="should create appointment"

# Debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Frontend
```bash
# Run with verbose output
npm test -- --verbose

# Run in watch mode
npm test -- --watch

# Debug in Chrome
npm test -- --no-coverage --runInBand
```

## ✅ Best Practices

1. **Isolation**: Mỗi test phải độc lập, không phụ thuộc vào test khác
2. **Mocking**: Mock tất cả external dependencies (database, API, services)
3. **Assertions**: Sử dụng assertions rõ ràng và cụ thể
4. **Coverage**: Đảm bảo test coverage cho critical paths
5. **Naming**: Đặt tên test mô tả rõ ràng hành vi được test

## 📝 Adding New Tests

Khi thêm tính năng mới:

1. Tạo test file trong thư mục `__tests__` tương ứng
2. Viết test cases cho happy path và edge cases
3. Đảm bảo coverage > 80%
4. Chạy tests trước khi commit

## 🚨 Common Issues

### Backend
- **Database connection**: Mock pool.query
- **Date/time**: Sử dụng fixed dates trong tests
- **Async/await**: Đảm bảo await tất cả async operations

### Frontend
- **Router**: Wrap components với BrowserRouter
- **Timers**: Sử dụng fake timers cho time-based tests
- **Async updates**: Sử dụng waitFor cho async updates

---

**Lưu ý**: Tests sử dụng mocks để không cần database/API thật. Đảm bảo mocks được cập nhật khi thay đổi implementation.

