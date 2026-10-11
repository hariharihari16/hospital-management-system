package com.hospital.hospitalmanagement.repository;

import com.hospital.hospitalmanagement.entity.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StaffRepository extends JpaRepository<Staff, Long> {
    List<Staff> findByDepartmentDeptId(Long deptId);
}
