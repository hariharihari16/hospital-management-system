package com.hospital.hospitalmanagement.service;

import com.hospital.hospitalmanagement.dto.DoctorDTO;
import com.hospital.hospitalmanagement.entity.Department;
import com.hospital.hospitalmanagement.entity.Doctor;
import com.hospital.hospitalmanagement.exception.BadRequestException;
import com.hospital.hospitalmanagement.exception.ResourceNotFoundException;
import com.hospital.hospitalmanagement.repository.DepartmentRepository;
import com.hospital.hospitalmanagement.repository.DoctorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final DepartmentRepository departmentRepository;
    private final IdAllocationService idAllocationService;

    public DoctorService(DoctorRepository doctorRepository, DepartmentRepository departmentRepository, IdAllocationService idAllocationService) {
        this.doctorRepository = doctorRepository;
        this.departmentRepository = departmentRepository;
        this.idAllocationService = idAllocationService;
    }

    public List<DoctorDTO> getAllDoctors() {
        return doctorRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public DoctorDTO getDoctorById(Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with ID: " + id));
        return convertToDTO(doctor);
    }

    @Transactional
    public DoctorDTO createDoctor(DoctorDTO dto) {
        Department department = departmentRepository.findById(dto.getDeptId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + dto.getDeptId()));

        Long assignedId;
        if (dto.getDoctorId() != null) {
            if (dto.getDoctorId() <= 0) {
                throw new BadRequestException("Doctor ID must be greater than zero");
            }
            if (doctorRepository.existsById(dto.getDoctorId())) {
                throw new BadRequestException("Doctor with ID " + dto.getDoctorId() + " already exists");
            }
            assignedId = dto.getDoctorId();
            idAllocationService.recordCustomId("Doctor", assignedId);
        } else {
            assignedId = idAllocationService.allocateNextId("Doctor", "doctorId");
        }

        Doctor doctor = new Doctor();
        doctor.setDoctorId(assignedId);
        doctor.setName(dto.getName());
        doctor.setSpecialization(dto.getSpecialization());
        doctor.setPhone(dto.getPhone());
        doctor.setEmail(dto.getEmail());
        doctor.setDepartment(department);

        Doctor saved = doctorRepository.save(doctor);
        return convertToDTO(saved);
    }

    @Transactional
    public DoctorDTO updateDoctor(Long id, DoctorDTO dto) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with ID: " + id));

        Department department = departmentRepository.findById(dto.getDeptId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + dto.getDeptId()));

        doctor.setName(dto.getName());
        doctor.setSpecialization(dto.getSpecialization());
        doctor.setPhone(dto.getPhone());
        doctor.setEmail(dto.getEmail());
        doctor.setDepartment(department);

        Doctor updated = doctorRepository.save(doctor);
        return convertToDTO(updated);
    }

    @Transactional
    public void deleteDoctor(Long id) {
        if (!doctorRepository.existsById(id)) {
            throw new ResourceNotFoundException("Doctor not found with ID: " + id);
        }
        doctorRepository.deleteById(id);
    }

    public DoctorDTO convertToDTO(Doctor doctor) {
        Long deptId = doctor.getDepartment() != null ? doctor.getDepartment().getDeptId() : null;
        String deptName = doctor.getDepartment() != null ? doctor.getDepartment().getDeptName() : null;

        return new DoctorDTO(
                doctor.getDoctorId(),
                doctor.getName(),
                doctor.getSpecialization(),
                doctor.getPhone(),
                doctor.getEmail(),
                deptId,
                deptName
        );
    }
}
