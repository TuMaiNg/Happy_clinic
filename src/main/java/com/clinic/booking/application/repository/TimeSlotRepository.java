package com.clinic.booking.application.repository;

import com.clinic.booking.domain.TimeSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TimeSlotRepository extends JpaRepository<TimeSlot, Integer> {

    @Query("SELECT t FROM TimeSlot t WHERE t.isAvailable = true ORDER BY t.startTime ASC")
    List<TimeSlot> findAllActive();

    @Query("SELECT t FROM TimeSlot t WHERE t.schedule.doctor.id = :doctorId AND t.schedule.date = :date")
    List<TimeSlot> findByDoctorIdAndDate(@org.springframework.data.repository.query.Param("doctorId") Integer doctorId,
                                        @org.springframework.data.repository.query.Param("date") LocalDate date);

    @Query("SELECT t FROM TimeSlot t WHERE t.schedule.doctor.id = :doctorId AND t.schedule.date = :date AND t.isAvailable = :available")
    List<TimeSlot> findByDoctorIdAndDateAndAvailable(@org.springframework.data.repository.query.Param("doctorId") Integer doctorId,
                                                     @org.springframework.data.repository.query.Param("date") LocalDate date,
                                                     @org.springframework.data.repository.query.Param("available") boolean available);
}
