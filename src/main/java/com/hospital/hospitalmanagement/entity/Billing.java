package com.hospital.hospitalmanagement.entity;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "BILLING")
public class Billing {

    @Id
    @Column(name = "bill_id")
    private Long billId;

    @Column(name = "bill_date")
    private LocalDate billDate;

    @Column(name = "service_details")
    private String serviceDetails;

    @Column(name = "amount")
    private BigDecimal amount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    public Billing() {
    }

    public Billing(Long billId, LocalDate billDate, String serviceDetails, BigDecimal amount, Patient patient) {
        this.billId = billId;
        this.billDate = billDate;
        this.serviceDetails = serviceDetails;
        this.amount = amount;
        this.patient = patient;
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

    public Patient getPatient() {
        return patient;
    }

    public void setPatient(Patient patient) {
        this.patient = patient;
    }
}
