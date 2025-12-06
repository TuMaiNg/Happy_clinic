package com.clinic.booking.application.repository;

import com.clinic.booking.domain.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer>, JpaSpecificationExecutor<Notification> {

    List<Notification> findByPatientIdOrderBySentAtDesc(Integer patientId);

    List<Notification> findByAppointmentId(Integer appointmentId);
}
