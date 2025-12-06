package com.clinic.booking.adapter.web;

import com.clinic.booking.application.dto.AppointmentRequest;
import com.clinic.booking.application.dto.AppointmentResponse;
import com.clinic.booking.application.dto.TimeSlotResponse;
import com.clinic.booking.application.service.AppointmentService;
import com.clinic.booking.shared.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/appointments")
@RequiredArgsConstructor
@Tag(name = "Appointment Management", description = "APIs for managing clinic appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    @Operation(summary = "Create a new appointment")
    public ResponseEntity<ApiResponse<AppointmentResponse>> createAppointment(
            @Valid @RequestBody AppointmentRequest request) {
        AppointmentResponse response = appointmentService.createAppointment(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Appointment created successfully", response));
    }

    @GetMapping("/available-slots")
    @Operation(summary = "Get available time slots for a doctor on a specific date")
    public ResponseEntity<ApiResponse<List<TimeSlotResponse>>> getAvailableSlots(
            @RequestParam Integer doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<TimeSlotResponse> response = appointmentService.getAvailableSlots(doctorId, date);
        return ResponseEntity.ok(ApiResponse.success("Available slots retrieved", response));
    }

    @PutMapping("/{id}/confirm")
    @Operation(summary = "Confirm a pending appointment")
    public ResponseEntity<ApiResponse<AppointmentResponse>> confirmAppointment(
            @PathVariable Integer id) {
        AppointmentResponse response = appointmentService.confirmAppointment(id);
        return ResponseEntity.ok(ApiResponse.success("Appointment confirmed successfully", response));
    }

    @PutMapping("/{id}/cancel")
    @Operation(summary = "Cancel an appointment")
    public ResponseEntity<ApiResponse<Void>> cancelAppointment(
            @PathVariable Integer id,
            @RequestParam Integer patientId,
            @RequestParam(required = false) String reason) {
        appointmentService.cancelAppointment(id, patientId, reason);
        return ResponseEntity.ok(ApiResponse.success("Appointment cancelled successfully", null));
    }

    @GetMapping("/patient/{patientId}")
    @Operation(summary = "Get all appointments for a patient with pagination")
    public ResponseEntity<ApiResponse<Page<AppointmentResponse>>> getPatientAppointments(
            @PathVariable Integer patientId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<AppointmentResponse> response = appointmentService.getPatientAppointments(patientId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Patient appointments retrieved", response));
    }

    @GetMapping("/doctor/{doctorId}/schedule")
    @Operation(summary = "Get doctor's appointments for a date range")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getDoctorSchedule(
            @PathVariable Integer doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        List<AppointmentResponse> response = appointmentService.getDoctorAppointmentsByDateRange(doctorId, from, to);
        return ResponseEntity.ok(ApiResponse.success("Doctor schedule retrieved", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get appointment by ID")
    public ResponseEntity<ApiResponse<AppointmentResponse>> getAppointmentById(
            @PathVariable Integer id) {
        AppointmentResponse response = appointmentService.getAppointmentById(id);
        return ResponseEntity.ok(ApiResponse.success("Appointment retrieved", response));
    }
}
