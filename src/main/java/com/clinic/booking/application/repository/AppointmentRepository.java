package com.clinic.booking.application.repository;

import com.clinic.booking.domain.Appointment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AppointmentRepository {

    Appointment save(Appointment appointment);

    Optional<Appointment> findById(Integer id);

    List<Appointment> findByPatientId(Integer patientId);

    Page<Appointment> findByPatientId(Integer patientId, Pageable pageable);

    List<Appointment> findByPatientIdOrderByAppointmentDateDesc(Integer patientId);

    List<Appointment> findByDoctorIdOrderByAppointmentDateDesc(Integer doctorId);

    List<Appointment> findByDoctorIdAndAppointmentDate(Integer doctorId, LocalDate appointmentDate);

    Optional<Appointment> findByDoctorIdAndAppointmentDateAndSlotId(Integer doctorId, LocalDate date, Integer slotId);

    List<Appointment> findByPatientIdAndDateRange(Integer patientId, LocalDate fromDate, LocalDate toDate);

    List<Appointment> findByDoctorIdAndAppointmentDateBetween(Integer doctorId, LocalDate from, LocalDate to);
}
