package com.hospital.hospitalmanagement.dto;

import javax.validation.constraints.NotNull;
import java.time.LocalDate;

public class AdmissionDTO {

    private Long admissionId;
    private LocalDate admissionDate;
    private LocalDate dischargeDate;
    private String status;

    @NotNull(message = "Patient ID is required")
    private Long patientId;
    private String patientName;

    @NotNull(message = "Room ID is required")
    private Long roomId;
    private String roomNumber;

    public AdmissionDTO() {
    }

    public AdmissionDTO(Long admissionId, LocalDate admissionDate, LocalDate dischargeDate, String status, Long patientId, String patientName, Long roomId, String roomNumber) {
        this.admissionId = admissionId;
        this.admissionDate = admissionDate;
        this.dischargeDate = dischargeDate;
        this.status = status;
        this.patientId = patientId;
        this.patientName = patientName;
        this.roomId = roomId;
        this.roomNumber = roomNumber;
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

    public Long getRoomId() {
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }
}
