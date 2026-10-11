package com.hospital.hospitalmanagement.entity;

import javax.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "INSURANCE")
public class Insurance {

    @Id
    @Column(name = "insurance_id")
    private Long insuranceId;

    @Column(name = "provider_name", nullable = false)
    private String providerName;

    @Column(name = "policy_number")
    private String policyNumber;

    @Column(name = "coverage_details")
    private String coverageDetails;

    @Column(name = "validity")
    private LocalDate validity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    public Insurance() {
    }

    public Insurance(Long insuranceId, String providerName, String policyNumber, String coverageDetails, LocalDate validity, Patient patient) {
        this.insuranceId = insuranceId;
        this.providerName = providerName;
        this.policyNumber = policyNumber;
        this.coverageDetails = coverageDetails;
        this.validity = validity;
        this.patient = patient;
    }

    public Long getInsuranceId() {
        return insuranceId;
    }

    public void setInsuranceId(Long insuranceId) {
        this.insuranceId = insuranceId;
    }

    public String getProviderName() {
        return providerName;
    }

    public void setProviderName(String providerName) {
        this.providerName = providerName;
    }

    public String getPolicyNumber() {
        return policyNumber;
    }

    public void setPolicyNumber(String policyNumber) {
        this.policyNumber = policyNumber;
    }

    public String getCoverageDetails() {
        return coverageDetails;
    }

    public void setCoverageDetails(String coverageDetails) {
        this.coverageDetails = coverageDetails;
    }

    public LocalDate getValidity() {
        return validity;
    }

    public void setValidity(LocalDate validity) {
        this.validity = validity;
    }

    public Patient getPatient() {
        return patient;
    }

    public void setPatient(Patient patient) {
        this.patient = patient;
    }
}
