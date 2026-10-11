package com.hospital.hospitalmanagement.entity;

import javax.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "PRESCRIPTION")
public class Prescription {

    @Id
    @Column(name = "prescription_id")
    private Long prescriptionId;

    @Column(name = "prescription_date")
    private LocalDate prescriptionDate;

    @Column(name = "instructions")
    private String instructions;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id")
    private Doctor doctor;

    public Prescription() {
    }

    public Prescription(Long prescriptionId, LocalDate prescriptionDate, String instructions, Patient patient, Doctor doctor) {
        this.prescriptionId = prescriptionId;
        this.prescriptionDate = prescriptionDate;
        this.instructions = instructions;
        this.patient = patient;
        this.doctor = doctor;
    }

    public Long getPrescriptionId() {
        return prescriptionId;
    }

    public void setPrescriptionId(Long prescriptionId) {
        this.prescriptionId = prescriptionId;
    }

    public LocalDate getPrescriptionDate() {
        return prescriptionDate;
    }

    public void setPrescriptionDate(LocalDate prescriptionDate) {
        this.prescriptionDate = prescriptionDate;
    }

    public String getInstructions() {
        return instructions;
    }

    public void setInstructions(String instructions) {
        this.instructions = instructions;
    }

    public Patient getPatient() {
        return patient;
    }

    public void setPatient(Patient patient) {
        this.patient = patient;
    }

    public Doctor getDoctor() {
        return doctor;
    }

    public void setDoctor(Doctor doctor) {
        this.doctor = doctor;
    }
}
