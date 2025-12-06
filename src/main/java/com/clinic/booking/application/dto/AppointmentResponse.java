package com.clinic.booking.application.dto;

import com.clinic.booking.domain.Appointment;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class AppointmentResponse {

    private Integer id;
    private PatientResponse patient;
    private DoctorResponse doctor;
    private ServiceResponse service;
    private LocalDate appointmentDate;
    private TimeSlotResponse slot;
    private Appointment.Status status;
    private String reasonCancel;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
