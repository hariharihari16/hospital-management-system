package com.hospital.hospitalmanagement.dto;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;

public class PrescriptionMedicineDTO {

    @NotNull(message = "Medicine ID is required")
    private Long medicineId;
    private String medicineName;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    public PrescriptionMedicineDTO() {
    }

    public PrescriptionMedicineDTO(Long medicineId, String medicineName, Integer quantity) {
        this.medicineId = medicineId;
        this.medicineName = medicineName;
        this.quantity = quantity;
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

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}
