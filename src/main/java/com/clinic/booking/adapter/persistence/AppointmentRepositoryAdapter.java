package com.clinic.booking.adapter.persistence;

import com.clinic.booking.application.repository.AppointmentRepository;
import com.clinic.booking.domain.Appointment;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class AppointmentRepositoryAdapter implements AppointmentRepository {

    private final AppointmentJpaRepository jpaRepository;

    @Override
    public Appointment save(Appointment appointment) {
        return jpaRepository.save(appointment);
    }

    @Override
    public Optional<Appointment> findById(Integer id) {
        return jpaRepository.findById(id);
    }

    @Override
    public List<Appointment> findByPatientId(Integer patientId) {
        return jpaRepository.findByPatientId(patientId);
    }

    @Override
    public Page<Appointment> findByPatientId(Integer patientId, Pageable pageable) {
        return jpaRepository.findByPatientId(patientId, pageable);
    }

    @Override
    public List<Appointment> findByPatientIdOrderByAppointmentDateDesc(Integer patientId) {
        return jpaRepository.findByPatientIdOrderByAppointmentDateDesc(patientId);
    }

    @Override
    public List<Appointment> findByDoctorIdOrderByAppointmentDateDesc(Integer doctorId) {
        return jpaRepository.findByDoctorIdOrderByAppointmentDateDesc(doctorId);
    }

    @Override
    public List<Appointment> findByDoctorIdAndAppointmentDate(Integer doctorId, LocalDate appointmentDate) {
        return jpaRepository.findByDoctorIdAndAppointmentDate(doctorId, appointmentDate);
    }

    @Override
    public Optional<Appointment> findByDoctorIdAndAppointmentDateAndSlotId(Integer doctorId, LocalDate date, Integer slotId) {
        return jpaRepository.findByDoctorIdAndAppointmentDateAndSlotId(doctorId, date, slotId);
    }

    @Override
    public List<Appointment> findByPatientIdAndDateRange(Integer patientId, LocalDate fromDate, LocalDate toDate) {
        return jpaRepository.findByPatientIdAndDateRange(patientId, fromDate, toDate);
    }

    // THÊM DÒNG NÀY ĐỂ HẾT LỖI
    @Override
    public List<Appointment> findByDoctorIdAndAppointmentDateBetween(Integer doctorId, LocalDate from, LocalDate to) {
        return jpaRepository.findByDoctorIdAndAppointmentDateBetween(doctorId, from, to);
    }
}