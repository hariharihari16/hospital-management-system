package com.hospital.hospitalmanagement.repository;

import com.hospital.hospitalmanagement.entity.Insurance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InsuranceRepository extends JpaRepository<Insurance, Long> {
    List<Insurance> findByPatientPatientId(Long patientId);
}
