package com.hospital.hospitalmanagement.service;

import com.hospital.hospitalmanagement.dto.MedicalRecordDTO;
import com.hospital.hospitalmanagement.entity.Doctor;
import com.hospital.hospitalmanagement.entity.MedicalRecord;
import com.hospital.hospitalmanagement.entity.Patient;
import com.hospital.hospitalmanagement.exception.BadRequestException;
import com.hospital.hospitalmanagement.exception.ResourceNotFoundException;
import com.hospital.hospitalmanagement.repository.DoctorRepository;
import com.hospital.hospitalmanagement.repository.MedicalRecordRepository;
import com.hospital.hospitalmanagement.repository.PatientRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final IdAllocationService idAllocationService;

    public MedicalRecordService(MedicalRecordRepository medicalRecordRepository, PatientRepository patientRepository, DoctorRepository doctorRepository, IdAllocationService idAllocationService) {
        this.medicalRecordRepository = medicalRecordRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.idAllocationService = idAllocationService;
    }

    public List<MedicalRecordDTO> getAllMedicalRecords() {
        return medicalRecordRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public MedicalRecordDTO getMedicalRecordById(Long id) {
        MedicalRecord record = medicalRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medical record not found with ID: " + id));
        return convertToDTO(record);
    }

    @Transactional
    public MedicalRecordDTO createMedicalRecord(MedicalRecordDTO dto) {
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + dto.getPatientId()));

        Doctor doctor = doctorRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with ID: " + dto.getDoctorId()));

        Long assignedId;
        if (dto.getRecordId() != null) {
            if (dto.getRecordId() <= 0) {
                throw new BadRequestException("Medical record ID must be greater than zero");
            }
            if (medicalRecordRepository.existsById(dto.getRecordId())) {
                throw new BadRequestException("Medical record with ID " + dto.getRecordId() + " already exists");
            }
            assignedId = dto.getRecordId();
            idAllocationService.recordCustomId("MedicalRecord", assignedId);
        } else {
            assignedId = idAllocationService.allocateNextId("MedicalRecord", "recordId");
        }

        MedicalRecord record = new MedicalRecord();
        record.setRecordId(assignedId);
        record.setDiagnosis(dto.getDiagnosis());
        record.setTreatment(dto.getTreatment());
        record.setRecordDate(dto.getRecordDate() != null ? dto.getRecordDate() : LocalDate.now());
        record.setNotes(dto.getNotes());
        record.setPatient(patient);
        record.setDoctor(doctor);

        MedicalRecord saved = medicalRecordRepository.save(record);
        return convertToDTO(saved);
    }

    @Transactional
    public MedicalRecordDTO updateMedicalRecord(Long id, MedicalRecordDTO dto) {
        MedicalRecord record = medicalRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medical record not found with ID: " + id));

        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + dto.getPatientId()));

        Doctor doctor = doctorRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with ID: " + dto.getDoctorId()));

        record.setDiagnosis(dto.getDiagnosis());
        record.setTreatment(dto.getTreatment());
        if (dto.getRecordDate() != null) {
            record.setRecordDate(dto.getRecordDate());
        }
        record.setNotes(dto.getNotes());
        record.setPatient(patient);
        record.setDoctor(doctor);

        MedicalRecord updated = medicalRecordRepository.save(record);
        return convertToDTO(updated);
    }

    @Transactional
    public void deleteMedicalRecord(Long id) {
        if (!medicalRecordRepository.existsById(id)) {
            throw new ResourceNotFoundException("Medical record not found with ID: " + id);
        }
        medicalRecordRepository.deleteById(id);
    }

    public MedicalRecordDTO convertToDTO(MedicalRecord record) {
        Long patientId = record.getPatient() != null ? record.getPatient().getPatientId() : null;
        String patientName = record.getPatient() != null ? record.getPatient().getName() : null;
        Long doctorId = record.getDoctor() != null ? record.getDoctor().getDoctorId() : null;
        String doctorName = record.getDoctor() != null ? record.getDoctor().getName() : null;

        return new MedicalRecordDTO(
                record.getRecordId(),
                record.getDiagnosis(),
                record.getTreatment(),
                record.getRecordDate(),
                record.getNotes(),
                patientId,
                patientName,
                doctorId,
                doctorName
        );
    }
}
