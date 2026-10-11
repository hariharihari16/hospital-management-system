package com.hospital.hospitalmanagement.service;

import com.hospital.hospitalmanagement.dto.BillingDTO;
import com.hospital.hospitalmanagement.entity.Billing;
import com.hospital.hospitalmanagement.entity.Patient;
import com.hospital.hospitalmanagement.exception.BadRequestException;
import com.hospital.hospitalmanagement.exception.ResourceNotFoundException;
import com.hospital.hospitalmanagement.repository.BillingRepository;
import com.hospital.hospitalmanagement.repository.PatientRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BillingService {

    private final BillingRepository billingRepository;
    private final PatientRepository patientRepository;
    private final IdAllocationService idAllocationService;

    public BillingService(BillingRepository billingRepository, PatientRepository patientRepository, IdAllocationService idAllocationService) {
        this.billingRepository = billingRepository;
        this.patientRepository = patientRepository;
        this.idAllocationService = idAllocationService;
    }

    public List<BillingDTO> getAllBills() {
        return billingRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public BillingDTO getBillById(Long id) {
        Billing bill = billingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with ID: " + id));
        return convertToDTO(bill);
    }

    @Transactional
    public BillingDTO createBill(BillingDTO dto) {
        if (dto.getAmount() == null || dto.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Bill amount must be greater than zero");
        }

        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + dto.getPatientId()));

        Long assignedId;
        if (dto.getBillId() != null) {
            if (dto.getBillId() <= 0) {
                throw new BadRequestException("Bill ID must be greater than zero");
            }
            if (billingRepository.existsById(dto.getBillId())) {
                throw new BadRequestException("Bill with ID " + dto.getBillId() + " already exists");
            }
            assignedId = dto.getBillId();
            idAllocationService.recordCustomId("Billing", assignedId);
        } else {
            assignedId = idAllocationService.allocateNextId("Billing", "billId");
        }

        Billing bill = new Billing();
        bill.setBillId(assignedId);
        bill.setBillDate(dto.getBillDate() != null ? dto.getBillDate() : LocalDate.now());
        bill.setServiceDetails(dto.getServiceDetails());
        bill.setAmount(dto.getAmount());
        bill.setPatient(patient);

        Billing saved = billingRepository.save(bill);
        return convertToDTO(saved);
    }

    @Transactional
    public BillingDTO updateBill(Long id, BillingDTO dto) {
        if (dto.getAmount() == null || dto.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Bill amount must be greater than zero");
        }

        Billing bill = billingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with ID: " + id));

        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + dto.getPatientId()));

        bill.setBillDate(dto.getBillDate());
        bill.setServiceDetails(dto.getServiceDetails());
        bill.setAmount(dto.getAmount());
        bill.setPatient(patient);

        Billing updated = billingRepository.save(bill);
        return convertToDTO(updated);
    }

    @Transactional
    public void deleteBill(Long id) {
        if (!billingRepository.existsById(id)) {
            throw new ResourceNotFoundException("Bill not found with ID: " + id);
        }
        billingRepository.deleteById(id);
    }

    public BillingDTO convertToDTO(Billing bill) {
        Long patientId = bill.getPatient() != null ? bill.getPatient().getPatientId() : null;
        String patientName = bill.getPatient() != null ? bill.getPatient().getName() : null;

        return new BillingDTO(
                bill.getBillId(),
                bill.getBillDate(),
                bill.getServiceDetails(),
                bill.getAmount(),
                patientId,
                patientName
        );
    }
}
