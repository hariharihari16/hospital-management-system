package com.hospital.hospitalmanagement.dto;

import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public class BillingDTO {

    private Long billId;
    private LocalDate billDate;
    private String serviceDetails;

    @NotNull(message = "Bill amount is required")
    @DecimalMin(value = "0.0", message = "Amount cannot be negative")
    private BigDecimal amount;

    @NotNull(message = "Patient ID is required")
    private Long patientId;
    private String patientName;

    public BillingDTO() {
    }

    public BillingDTO(Long billId, LocalDate billDate, String serviceDetails, BigDecimal amount, Long patientId, String patientName) {
        this.billId = billId;
        this.billDate = billDate;
        this.serviceDetails = serviceDetails;
        this.amount = amount;
        this.patientId = patientId;
        this.patientName = patientName;
    }

    public Long getBillId() {
        return billId;
    }

    public void setBillId(Long billId) {
        this.billId = billId;
    }

    public LocalDate getBillDate() {
        return billDate;
    }

    public void setBillDate(LocalDate billDate) {
        this.billDate = billDate;
    }

    public String getServiceDetails() {
        return serviceDetails;
    }

    public void setServiceDetails(String serviceDetails) {
        this.serviceDetails = serviceDetails;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
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
