package com.hospital.hospitalmanagement.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

public class DoctorDTO {

    private Long doctorId;

    @NotBlank(message = "Doctor name is required")
    private String name;

    private String specialization;
    private String phone;
    private String email;

    @NotNull(message = "Department ID is required")
    private Long deptId;
    private String deptName;

    public DoctorDTO() {
    }

    public DoctorDTO(Long doctorId, String name, String specialization, String phone, String email, Long deptId, String deptName) {
        this.doctorId = doctorId;
        this.name = name;
        this.specialization = specialization;
        this.phone = phone;
        this.email = email;
        this.deptId = deptId;
        this.deptName = deptName;
    }

    public Long getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(Long doctorId) {
        this.doctorId = doctorId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSpecialization() {
        return specialization;
    }

    public void setSpecialization(String specialization) {
        this.specialization = specialization;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Long getDeptId() {
        return deptId;
    }

    public void setDeptId(Long deptId) {
        this.deptId = deptId;
    }

    public String getDeptName() {
        return deptName;
    }

    public void setDeptName(String deptName) {
        this.deptName = deptName;
    }
}
