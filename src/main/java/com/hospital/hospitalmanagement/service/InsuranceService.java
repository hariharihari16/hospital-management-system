package com.hospital.hospitalmanagement.service;

import com.hospital.hospitalmanagement.dto.InsuranceDTO;
import com.hospital.hospitalmanagement.entity.Insurance;
import com.hospital.hospitalmanagement.entity.Patient;
import com.hospital.hospitalmanagement.exception.BadRequestException;
import com.hospital.hospitalmanagement.exception.ResourceNotFoundException;
import com.hospital.hospitalmanagement.repository.InsuranceRepository;
import com.hospital.hospitalmanagement.repository.PatientRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class InsuranceService {

    private final InsuranceRepository insuranceRepository;
    private final PatientRepository patientRepository;
    private final IdAllocationService idAllocationService;

    public InsuranceService(InsuranceRepository insuranceRepository, PatientRepository patientRepository, IdAllocationService idAllocationService) {
        this.insuranceRepository = insuranceRepository;
        this.patientRepository = patientRepository;
        this.idAllocationService = idAllocationService;
    }

    public List<InsuranceDTO> getAllInsurance() {
        return insuranceRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public InsuranceDTO getInsuranceById(Long id) {
        Insurance insurance = insuranceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Insurance record not found with ID: " + id));
        return convertToDTO(insurance);
    }

    @Transactional
    public InsuranceDTO createInsurance(InsuranceDTO dto) {
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + dto.getPatientId()));

        Long assignedId;
        if (dto.getInsuranceId() != null) {
            if (dto.getInsuranceId() <= 0) {
                throw new BadRequestException("Insurance ID must be greater than zero");
            }
            if (insuranceRepository.existsById(dto.getInsuranceId())) {
                throw new BadRequestException("Insurance record with ID " + dto.getInsuranceId() + " already exists");
            }
            assignedId = dto.getInsuranceId();
            idAllocationService.recordCustomId("Insurance", assignedId);
        } else {
            assignedId = idAllocationService.allocateNextId("Insurance", "insuranceId");
        }

        Insurance insurance = new Insurance();
        insurance.setInsuranceId(assignedId);
        insurance.setProviderName(dto.getProviderName());
        insurance.setPolicyNumber(dto.getPolicyNumber());
        insurance.setCoverageDetails(dto.getCoverageDetails());
        insurance.setValidity(dto.getValidity());
        insurance.setPatient(patient);

        Insurance saved = insuranceRepository.save(insurance);
        return convertToDTO(saved);
    }

    @Transactional
    public InsuranceDTO updateInsurance(Long id, InsuranceDTO dto) {
        Insurance insurance = insuranceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Insurance record not found with ID: " + id));

        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + dto.getPatientId()));

        insurance.setProviderName(dto.getProviderName());
        insurance.setPolicyNumber(dto.getPolicyNumber());
        insurance.setCoverageDetails(dto.getCoverageDetails());
        insurance.setValidity(dto.getValidity());
        insurance.setPatient(patient);

        Insurance updated = insuranceRepository.save(insurance);
        return convertToDTO(updated);
    }

    @Transactional
    public void deleteInsurance(Long id) {
        if (!insuranceRepository.existsById(id)) {
            throw new ResourceNotFoundException("Insurance record not found with ID: " + id);
        }
        insuranceRepository.deleteById(id);
    }

    public InsuranceDTO convertToDTO(Insurance insurance) {
        Long patientId = insurance.getPatient() != null ? insurance.getPatient().getPatientId() : null;
        String patientName = insurance.getPatient() != null ? insurance.getPatient().getName() : null;

        return new InsuranceDTO(
                insurance.getInsuranceId(),
                insurance.getProviderName(),
                insurance.getPolicyNumber(),
                insurance.getCoverageDetails(),
                insurance.getValidity(),
                patientId,
                patientName
        );
    }
}
