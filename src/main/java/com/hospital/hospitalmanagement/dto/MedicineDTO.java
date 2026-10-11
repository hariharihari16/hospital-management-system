package com.hospital.hospitalmanagement.dto;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import java.math.BigDecimal;

public class MedicineDTO {

    private Long medicineId;

    @NotBlank(message = "Medicine name is required")
    private String medicineName;

    private BigDecimal price;
    private String dosage;

    @Min(value = 0, message = "Stock cannot be negative")
    private Integer stock;

    public MedicineDTO() {
    }

    public MedicineDTO(Long medicineId, String medicineName, BigDecimal price, String dosage, Integer stock) {
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
