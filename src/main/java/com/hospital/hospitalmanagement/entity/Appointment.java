package com.hospital.hospitalmanagement.entity;

import javax.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "APPOINTMENT")
public class Appointment {

    @Id
    @Column(name = "appt_id")
    private Long apptId;

    @Column(name = "appt_date")
    private LocalDate apptDate;

    @Column(name = "appt_time")
    private LocalTime apptTime;

    @Column(name = "reason")
    private String reason;

    @Column(name = "status")
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id")
    private Doctor doctor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    public Appointment() {
    }

    public Appointment(Long apptId, LocalDate apptDate, LocalTime apptTime, String reason, String status, Doctor doctor, Patient patient) {
        this.apptId = apptId;
        this.apptDate = apptDate;
        this.apptTime = apptTime;
        this.reason = reason;
        this.status = status;
        this.doctor = doctor;
        this.patient = patient;
    }

    public Long getApptId() {
        return apptId;
    }

    public void setApptId(Long apptId) {
        this.apptId = apptId;
    }

    public LocalDate getApptDate() {
        return apptDate;
    }

    public void setApptDate(LocalDate apptDate) {
        this.apptDate = apptDate;
    }

    public LocalTime getApptTime() {
        return apptTime;
    }

    public void setApptTime(LocalTime apptTime) {
        this.apptTime = apptTime;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Doctor getDoctor() {
        return doctor;
    }

    public void setDoctor(Doctor doctor) {
        this.doctor = doctor;
    }

    public Patient getPatient() {
        return patient;
    }

    public void setPatient(Patient patient) {
        this.patient = patient;
    }
}
