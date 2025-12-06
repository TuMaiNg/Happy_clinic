package com.clinic.booking.adapter.persistence;

import com.clinic.booking.domain.Service;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ServiceJpaRepository extends JpaRepository<Service, Integer> {
}
