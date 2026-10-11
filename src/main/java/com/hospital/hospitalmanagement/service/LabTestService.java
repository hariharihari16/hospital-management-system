package com.hospital.hospitalmanagement.service;

import com.hospital.hospitalmanagement.dto.LabTestDTO;
import com.hospital.hospitalmanagement.entity.LabTest;
import com.hospital.hospitalmanagement.entity.Patient;
import com.hospital.hospitalmanagement.exception.BadRequestException;
import com.hospital.hospitalmanagement.exception.ResourceNotFoundException;
import com.hospital.hospitalmanagement.repository.LabTestRepository;
import com.hospital.hospitalmanagement.repository.PatientRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LabTestService {

    private final LabTestRepository labTestRepository;
    private final PatientRepository patientRepository;
    private final IdAllocationService idAllocationService;

    public LabTestService(LabTestRepository labTestRepository, PatientRepository patientRepository, IdAllocationService idAllocationService) {
        this.labTestRepository = labTestRepository;
        this.patientRepository = patientRepository;
        this.idAllocationService = idAllocationService;
    }

    public List<LabTestDTO> getAllLabTests() {
        return labTestRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public LabTestDTO getLabTestById(Long id) {
        LabTest labTest = labTestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lab test not found with ID: " + id));
        return convertToDTO(labTest);
    }

    @Transactional
    public LabTestDTO createLabTest(LabTestDTO dto) {
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + dto.getPatientId()));

        Long assignedId;
        if (dto.getTestId() != null) {
            if (dto.getTestId() <= 0) {
                throw new BadRequestException("Lab test ID must be greater than zero");
            }
            if (labTestRepository.existsById(dto.getTestId())) {
                throw new BadRequestException("Lab test with ID " + dto.getTestId() + " already exists");
            }
            assignedId = dto.getTestId();
            idAllocationService.recordCustomId("LabTest", assignedId);
        } else {
            assignedId = idAllocationService.allocateNextId("LabTest", "testId");
        }

        LabTest labTest = new LabTest();
        labTest.setTestId(assignedId);
        labTest.setTestName(dto.getTestName());
        labTest.setTestDate(dto.getTestDate() != null ? dto.getTestDate() : LocalDate.now());
        labTest.setResult(dto.getResult());
        labTest.setStatus(dto.getStatus() != null ? dto.getStatus() : "PENDING");
        labTest.setPatient(patient);

        LabTest saved = labTestRepository.save(labTest);
        return convertToDTO(saved);
    }

    @Transactional
    public LabTestDTO updateLabTest(Long id, LabTestDTO dto) {
        LabTest labTest = labTestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lab test not found with ID: " + id));

        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + dto.getPatientId()));

        labTest.setTestName(dto.getTestName());
        if (dto.getTestDate() != null) {
            labTest.setTestDate(dto.getTestDate());
        }
        labTest.setResult(dto.getResult());
        labTest.setStatus(dto.getStatus());
        labTest.setPatient(patient);

        LabTest updated = labTestRepository.save(labTest);
        return convertToDTO(updated);
    }

    @Transactional
    public void deleteLabTest(Long id) {
        if (!labTestRepository.existsById(id)) {
            throw new ResourceNotFoundException("Lab test not found with ID: " + id);
        }
        labTestRepository.deleteById(id);
    }

    public LabTestDTO convertToDTO(LabTest labTest) {
        Long patientId = labTest.getPatient() != null ? labTest.getPatient().getPatientId() : null;
        String patientName = labTest.getPatient() != null ? labTest.getPatient().getName() : null;

        return new LabTestDTO(
                labTest.getTestId(),
                labTest.getTestName(),
                labTest.getTestDate(),
                labTest.getResult(),
                labTest.getStatus(),
                patientId,
                patientName
        );
    }
}
