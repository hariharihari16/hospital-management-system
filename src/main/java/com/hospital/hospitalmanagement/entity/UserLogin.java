package com.hospital.hospitalmanagement.entity;

import javax.persistence.*;

@Entity
@Table(name = "USER_LOGIN")
public class UserLogin {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "username", nullable = false, unique = true)
    private String username;

    @Column(name = "password", nullable = false)
    private String password;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id", unique = true)
    private Staff staff;

    public UserLogin() {
    }

    public UserLogin(Long userId, String username, String password, Staff staff) {
        this.userId = userId;
        this.username = username;
        this.password = password;
        this.staff = staff;
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

    public Staff getStaff() {
        return staff;
    }

    public void setStaff(Staff staff) {
        this.staff = staff;
    }
}
