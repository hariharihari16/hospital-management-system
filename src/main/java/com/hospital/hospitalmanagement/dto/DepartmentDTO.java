package com.hospital.hospitalmanagement.dto;

import javax.validation.constraints.NotBlank;

public class DepartmentDTO {

    private Long deptId;

    @NotBlank(message = "Department name is required")
    private String deptName;

    private String location;

    public DepartmentDTO() {
    }

    public DepartmentDTO(Long deptId, String deptName, String location) {
        this.deptId = deptId;
        this.deptName = deptName;
        this.location = location;
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

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }
}
