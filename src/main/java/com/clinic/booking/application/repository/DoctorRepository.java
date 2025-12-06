package com.clinic.booking.application.repository;

import com.clinic.booking.domain.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Integer>, JpaSpecificationExecutor<Doctor> {

    // Optional<Doctor> findByCode(String code);

    // boolean existsByCode(String code);


}
