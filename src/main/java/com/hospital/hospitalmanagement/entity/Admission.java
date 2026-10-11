package com.hospital.hospitalmanagement.entity;

import javax.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "ADMISSION")
public class Admission {

    @Id
    @Column(name = "admission_id")
    private Long admissionId;

    @Column(name = "admission_date")
    private LocalDate admissionDate;

    @Column(name = "discharge_date")
    private LocalDate dischargeDate;

    @Column(name = "status")
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Room room;

    public Admission() {
    }

    public Admission(Long admissionId, LocalDate admissionDate, LocalDate dischargeDate, String status, Patient patient, Room room) {
        this.admissionId = admissionId;
        this.admissionDate = admissionDate;
        this.dischargeDate = dischargeDate;
        this.status = status;
        this.patient = patient;
        this.room = room;
    }

    public Long getAdmissionId() {
        return admissionId;
    }

    public void setAdmissionId(Long admissionId) {
        this.admissionId = admissionId;
    }

    public LocalDate getAdmissionDate() {
        return admissionDate;
    }

    public void setAdmissionDate(LocalDate admissionDate) {
        this.admissionDate = admissionDate;
    }

    public LocalDate getDischargeDate() {
        return dischargeDate;
    }

    public void setDischargeDate(LocalDate dischargeDate) {
        this.dischargeDate = dischargeDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Patient getPatient() {
        return patient;
    }

    public void setPatient(Patient patient) {
        this.patient = patient;
    }

    public Room getRoom() {
        return room;
    }

    public void setRoom(Room room) {
        this.room = room;
    }
}
