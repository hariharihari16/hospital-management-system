package com.hospital.hospitalmanagement.entity;

import javax.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "LAB_TEST")
public class LabTest {

    @Id
    @Column(name = "test_id")
    private Long testId;

    @Column(name = "test_name", nullable = false)
    private String testName;

    @Column(name = "test_date")
    private LocalDate testDate;

    @Column(name = "result")
    private String result;

    @Column(name = "status")
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    public LabTest() {
    }

    public LabTest(Long testId, String testName, LocalDate testDate, String result, String status, Patient patient) {
        this.testId = testId;
        this.testName = testName;
        this.testDate = testDate;
        this.result = result;
        this.status = status;
        this.patient = patient;
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

    public Patient getPatient() {
        return patient;
    }

    public void setPatient(Patient patient) {
        this.patient = patient;
    }
}
