package com.clinic.booking.application.repository;

import com.clinic.booking.domain.Patient;

import java.util.Optional;

public interface PatientRepository {

    Patient save(Patient patient);

    Optional<Patient> findById(Integer id);

    Optional<Patient> findByPhone(String phone);

    boolean existsByPhone(String phone);

    long count();
}