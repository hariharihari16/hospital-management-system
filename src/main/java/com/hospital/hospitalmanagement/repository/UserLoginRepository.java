package com.hospital.hospitalmanagement.repository;

import com.hospital.hospitalmanagement.entity.UserLogin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserLoginRepository extends JpaRepository<UserLogin, Long> {
    Optional<UserLogin> findByUsername(String username);
    boolean existsByUsername(String username);
    boolean existsByStaffStaffId(Long staffId);
    boolean existsByStaffStaffIdAndUserIdNot(Long staffId, Long userId);
}
