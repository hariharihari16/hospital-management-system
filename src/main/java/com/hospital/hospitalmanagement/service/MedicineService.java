package com.hospital.hospitalmanagement.service;

import com.hospital.hospitalmanagement.dto.MedicineDTO;
import com.hospital.hospitalmanagement.entity.Medicine;
import com.hospital.hospitalmanagement.exception.BadRequestException;
import com.hospital.hospitalmanagement.exception.ResourceNotFoundException;
import com.hospital.hospitalmanagement.repository.MedicineRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MedicineService {

    private final MedicineRepository medicineRepository;
    private final IdAllocationService idAllocationService;

    public MedicineService(MedicineRepository medicineRepository, IdAllocationService idAllocationService) {
        this.medicineRepository = medicineRepository;
        this.idAllocationService = idAllocationService;
    }

    public List<MedicineDTO> getAllMedicines() {
        return medicineRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public MedicineDTO getMedicineById(Long id) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with ID: " + id));
        return convertToDTO(medicine);
    }

    @Transactional
    public MedicineDTO createMedicine(MedicineDTO dto) {
        if (dto.getStock() != null && dto.getStock() < 0) {
            throw new BadRequestException("Medicine stock cannot be negative");
        }
        if (dto.getPrice() != null && dto.getPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Medicine price cannot be negative");
        }

        Long assignedId;
        if (dto.getMedicineId() != null) {
            if (dto.getMedicineId() <= 0) {
                throw new BadRequestException("Medicine ID must be greater than zero");
            }
            if (medicineRepository.existsById(dto.getMedicineId())) {
                throw new BadRequestException("Medicine with ID " + dto.getMedicineId() + " already exists");
            }
            assignedId = dto.getMedicineId();
            idAllocationService.recordCustomId("Medicine", assignedId);
        } else {
            assignedId = idAllocationService.allocateNextId("Medicine", "medicineId");
        }

        Medicine medicine = new Medicine();
        medicine.setMedicineId(assignedId);
        medicine.setMedicineName(dto.getMedicineName());
        medicine.setPrice(dto.getPrice());
        medicine.setDosage(dto.getDosage());
        medicine.setStock(dto.getStock() != null ? dto.getStock() : 0);

        Medicine saved = medicineRepository.save(medicine);
        return convertToDTO(saved);
    }

    @Transactional
    public MedicineDTO updateMedicine(Long id, MedicineDTO dto) {
        if (dto.getStock() != null && dto.getStock() < 0) {
            throw new BadRequestException("Medicine stock cannot be negative");
        }
        if (dto.getPrice() != null && dto.getPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Medicine price cannot be negative");
        }

        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with ID: " + id));

        medicine.setMedicineName(dto.getMedicineName());
        medicine.setPrice(dto.getPrice());
        medicine.setDosage(dto.getDosage());
        medicine.setStock(dto.getStock());

        Medicine updated = medicineRepository.save(medicine);
        return convertToDTO(updated);
    }

    @Transactional
    public void deleteMedicine(Long id) {
        if (!medicineRepository.existsById(id)) {
            throw new ResourceNotFoundException("Medicine not found with ID: " + id);
        }
        medicineRepository.deleteById(id);
    }

    public MedicineDTO convertToDTO(Medicine medicine) {
        return new MedicineDTO(
                medicine.getMedicineId(),
                medicine.getMedicineName(),
                medicine.getPrice(),
                medicine.getDosage(),
                medicine.getStock()
        );
    }
}
