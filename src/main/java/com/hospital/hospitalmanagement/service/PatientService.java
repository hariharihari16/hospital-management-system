package com.hospital.hospitalmanagement.service;

import com.hospital.hospitalmanagement.dto.PatientDTO;
import com.hospital.hospitalmanagement.entity.Patient;
import com.hospital.hospitalmanagement.exception.BadRequestException;
import com.hospital.hospitalmanagement.exception.ResourceNotFoundException;
import com.hospital.hospitalmanagement.repository.PatientRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PatientService {

    private final PatientRepository patientRepository;
    private final IdAllocationService idAllocationService;

    public PatientService(PatientRepository patientRepository, IdAllocationService idAllocationService) {
        this.patientRepository = patientRepository;
        this.idAllocationService = idAllocationService;
    }

    public List<PatientDTO> getAllPatients() {
        return patientRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public PatientDTO getPatientById(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + id));
        return convertToDTO(patient);
    }

    @Transactional
    public PatientDTO createPatient(PatientDTO dto) {
        Long assignedId;
        if (dto.getPatientId() != null) {
            if (dto.getPatientId() <= 0) {
                throw new BadRequestException("Patient ID must be greater than zero");
            }
            if (patientRepository.existsById(dto.getPatientId())) {
                throw new BadRequestException("Patient with ID " + dto.getPatientId() + " already exists");
            }
            assignedId = dto.getPatientId();
            idAllocationService.recordCustomId("Patient", assignedId);
        } else {
            assignedId = idAllocationService.allocateNextId("Patient", "patientId");
        }

        Patient patient = new Patient();
        patient.setPatientId(assignedId);
        patient.setName(dto.getName());
        patient.setDob(dto.getDob());
        patient.setGender(dto.getGender());
        patient.setPhone(dto.getPhone());
        patient.setAddress(dto.getAddress());
        patient.setEmail(dto.getEmail());

        Patient saved = patientRepository.save(patient);
        return convertToDTO(saved);
    }

    @Transactional
    public PatientDTO updatePatient(Long id, PatientDTO dto) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + id));

        patient.setName(dto.getName());
        patient.setDob(dto.getDob());
        patient.setGender(dto.getGender());
        patient.setPhone(dto.getPhone());
        patient.setAddress(dto.getAddress());
        patient.setEmail(dto.getEmail());

        Patient updated = patientRepository.save(patient);
        return convertToDTO(updated);
    }

    @Transactional
    public void deletePatient(Long id) {
        if (!patientRepository.existsById(id)) {
            throw new ResourceNotFoundException("Patient not found with ID: " + id);
        }
        patientRepository.deleteById(id);
    }

    public PatientDTO convertToDTO(Patient patient) {
        return new PatientDTO(
                patient.getPatientId(),
                patient.getName(),
                patient.getDob(),
                patient.getGender(),
                patient.getPhone(),
                patient.getAddress(),
                patient.getEmail()
        );
    }
}
