package com.hospital.hospitalmanagement.repository;

import com.hospital.hospitalmanagement.entity.PrescriptionMedicine;
import com.hospital.hospitalmanagement.entity.PrescriptionMedicineId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrescriptionMedicineRepository extends JpaRepository<PrescriptionMedicine, PrescriptionMedicineId> {
    List<PrescriptionMedicine> findByIdPrescriptionId(Long prescriptionId);
    void deleteByIdPrescriptionId(Long prescriptionId);
}
