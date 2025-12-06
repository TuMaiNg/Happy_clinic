package com.clinic.booking.adapter.persistence;

import com.clinic.booking.application.repository.PatientRepository;
import com.clinic.booking.domain.Patient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class PatientRepositoryAdapter implements PatientRepository {

    private final PatientJpaRepository jpaRepository;

    @Override
    public Patient save(Patient patient) {
        return jpaRepository.save(patient);
    }

    @Override
    public Optional<Patient> findById(Integer id) {
        return jpaRepository.findById(id);
    }

    @Override
    public Optional<Patient> findByPhone(String phone) {
        return jpaRepository.findByPhone(phone);
    }

    @Override
    public boolean existsByPhone(String phone) {
        return jpaRepository.existsByPhone(phone);
    }

    @Override
    public long count() {
        return jpaRepository.count();
    }
}
