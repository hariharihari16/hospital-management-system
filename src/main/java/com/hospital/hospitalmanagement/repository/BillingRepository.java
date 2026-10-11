package com.hospital.hospitalmanagement.repository;

import com.hospital.hospitalmanagement.entity.Billing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BillingRepository extends JpaRepository<Billing, Long> {
    List<Billing> findByPatientPatientId(Long patientId);
}
