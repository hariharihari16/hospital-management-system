package com.hospital.hospitalmanagement.dto;

import javax.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

public class AppointmentDTO {

    private Long apptId;

    @NotNull(message = "Appointment date is required")
    private LocalDate apptDate;

    @NotNull(message = "Appointment time is required")
    private LocalTime apptTime;

    private String reason;
    private String status;

    @NotNull(message = "Doctor ID is required")
    private Long doctorId;
    private String doctorName;

    @NotNull(message = "Patient ID is required")
    private Long patientId;
    private String patientName;

    public AppointmentDTO() {
    }

    public AppointmentDTO(Long apptId, LocalDate apptDate, LocalTime apptTime, String reason, String status, Long doctorId, String doctorName, Long patientId, String patientName) {
        this.apptId = apptId;
        this.apptDate = apptDate;
        this.apptTime = apptTime;
        this.reason = reason;
        this.status = status;
        this.doctorId = doctorId;
        this.doctorName = doctorName;
        this.patientId = patientId;
        this.patientName = patientName;
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
}
