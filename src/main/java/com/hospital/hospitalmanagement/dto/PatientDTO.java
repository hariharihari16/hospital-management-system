package com.hospital.hospitalmanagement.dto;

import javax.validation.constraints.NotBlank;
import java.time.LocalDate;

public class PatientDTO {

    private Long patientId;

    @NotBlank(message = "Patient name is required")
    private String name;

    private LocalDate dob;
    private String gender;
    private String phone;
    private String address;
    private String email;

    public PatientDTO() {
    }

    public PatientDTO(Long patientId, String name, LocalDate dob, String gender, String phone, String address, String email) {
        this.patientId = patientId;
        this.name = name;
        this.dob = dob;
        this.gender = gender;
        this.phone = phone;
        this.address = address;
        this.email = email;
    }

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public LocalDate getDob() {
        return dob;
    }

    public void setDob(LocalDate dob) {
        this.dob = dob;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
