package com.hospital.hospitalmanagement.service;

import com.hospital.hospitalmanagement.dto.DepartmentDTO;
import com.hospital.hospitalmanagement.entity.Department;
import com.hospital.hospitalmanagement.exception.BadRequestException;
import com.hospital.hospitalmanagement.exception.ResourceNotFoundException;
import com.hospital.hospitalmanagement.repository.DepartmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final IdAllocationService idAllocationService;

    public DepartmentService(DepartmentRepository departmentRepository, IdAllocationService idAllocationService) {
        this.departmentRepository = departmentRepository;
        this.idAllocationService = idAllocationService;
    }

    public List<DepartmentDTO> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public DepartmentDTO getDepartmentById(Long id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + id));
        return convertToDTO(dept);
    }

    @Transactional
    public DepartmentDTO createDepartment(DepartmentDTO dto) {
        Long assignedId;
        if (dto.getDeptId() != null) {
            if (dto.getDeptId() <= 0) {
                throw new BadRequestException("Department ID must be greater than zero");
            }
            if (departmentRepository.existsById(dto.getDeptId())) {
                throw new BadRequestException("Department with ID " + dto.getDeptId() + " already exists");
            }
            assignedId = dto.getDeptId();
            idAllocationService.recordCustomId("Department", assignedId);
        } else {
            assignedId = idAllocationService.allocateNextId("Department", "deptId");
        }

        Department dept = new Department();
        dept.setDeptId(assignedId);
        dept.setDeptName(dto.getDeptName());
        dept.setLocation(dto.getLocation());
        Department saved = departmentRepository.save(dept);
        return convertToDTO(saved);
    }

    @Transactional
    public DepartmentDTO updateDepartment(Long id, DepartmentDTO dto) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + id));
        dept.setDeptName(dto.getDeptName());
        dept.setLocation(dto.getLocation());
        Department updated = departmentRepository.save(dept);
        return convertToDTO(updated);
    }

    @Transactional
    public void deleteDepartment(Long id) {
        if (!departmentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Department not found with ID: " + id);
        }
        departmentRepository.deleteById(id);
    }

    public DepartmentDTO convertToDTO(Department entity) {
        return new DepartmentDTO(entity.getDeptId(), entity.getDeptName(), entity.getLocation());
    }
}
