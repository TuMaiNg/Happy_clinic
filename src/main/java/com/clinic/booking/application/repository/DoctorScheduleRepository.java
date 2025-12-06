// File: src/main/java/com/clinic/booking/application/repository/DoctorScheduleRepository.java

package com.clinic.booking.application.repository;

import com.clinic.booking.domain.DoctorSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DoctorScheduleRepository extends JpaRepository<DoctorSchedule, Integer> {

    List<DoctorSchedule> findByDoctorIdAndDate(Integer doctorId, LocalDate date);

    @Query("SELECT COUNT(ds) = 0 FROM DoctorSchedule ds WHERE ds.doctor.id = :doctorId AND ds.date = :date AND ds.isDayOff = true")
    boolean isAvailableOnDate(@Param("doctorId") Integer doctorId, @Param("date") LocalDate date);

    List<DoctorSchedule> findByDoctorIdAndDateBetween(Integer doctorId, LocalDate start, LocalDate end);
}