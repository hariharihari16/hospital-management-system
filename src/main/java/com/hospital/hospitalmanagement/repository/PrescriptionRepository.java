package com.hospital.hospitalmanagement.repository;

import com.hospital.hospitalmanagement.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    List<Prescription> findByPatientPatientId(Long patientId);
    List<Prescription> findByDoctorDoctorId(Long doctorId);
}
