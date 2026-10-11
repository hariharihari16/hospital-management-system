package com.hospital.hospitalmanagement.repository;

import com.hospital.hospitalmanagement.entity.Admission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdmissionRepository extends JpaRepository<Admission, Long> {
    List<Admission> findByPatientPatientId(Long patientId);
    List<Admission> findByRoomRoomId(Long roomId);

    boolean existsByRoomRoomIdAndStatusIn(Long roomId, List<String> statuses);
    boolean existsByRoomRoomIdAndStatusInAndAdmissionIdNot(Long roomId, List<String> statuses, Long admissionId);
}
