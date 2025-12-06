package com.clinic.booking.application.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;

@Data
public class AppointmentRequest {

    @NotNull(message = "Patient ID is required")
    private Integer patientId;

    @NotNull(message = "Doctor ID is required")
    private Integer doctorId;

    private Integer serviceId;

    @NotNull(message = "Appointment date is required")
    @FutureOrPresent(message = "Appointment date must not be in the past")
    private LocalDate appointmentDate;

    @NotNull(message = "Time slot ID is required")
    private Integer slotId;
}
