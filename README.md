# Clinic Booking System

A Spring Boot 3.3+ RESTful API for clinic appointment booking system.

## Features

- Patient, Doctor, Service, and Appointment management
- Time slot-based appointment booking
- Double booking prevention with pessimistic locking
- Doctor schedule management
- Notification system
- Swagger UI documentation

## Prerequisites

- Java 17 or 21
- MySQL 8.0+
- Maven 3.6+

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd clinic-booking
   ```

2. Create MySQL database:
   ```sql
   CREATE DATABASE clinic_booking;
   ```

3. Update database configuration in `src/main/resources/application.yml`:
   ```yaml
   spring:
     datasource:
       url: jdbc:mysql://localhost:3306/clinic_booking?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC
       username: your_username
       password: your_password
   ```

4. Build and run the application:
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```

5. Access Swagger UI:
   - URL: http://localhost:8080/swagger-ui.html

## API Endpoints

### Appointments
- `POST /api/v1/appointments` - Book appointment
- `GET /api/v1/appointments/available-slots?doctorId=&date=` - Get available slots
- `GET /api/v1/appointments/{id}` - Get appointment details
- `PUT /api/v1/appointments/{id}/confirm` - Confirm appointment
- `PUT /api/v1/appointments/{id}/cancel` - Cancel appointment

### Doctors
- `GET /api/v1/doctors/{id}/schedule?from=&to=` - Get doctor's schedule

### Patients
- `GET /api/v1/patients/{patientId}/appointments` - Get patient's appointments

## Database Schema

The application uses MySQL with the following tables:
- patients
- doctors
- services
- doctor_schedules
- time_slots
- appointments
- notifications

## Seed Data

On startup, the application seeds:
- 20 time slots (07:30-17:30, 30-minute intervals)
- 5 doctors
- 10 services
- Sample appointments

## Business Rules

- Appointments can only be booked on dates when doctor is working
- Double booking prevention using database constraints and pessimistic locking
- Appointment codes auto-generated in format AP2025120001
- Time slots are fixed and seeded once
