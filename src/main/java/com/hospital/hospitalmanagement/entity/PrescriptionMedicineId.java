package com.hospital.hospitalmanagement.entity;

import javax.persistence.Column;
import javax.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class PrescriptionMedicineId implements Serializable {

    @Column(name = "prescription_id")
    private Long prescriptionId;

    @Column(name = "medicine_id")
    private Long medicineId;

    public PrescriptionMedicineId() {
    }

    public PrescriptionMedicineId(Long prescriptionId, Long medicineId) {
        this.prescriptionId = prescriptionId;
        this.medicineId = medicineId;
    }

    public Long getPrescriptionId() {
        return prescriptionId;
    }

    public void setPrescriptionId(Long prescriptionId) {
        this.prescriptionId = prescriptionId;
    }

    public Long getMedicineId() {
        return medicineId;
    }

    public void setMedicineId(Long medicineId) {
        this.medicineId = medicineId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PrescriptionMedicineId that = (PrescriptionMedicineId) o;
        return Objects.equals(prescriptionId, that.prescriptionId) &&
                Objects.equals(medicineId, that.medicineId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(prescriptionId, medicineId);
    }
}
