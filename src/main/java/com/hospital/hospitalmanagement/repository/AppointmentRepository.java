package com.hospital.hospitalmanagement.repository;

import com.hospital.hospitalmanagement.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByPatientPatientId(Long patientId);
    List<Appointment> findByDoctorDoctorId(Long doctorId);

    boolean existsByDoctorDoctorIdAndApptDateAndApptTime(Long doctorId, LocalDate apptDate, LocalTime apptTime);
    boolean existsByDoctorDoctorIdAndApptDateAndApptTimeAndApptIdNot(Long doctorId, LocalDate apptDate, LocalTime apptTime, Long apptId);

    @Query("SELECT MAX(a.apptId) FROM Appointment a")
    Long findMaxApptId();
}
