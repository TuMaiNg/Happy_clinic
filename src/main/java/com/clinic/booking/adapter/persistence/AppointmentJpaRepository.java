package com.clinic.booking.adapter.persistence;

import com.clinic.booking.domain.Appointment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AppointmentJpaRepository extends JpaRepository<Appointment, Integer> {

    List<Appointment> findByPatientId(Integer patientId);

    Page<Appointment> findByPatientId(Integer patientId, Pageable pageable);

    List<Appointment> findByPatientIdOrderByAppointmentDateDesc(Integer patientId);

    List<Appointment> findByDoctorIdOrderByAppointmentDateDesc(Integer doctorId);

    @Query("SELECT a FROM Appointment a WHERE a.doctor.id = :doctorId AND a.appointmentDate = :appointmentDate AND a.status != 'CANCELLED'")
    List<Appointment> findByDoctorIdAndAppointmentDate(@Param("doctorId") Integer doctorId,
                                                       @Param("appointmentDate") LocalDate appointmentDate);

    @Query("SELECT a FROM Appointment a WHERE a.patient.id = :patientId AND a.appointmentDate >= :fromDate AND a.appointmentDate <= :toDate")
    List<Appointment> findByPatientIdAndDateRange(@Param("patientId") Integer patientId,
                                                  @Param("fromDate") LocalDate fromDate,
                                                  @Param("toDate") LocalDate toDate);

    @Query("SELECT a FROM Appointment a WHERE a.doctor.id = :doctorId AND a.appointmentDate = :date AND a.slot.id = :slotId AND a.status != 'CANCELLED'")
    java.util.Optional<Appointment> findByDoctorIdAndAppointmentDateAndSlotId(@Param("doctorId") Integer doctorId,
                                                                             @Param("date") LocalDate date,
                                                                             @Param("slotId") Integer slotId);

    @Query("SELECT a FROM Appointment a " + "WHERE a.doctor.id = :doctorId " + "AND a.appointmentDate BETWEEN :from AND :to " + "AND a.status != 'CANCELLED' " + "ORDER BY a.appointmentDate, a.startTime")
    List<Appointment> findByDoctorIdAndAppointmentDateBetween(
            @Param("doctorId") Integer doctorId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);
}
