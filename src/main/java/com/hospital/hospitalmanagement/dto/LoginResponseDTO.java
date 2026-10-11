package com.hospital.hospitalmanagement.dto;

public class LoginResponseDTO {

    private boolean authenticated;
    private String message;
    private Long userId;
    private String username;
    private Long staffId;
    private String staffName;
    private String role;

    public LoginResponseDTO() {
    }

    public LoginResponseDTO(boolean authenticated, String message, Long userId, String username, Long staffId, String staffName, String role) {
        this.authenticated = authenticated;
        this.message = message;
        this.userId = userId;
        this.username = username;
        this.staffId = staffId;
        this.staffName = staffName;
        this.role = role;
    }

    public boolean isAuthenticated() {
        return authenticated;
    }

    public void setAuthenticated(boolean authenticated) {
        this.authenticated = authenticated;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
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

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
