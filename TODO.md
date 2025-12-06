# TODO: Update Clinic Booking Code to Match New Database Schema

## Entities to Update
- [x] Update User entity: Change username to email, add password_hash, update role enum (add staff, admin), add status enum (active, inactive, suspended)
- [x] Update Patient entity: Add user_id (ManyToOne to User), add address, insurance_number, medical_history
- [x] Update Doctor entity: Add user_id (ManyToOne to User), add experience_years, license_number, remove phone, email
- [x] Update Service entity: Add speciality, is_active
- [x] Update DoctorSchedule entity: Add start_time, end_time, max_patients_per_slot
- [x] Update TimeSlot entity: Add patient_count, capacity
- [x] Update Appointment entity: Add visit_type, symptoms, confirmed_by, confirmed_at, cancelled_by, cancelled_at, reason_cancel, cancellation_fee, checked_in_at, completed_at; update status enum
- [x] Update Notification entity: Add appointment_id, type, title, message, recipient, status, retry_count, error_message, sent_at

## New Entities to Create
- [x] Create ClinicInfo entity
- [x] Create SystemConfig entity
- [x] Create Staff entity
- [x] Create DoctorServices entity
- [x] Create Payments entity
- [x] Create AuditLogs entity

## Dependent Updates
- [ ] Update repositories to match new entities
- [ ] Update services and DTOs
- [ ] Update controllers
- [ ] Update DataSeeder for new schema

## Authentication Fixes
- [x] Fix LoginRequest field name from passwordHash to password
- [x] Update AuthService to use request.getPassword()
- [x] Create PasswordMigrationService to encode plain text passwords to BCrypt on startup
- [x] Fix JWT secret key length to meet HS512 security requirements (512 bits minimum)
- [x] Add user registration functionality with RegisterRequest DTO, AuthService register method, and AuthController register endpoint
