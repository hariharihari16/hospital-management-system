package com.hospital.hospitalmanagement.entity;

import javax.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "MEDICINE")
public class Medicine {

    @Id
    @Column(name = "medicine_id")
    private Long medicineId;

    @Column(name = "medicine_name", nullable = false)
    private String medicineName;

    @Column(name = "price")
    private BigDecimal price;

    @Column(name = "dosage")
    private String dosage;

    @Column(name = "stock")
    private Integer stock;

    public Medicine() {
    }

    public Medicine(Long medicineId, String medicineName, BigDecimal price, String dosage, Integer stock) {
        this.medicineId = medicineId;
        this.medicineName = medicineName;
        this.price = price;
        this.dosage = dosage;
        this.stock = stock;
    }

    public Long getMedicineId() {
        return medicineId;
    }

    public void setMedicineId(Long medicineId) {
        this.medicineId = medicineId;
    }

    public String getMedicineName() {
        return medicineName;
    }

    public void setMedicineName(String medicineName) {
        this.medicineName = medicineName;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getDosage() {
        return dosage;
    }

    public void setDosage(String dosage) {
        this.dosage = dosage;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }
}
