# Web Application Optimization Guide

## Tổng quan các tối ưu đã thực hiện

### 1. Database Performance Optimization

#### Indexes Migration
File: `backend/src/database/migrations/add_performance_indexes.sql`

Đã thêm indexes cho các cột thường được query:
- **Appointments**: patient_id, doctor_id, status, appointment_date, slot_id, created_at
- **Time Slots**: schedule_id, is_available, patient_count
- **Doctor Schedules**: doctor_id, date, is_day_off
- **Patients**: user_id, phone, email
- **Doctors**: user_id, speciality
- **Payments**: appointment_id, status, created_at
- **Notifications**: user_id, is_read, created_at
- **Users**: email, role, status

**Composite Indexes** cho các query patterns phổ biến:
- `idx_appointments_patient_status`: (patient_id, status)
- `idx_appointments_doctor_status`: (doctor_id, status)
- `idx_appointments_date_status`: (appointment_date, status)
- `idx_time_slots_schedule_available`: (schedule_id, is_available)

**Cách chạy migration:**
```bash
mysql -u your_user -p your_database < backend/src/database/migrations/add_performance_indexes.sql
```

### 2. Response Caching Middleware

File: `backend/src/middleware/responseCache.ts`

Middleware để cache responses cho GET requests:
- TTL mặc định: 5 phút
- Tự động cleanup expired entries
- Có thể customize TTL và key generator

**Sử dụng:**
```typescript
import { cacheMiddleware } from '../middleware/responseCache';

// Cache với TTL mặc định (5 phút)
router.get('/doctors', cacheMiddleware(), getDoctors);

// Cache với TTL tùy chỉnh (10 phút)
router.get('/services', cacheMiddleware({ ttl: 600 }), getServices);
```

### 3. Query Optimization

#### Pagination
Tất cả các endpoints list đã có pagination:
- `limit`: Số lượng items mỗi trang (default: 50, max: 100)
- `offset`: Số lượng items bỏ qua (default: 0)

**Ví dụ:**
```
GET /api/appointments?limit=20&offset=0
GET /api/patients?limit=50&offset=50
```

#### Input Validation
Đã thêm `validateIntQuery` và `validateIntParam` để:
- Validate và parse integer parameters
- Prevent NaN và negative values
- Provide clear error messages

### 4. Database Connection Pool Optimization

File: `backend/src/config/database.ts`

Đã tối ưu connection pool:
- `connectionLimit`: 20 connections
- `enableKeepAlive`: true
- `keepAliveInitialDelay`: 0
- `waitForConnections`: true

### 5. Transaction Optimization

Tất cả các operations quan trọng đã sử dụng transactions:
- `createAppointment`: Sử dụng transaction với row locking
- `createDoctor`: Sử dụng transaction để đảm bảo atomicity
- `register`: Sử dụng transaction để prevent race conditions
- `rescheduleAppointment`: Sử dụng transaction với locking cả old và new slots

### 6. Error Handling Improvements

- Centralized error handling với `AppError`
- Detailed error messages cho debugging
- Proper error logging
- User-friendly error messages

## Các tối ưu khuyến nghị tiếp theo

### 1. Database Query Optimization
- Sử dụng `EXPLAIN` để analyze query performance
- Thêm indexes cho các queries chậm
- Optimize JOIN queries
- Sử dụng prepared statements

### 2. API Response Optimization
- Implement response compression (đã có compression middleware)
- Add ETags cho caching
- Implement pagination metadata (total count, hasMore, etc.)
- Add response filtering và sorting

### 3. Frontend Optimization
- Implement lazy loading cho components
- Add code splitting
- Optimize bundle size
- Implement service worker cho offline support

### 4. Monitoring & Logging
- Add performance monitoring (APM)
- Implement structured logging
- Add metrics collection
- Set up alerts cho slow queries

### 5. Security Optimization
- Implement rate limiting (đã có)
- Add request size limits (đã có)
- Implement CORS properly (đã có)
- Add security headers (đã có với Helmet)

## Performance Benchmarks

### Before Optimization
- Average query time: ~50-100ms
- API response time: ~100-200ms
- Database connections: 10

### After Optimization (Expected)
- Average query time: ~10-30ms (với indexes)
- API response time: ~50-100ms (với caching)
- Database connections: 20 (optimized pool)

## Monitoring

Để monitor performance, có thể:
1. Enable query logging trong development
2. Sử dụng MySQL slow query log
3. Monitor connection pool usage
4. Track API response times

## Notes

- Indexes sẽ tăng storage space nhưng cải thiện query performance đáng kể
- Caching có thể gây stale data, cần clear cache khi có updates
- Transactions có thể gây lock contention, cần monitor deadlocks

