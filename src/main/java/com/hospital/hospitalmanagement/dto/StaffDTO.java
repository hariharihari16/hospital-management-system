package com.hospital.hospitalmanagement.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

public class StaffDTO {

    private Long staffId;

    @NotBlank(message = "Staff name is required")
    private String name;

    private String role;
    private String phone;
    private String email;

    @NotNull(message = "Department ID is required")
    private Long deptId;
    private String deptName;

    public StaffDTO() {
    }

    public StaffDTO(Long staffId, String name, String role, String phone, String email, Long deptId, String deptName) {
        this.staffId = staffId;
        this.name = name;
        this.role = role;
        this.phone = phone;
        this.email = email;
        this.deptId = deptId;
        this.deptName = deptName;
    }

    public Long getStaffId() {
        return staffId;
    }

    public void setStaffId(Long staffId) {
        this.staffId = staffId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
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
