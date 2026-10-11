package com.hospital.hospitalmanagement.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

public class UserLoginDTO {

    private Long userId;

    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Password is required")
    private String password;

    @NotNull(message = "Staff ID is required")
    private Long staffId;
    private String staffName;

    public UserLoginDTO() {
    }

    public UserLoginDTO(Long userId, String username, String password, Long staffId, String staffName) {
        this.userId = userId;
        this.username = username;
        this.password = password;
        this.staffId = staffId;
        this.staffName = staffName;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Long getStaffId() {
        return staffId;
    }

    public void setStaffId(Long staffId) {
        this.staffId = staffId;
    }

    public String getStaffName() {
        return staffName;
    }

    public void setStaffName(String staffName) {
        this.staffName = staffName;
    }
}
