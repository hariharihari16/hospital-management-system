package com.hospital.hospitalmanagement.service;

import com.hospital.hospitalmanagement.dto.AdmissionDTO;
import com.hospital.hospitalmanagement.entity.Admission;
import com.hospital.hospitalmanagement.entity.Patient;
import com.hospital.hospitalmanagement.entity.Room;
import com.hospital.hospitalmanagement.exception.BadRequestException;
import com.hospital.hospitalmanagement.exception.ResourceNotFoundException;
import com.hospital.hospitalmanagement.repository.AdmissionRepository;
import com.hospital.hospitalmanagement.repository.PatientRepository;
import com.hospital.hospitalmanagement.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdmissionService {

    private static final List<String> ACTIVE_STATUSES = Arrays.asList("ACTIVE", "ADMITTED", "OCCUPIED", "Active", "Admitted", "Occupied");

    private final AdmissionRepository admissionRepository;
    private final PatientRepository patientRepository;
    private final RoomRepository roomRepository;
    private final IdAllocationService idAllocationService;

    public AdmissionService(AdmissionRepository admissionRepository, PatientRepository patientRepository, RoomRepository roomRepository, IdAllocationService idAllocationService) {
        this.admissionRepository = admissionRepository;
        this.patientRepository = patientRepository;
        this.roomRepository = roomRepository;
        this.idAllocationService = idAllocationService;
    }

    public List<AdmissionDTO> getAllAdmissions() {
        return admissionRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public AdmissionDTO getAdmissionById(Long id) {
        Admission admission = admissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Admission not found with ID: " + id));
        return convertToDTO(admission);
    }

    @Transactional
    public AdmissionDTO createAdmission(AdmissionDTO dto) {
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + dto.getPatientId()));

        Room room = roomRepository.findById(dto.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with ID: " + dto.getRoomId()));

        LocalDate admissionDate = dto.getAdmissionDate() != null ? dto.getAdmissionDate() : LocalDate.now();
        if (dto.getDischargeDate() != null && dto.getDischargeDate().isBefore(admissionDate)) {
            throw new BadRequestException("Discharge date cannot be before admission date");
        }

        String status = dto.getStatus() != null ? dto.getStatus() : "ADMITTED";

        if (ACTIVE_STATUSES.contains(status.toUpperCase())) {
            boolean roomOccupied = admissionRepository.existsByRoomRoomIdAndStatusIn(dto.getRoomId(), ACTIVE_STATUSES);
            if (roomOccupied) {
                throw new BadRequestException("Room ID " + dto.getRoomId() + " is already assigned to an active admission");
            }
        }

        Long assignedId;
        if (dto.getAdmissionId() != null) {
            if (dto.getAdmissionId() <= 0) {
                throw new BadRequestException("Admission ID must be greater than zero");
            }
            if (admissionRepository.existsById(dto.getAdmissionId())) {
                throw new BadRequestException("Admission with ID " + dto.getAdmissionId() + " already exists");
            }
            assignedId = dto.getAdmissionId();
            idAllocationService.recordCustomId("Admission", assignedId);
        } else {
            assignedId = idAllocationService.allocateNextId("Admission", "admissionId");
        }

        Admission admission = new Admission();
        admission.setAdmissionId(assignedId);
        admission.setAdmissionDate(admissionDate);
        admission.setDischargeDate(dto.getDischargeDate());
        admission.setStatus(status);
        admission.setPatient(patient);
        admission.setRoom(room);

        Admission saved = admissionRepository.save(admission);
        return convertToDTO(saved);
    }

    @Transactional
    public AdmissionDTO updateAdmission(Long id, AdmissionDTO dto) {
        Admission admission = admissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Admission not found with ID: " + id));

        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + dto.getPatientId()));

        Room room = roomRepository.findById(dto.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with ID: " + dto.getRoomId()));

        LocalDate admissionDate = dto.getAdmissionDate() != null ? dto.getAdmissionDate() : admission.getAdmissionDate();
        if (dto.getDischargeDate() != null && admissionDate != null && dto.getDischargeDate().isBefore(admissionDate)) {
            throw new BadRequestException("Discharge date cannot be before admission date");
        }

        String status = dto.getStatus();

        if (ACTIVE_STATUSES.contains(status.toUpperCase())) {
            boolean roomOccupied = admissionRepository.existsByRoomRoomIdAndStatusInAndAdmissionIdNot(dto.getRoomId(), ACTIVE_STATUSES, id);
            if (roomOccupied) {
                throw new BadRequestException("Room ID " + dto.getRoomId() + " is already assigned to an active admission");
            }
        }

        admission.setAdmissionDate(dto.getAdmissionDate());
        admission.setDischargeDate(dto.getDischargeDate());
        admission.setStatus(status);
        admission.setPatient(patient);
        admission.setRoom(room);

        Admission updated = admissionRepository.save(admission);
        return convertToDTO(updated);
    }

    @Transactional
    public void deleteAdmission(Long id) {
        if (!admissionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Admission not found with ID: " + id);
        }
        admissionRepository.deleteById(id);
    }

    public AdmissionDTO convertToDTO(Admission admission) {
        Long patientId = admission.getPatient() != null ? admission.getPatient().getPatientId() : null;
        String patientName = admission.getPatient() != null ? admission.getPatient().getName() : null;
        Long roomId = admission.getRoom() != null ? admission.getRoom().getRoomId() : null;
        String roomNumber = admission.getRoom() != null ? admission.getRoom().getRoomNumber() : null;

        return new AdmissionDTO(
                admission.getAdmissionId(),
                admission.getAdmissionDate(),
                admission.getDischargeDate(),
                admission.getStatus(),
                patientId,
                patientName,
                roomId,
                roomNumber
        );
    }
}
