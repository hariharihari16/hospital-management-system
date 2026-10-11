package com.hospital.hospitalmanagement.entity;

import javax.persistence.*;

@Entity
@Table(name = "PRESCRIPTION_MEDICINE")
public class PrescriptionMedicine {

    @EmbeddedId
    private PrescriptionMedicineId id = new PrescriptionMedicineId();

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("prescriptionId")
    @JoinColumn(name = "prescription_id")
    private Prescription prescription;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("medicineId")
    @JoinColumn(name = "medicine_id")
    private Medicine medicine;

    @Column(name = "quantity")
    private Integer quantity;

    public PrescriptionMedicine() {
    }

    public PrescriptionMedicine(Prescription prescription, Medicine medicine, Integer quantity) {
        this.prescription = prescription;
        this.medicine = medicine;
        this.quantity = quantity;
        if (prescription != null && medicine != null) {
            this.id = new PrescriptionMedicineId(prescription.getPrescriptionId(), medicine.getMedicineId());
        }
    }

    public PrescriptionMedicineId getId() {
        return id;
    }

    public void setId(PrescriptionMedicineId id) {
        this.id = id;
    }

    public Prescription getPrescription() {
        return prescription;
    }

    public void setPrescription(Prescription prescription) {
        this.prescription = prescription;
    }

    public Medicine getMedicine() {
        return medicine;
    }

    public void setMedicine(Medicine medicine) {
        this.medicine = medicine;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}
