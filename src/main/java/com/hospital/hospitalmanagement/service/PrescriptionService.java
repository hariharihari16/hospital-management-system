package com.hospital.hospitalmanagement.service;

import com.hospital.hospitalmanagement.dto.PrescriptionDTO;
import com.hospital.hospitalmanagement.dto.PrescriptionMedicineDTO;
import com.hospital.hospitalmanagement.entity.*;
import com.hospital.hospitalmanagement.exception.BadRequestException;
import com.hospital.hospitalmanagement.exception.ResourceNotFoundException;
import com.hospital.hospitalmanagement.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionMedicineRepository prescriptionMedicineRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final MedicineRepository medicineRepository;
    private final IdAllocationService idAllocationService;

    public PrescriptionService(PrescriptionRepository prescriptionRepository,
                               PrescriptionMedicineRepository prescriptionMedicineRepository,
                               PatientRepository patientRepository,
                               DoctorRepository doctorRepository,
                               MedicineRepository medicineRepository,
                               IdAllocationService idAllocationService) {
        this.prescriptionRepository = prescriptionRepository;
        this.prescriptionMedicineRepository = prescriptionMedicineRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.medicineRepository = medicineRepository;
        this.idAllocationService = idAllocationService;
    }

    public List<PrescriptionDTO> getAllPrescriptions() {
        return prescriptionRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public PrescriptionDTO getPrescriptionById(Long id) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with ID: " + id));
        return convertToDTO(prescription);
    }

    @Transactional
    public PrescriptionDTO createPrescription(PrescriptionDTO dto) {
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + dto.getPatientId()));

        Doctor doctor = doctorRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with ID: " + dto.getDoctorId()));

        Long assignedId;
        if (dto.getPrescriptionId() != null) {
            if (dto.getPrescriptionId() <= 0) {
                throw new BadRequestException("Prescription ID must be greater than zero");
            }
            if (prescriptionRepository.existsById(dto.getPrescriptionId())) {
                throw new BadRequestException("Prescription with ID " + dto.getPrescriptionId() + " already exists");
            }
            assignedId = dto.getPrescriptionId();
            idAllocationService.recordCustomId("Prescription", assignedId);
        } else {
            assignedId = idAllocationService.allocateNextId("Prescription", "prescriptionId");
        }

        Prescription prescription = new Prescription();
        prescription.setPrescriptionId(assignedId);
        prescription.setPrescriptionDate(dto.getPrescriptionDate() != null ? dto.getPrescriptionDate() : LocalDate.now());
        prescription.setInstructions(dto.getInstructions());
        prescription.setPatient(patient);
        prescription.setDoctor(doctor);

        Prescription savedPrescription = prescriptionRepository.save(prescription);

        if (dto.getMedicines() != null && !dto.getMedicines().isEmpty()) {
            for (PrescriptionMedicineDTO pmDto : dto.getMedicines()) {
                if (pmDto.getQuantity() == null || pmDto.getQuantity() <= 0) {
                    throw new BadRequestException("Prescription medicine quantity must be greater than zero");
                }
                Medicine medicine = medicineRepository.findById(pmDto.getMedicineId())
                        .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with ID: " + pmDto.getMedicineId()));

                if (medicine.getStock() != null && medicine.getStock() < pmDto.getQuantity()) {
                    throw new BadRequestException("Insufficient stock for medicine '" + medicine.getMedicineName() + "'. Available: " + medicine.getStock() + ", requested: " + pmDto.getQuantity());
                }

                if (medicine.getStock() != null) {
                    medicine.setStock(medicine.getStock() - pmDto.getQuantity());
                    medicineRepository.save(medicine);
                }

                PrescriptionMedicine pm = new PrescriptionMedicine(savedPrescription, medicine, pmDto.getQuantity());
                prescriptionMedicineRepository.save(pm);
            }
        }

        return convertToDTO(savedPrescription);
    }

    @Transactional
    public PrescriptionDTO updatePrescription(Long id, PrescriptionDTO dto) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with ID: " + id));

        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + dto.getPatientId()));

        Doctor doctor = doctorRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with ID: " + dto.getDoctorId()));

        prescription.setPrescriptionDate(dto.getPrescriptionDate());
        prescription.setInstructions(dto.getInstructions());
        prescription.setPatient(patient);
        prescription.setDoctor(doctor);

        Prescription updatedPrescription = prescriptionRepository.save(prescription);

        if (dto.getMedicines() != null) {
            prescriptionMedicineRepository.deleteByIdPrescriptionId(id);
            for (PrescriptionMedicineDTO pmDto : dto.getMedicines()) {
                Medicine medicine = medicineRepository.findById(pmDto.getMedicineId())
                        .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with ID: " + pmDto.getMedicineId()));

                PrescriptionMedicine pm = new PrescriptionMedicine(updatedPrescription, medicine, pmDto.getQuantity());
                prescriptionMedicineRepository.save(pm);
            }
        }

        return convertToDTO(updatedPrescription);
    }

    @Transactional
    public void deletePrescription(Long id) {
        if (!prescriptionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Prescription not found with ID: " + id);
        }
        prescriptionMedicineRepository.deleteByIdPrescriptionId(id);
        prescriptionRepository.deleteById(id);
    }

    public PrescriptionDTO convertToDTO(Prescription prescription) {
        Long patientId = prescription.getPatient() != null ? prescription.getPatient().getPatientId() : null;
        String patientName = prescription.getPatient() != null ? prescription.getPatient().getName() : null;
        Long doctorId = prescription.getDoctor() != null ? prescription.getDoctor().getDoctorId() : null;
        String doctorName = prescription.getDoctor() != null ? prescription.getDoctor().getName() : null;

        List<PrescriptionMedicine> pms = prescriptionMedicineRepository.findByIdPrescriptionId(prescription.getPrescriptionId());
        List<PrescriptionMedicineDTO> medicineDTOs = pms.stream()
                .map(pm -> new PrescriptionMedicineDTO(
                        pm.getMedicine() != null ? pm.getMedicine().getMedicineId() : null,
                        pm.getMedicine() != null ? pm.getMedicine().getMedicineName() : null,
                        pm.getQuantity()
                ))
                .collect(Collectors.toList());

        return new PrescriptionDTO(
                prescription.getPrescriptionId(),
                prescription.getPrescriptionDate(),
                prescription.getInstructions(),
                patientId,
                patientName,
                doctorId,
                doctorName,
                medicineDTOs
        );
    }
}
