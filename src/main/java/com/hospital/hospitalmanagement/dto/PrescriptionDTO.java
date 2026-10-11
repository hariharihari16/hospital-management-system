package com.hospital.hospitalmanagement.dto;

import javax.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class PrescriptionDTO {

    private Long prescriptionId;
    private LocalDate prescriptionDate;
    private String instructions;

    @NotNull(message = "Patient ID is required")
    private Long patientId;
    private String patientName;

    @NotNull(message = "Doctor ID is required")
    private Long doctorId;
    private String doctorName;

    private List<PrescriptionMedicineDTO> medicines = new ArrayList<>();

    public PrescriptionDTO() {
    }

    public PrescriptionDTO(Long prescriptionId, LocalDate prescriptionDate, String instructions, Long patientId, String patientName, Long doctorId, String doctorName, List<PrescriptionMedicineDTO> medicines) {
        this.prescriptionId = prescriptionId;
        this.prescriptionDate = prescriptionDate;
        this.instructions = instructions;
        this.patientId = patientId;
        this.patientName = patientName;
        this.doctorId = doctorId;
        this.doctorName = doctorName;
        this.medicines = medicines;
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

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public String getPatientName() {
        return patientName;
    }

    public void setPatientName(String patientName) {
        this.patientName = patientName;
    }

    public Long getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(Long doctorId) {
        this.doctorId = doctorId;
    }

    public String getDoctorName() {
        return doctorName;
    }

    public void setDoctorName(String doctorName) {
        this.doctorName = doctorName;
    }

    public List<PrescriptionMedicineDTO> getMedicines() {
        return medicines;
    }

    public void setMedicines(List<PrescriptionMedicineDTO> medicines) {
        this.medicines = medicines;
    }
}
