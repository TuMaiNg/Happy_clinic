package com.clinic.booking.adapter.persistence;

import com.clinic.booking.domain.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PatientJpaRepository extends JpaRepository<Patient, Integer> {

    Optional<Patient> findByPhone(String phone);

    boolean existsByPhone(String phone);
}
