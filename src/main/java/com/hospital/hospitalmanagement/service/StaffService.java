package com.hospital.hospitalmanagement.service;

import com.hospital.hospitalmanagement.dto.StaffDTO;
import com.hospital.hospitalmanagement.entity.Department;
import com.hospital.hospitalmanagement.entity.Staff;
import com.hospital.hospitalmanagement.exception.BadRequestException;
import com.hospital.hospitalmanagement.exception.ResourceNotFoundException;
import com.hospital.hospitalmanagement.repository.DepartmentRepository;
import com.hospital.hospitalmanagement.repository.StaffRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class StaffService {

    private final StaffRepository staffRepository;
    private final DepartmentRepository departmentRepository;
    private final IdAllocationService idAllocationService;

    public StaffService(StaffRepository staffRepository, DepartmentRepository departmentRepository, IdAllocationService idAllocationService) {
        this.staffRepository = staffRepository;
        this.departmentRepository = departmentRepository;
        this.idAllocationService = idAllocationService;
    }

    public List<StaffDTO> getAllStaff() {
        return staffRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public StaffDTO getStaffById(Long id) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff member not found with ID: " + id));
        return convertToDTO(staff);
    }

    @Transactional
    public StaffDTO createStaff(StaffDTO dto) {
        Department department = departmentRepository.findById(dto.getDeptId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + dto.getDeptId()));

        Long assignedId;
        if (dto.getStaffId() != null) {
            if (dto.getStaffId() <= 0) {
                throw new BadRequestException("Staff ID must be greater than zero");
            }
            if (staffRepository.existsById(dto.getStaffId())) {
                throw new BadRequestException("Staff member with ID " + dto.getStaffId() + " already exists");
            }
            assignedId = dto.getStaffId();
            idAllocationService.recordCustomId("Staff", assignedId);
        } else {
            assignedId = idAllocationService.allocateNextId("Staff", "staffId");
        }

        Staff staff = new Staff();
        staff.setStaffId(assignedId);
        staff.setName(dto.getName());
        staff.setRole(dto.getRole());
        staff.setPhone(dto.getPhone());
        staff.setEmail(dto.getEmail());
        staff.setDepartment(department);

        Staff saved = staffRepository.save(staff);
        return convertToDTO(saved);
    }

    @Transactional
    public StaffDTO updateStaff(Long id, StaffDTO dto) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff member not found with ID: " + id));

        Department department = departmentRepository.findById(dto.getDeptId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + dto.getDeptId()));

        staff.setName(dto.getName());
        staff.setRole(dto.getRole());
        staff.setPhone(dto.getPhone());
        staff.setEmail(dto.getEmail());
        staff.setDepartment(department);

        Staff updated = staffRepository.save(staff);
        return convertToDTO(updated);
    }

    @Transactional
    public void deleteStaff(Long id) {
        if (!staffRepository.existsById(id)) {
            throw new ResourceNotFoundException("Staff member not found with ID: " + id);
        }
        staffRepository.deleteById(id);
    }

    public StaffDTO convertToDTO(Staff staff) {
        Long deptId = staff.getDepartment() != null ? staff.getDepartment().getDeptId() : null;
        String deptName = staff.getDepartment() != null ? staff.getDepartment().getDeptName() : null;

        return new StaffDTO(
                staff.getStaffId(),
                staff.getName(),
                staff.getRole(),
                staff.getPhone(),
                staff.getEmail(),
                deptId,
                deptName
        );
    }
}
