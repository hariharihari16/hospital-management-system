package com.hospital.hospitalmanagement.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.time.LocalDate;

public class LabTestDTO {

    private Long testId;

    @NotBlank(message = "Test name is required")
    private String testName;

    private LocalDate testDate;
    private String result;
    private String status;

    @NotNull(message = "Patient ID is required")
    private Long patientId;
    private String patientName;

    public LabTestDTO() {
    }

    public LabTestDTO(Long testId, String testName, LocalDate testDate, String result, String status, Long patientId, String patientName) {
        this.testId = testId;
        this.testName = testName;
        this.testDate = testDate;
        this.result = result;
        this.status = status;
        this.patientId = patientId;
        this.patientName = patientName;
    }

    public Long getTestId() {
        return testId;
    }

    public void setTestId(Long testId) {
        this.testId = testId;
    }

    public String getTestName() {
        return testName;
    }

    public void setTestName(String testName) {
        this.testName = testName;
    }

    public LocalDate getTestDate() {
        return testDate;
    }

    public void setTestDate(LocalDate testDate) {
        this.testDate = testDate;
    }

    public String getResult() {
        return result;
    }

    public void setResult(String result) {
        this.result = result;
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
}
