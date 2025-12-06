// DoctorJpaRepository.java (bản hoàn chỉnh + tối ưu)
package com.clinic.booking.adapter.persistence;

import com.clinic.booking.domain.Doctor;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository

public interface DoctorJpaRepository extends JpaRepository<Doctor, Integer> {

    @EntityGraph(attributePaths = "availabilities")
    Optional<Doctor> findWithAvailabilitiesById(Integer id);

    @EntityGraph(attributePaths = "availabilities")
    List<Doctor> findAllBy();

    List<Doctor> findByFullNameContainingIgnoreCase(String name);

    List<Doctor> findBySpecialityContainingIgnoreCase(String speciality);
}