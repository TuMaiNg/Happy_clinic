package com.clinic.booking.application.service;

import com.clinic.booking.application.dto.PatientRequest;
import com.clinic.booking.application.dto.PatientResponse;
import com.clinic.booking.application.repository.PatientRepository;
import com.clinic.booking.domain.Patient;
import com.clinic.booking.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class PatientService {

    private final PatientRepository patientRepository;

    public PatientResponse createPatient(PatientRequest request) {
        if (patientRepository.existsByPhone(request.getPhone())) {
            throw new IllegalArgumentException("Phone number already exists");
        }

        Patient patient = new Patient();
        patient.setFullName(request.getFullName());
        patient.setPhone(request.getPhone());
        patient.setBirthday(request.getBirthday());
        patient.setGender(request.getGender() != null ? request.getGender().ordinal() : null);
        patient.setAddress(request.getAddress());

        Patient saved = patientRepository.save(patient);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<PatientResponse> getAllPatients(Pageable pageable, String search) {
        // For now, return an empty page as PatientRepository doesn't support Specification queries
        // This would need to be implemented with a custom query
        return Page.empty(pageable);
    }

    @Transactional(readOnly = true)
    public PatientResponse getPatientById(Integer id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        return mapToResponse(patient);
    }

    public PatientResponse updatePatient(Integer id, PatientRequest request) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        if (!patient.getPhone().equals(request.getPhone()) &&
            patientRepository.existsByPhone(request.getPhone())) {
            throw new IllegalArgumentException("Phone number already exists");
        }

        patient.setFullName(request.getFullName());
        patient.setPhone(request.getPhone());
        patient.setBirthday(request.getBirthday());
        patient.setGender(request.getGender() != null ? request.getGender().ordinal() : null);
        patient.setAddress(request.getAddress());

        Patient saved = patientRepository.save(patient);
        return mapToResponse(saved);
    }

    public void deletePatient(Integer id) {
        patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        // Cannot delete directly as PatientRepository doesn't support it
        // This would need a custom implementation
        throw new UnsupportedOperationException("Delete operation not yet implemented");
    }

    private PatientResponse mapToResponse(Patient patient) {
        PatientResponse response = new PatientResponse();
        response.setId(patient.getId());
        response.setFullName(patient.getFullName());
        response.setPhone(patient.getPhone());
        response.setBirthday(patient.getBirthday());
        response.setAddress(patient.getAddress());
        if (patient.getGender() != null) {
            response.setGender(PatientResponse.Gender.values()[patient.getGender()]);
        }
        response.setCreatedAt(patient.getCreatedAt());
        response.setUpdatedAt(patient.getUpdatedAt());
        return response;
    }
}
