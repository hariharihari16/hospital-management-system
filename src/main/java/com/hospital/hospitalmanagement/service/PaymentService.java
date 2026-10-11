package com.hospital.hospitalmanagement.service;

import com.hospital.hospitalmanagement.dto.PaymentDTO;
import com.hospital.hospitalmanagement.entity.Billing;
import com.hospital.hospitalmanagement.entity.Payment;
import com.hospital.hospitalmanagement.exception.BadRequestException;
import com.hospital.hospitalmanagement.exception.ResourceNotFoundException;
import com.hospital.hospitalmanagement.repository.BillingRepository;
import com.hospital.hospitalmanagement.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BillingRepository billingRepository;
    private final IdAllocationService idAllocationService;

    public PaymentService(PaymentRepository paymentRepository, BillingRepository billingRepository, IdAllocationService idAllocationService) {
        this.paymentRepository = paymentRepository;
        this.billingRepository = billingRepository;
        this.idAllocationService = idAllocationService;
    }

    public List<PaymentDTO> getAllPayments() {
        return paymentRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public PaymentDTO getPaymentById(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with ID: " + id));
        return convertToDTO(payment);
    }

    @Transactional
    public PaymentDTO createPayment(PaymentDTO dto) {
        if (dto.getAmount() == null || dto.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Payment amount must be greater than zero");
        }

        Billing bill = billingRepository.findById(dto.getBillId())
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with ID: " + dto.getBillId()));

        // Calculate sum of existing payments for this bill
        List<Payment> existingPayments = paymentRepository.findByBillingBillId(dto.getBillId());
        BigDecimal totalPaid = existingPayments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal newTotal = totalPaid.add(dto.getAmount());

        if (newTotal.compareTo(bill.getAmount()) > 0) {
            BigDecimal remaining = bill.getAmount().subtract(totalPaid);
            throw new BadRequestException("Payment amount (" + dto.getAmount() + ") exceeds remaining bill balance (" + remaining + "). Total bill amount: " + bill.getAmount());
        }

        Long assignedId;
        if (dto.getPaymentId() != null) {
            if (dto.getPaymentId() <= 0) {
                throw new BadRequestException("Payment ID must be greater than zero");
            }
            if (paymentRepository.existsById(dto.getPaymentId())) {
                throw new BadRequestException("Payment with ID " + dto.getPaymentId() + " already exists");
            }
            assignedId = dto.getPaymentId();
            idAllocationService.recordCustomId("Payment", assignedId);
        } else {
            assignedId = idAllocationService.allocateNextId("Payment", "paymentId");
        }

        Payment payment = new Payment();
        payment.setPaymentId(assignedId);
        payment.setPaymentDate(dto.getPaymentDate() != null ? dto.getPaymentDate() : LocalDate.now());
        payment.setAmount(dto.getAmount());
        payment.setPaymentMethod(dto.getPaymentMethod());
        payment.setStatus(dto.getStatus() != null ? dto.getStatus() : "COMPLETED");
        payment.setBilling(bill);

        Payment saved = paymentRepository.save(payment);
        return convertToDTO(saved);
    }

    @Transactional
    public PaymentDTO updatePayment(Long id, PaymentDTO dto) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with ID: " + id));

        Billing bill = billingRepository.findById(dto.getBillId())
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with ID: " + dto.getBillId()));

        // Calculate sum of existing payments for this bill excluding current payment
        List<Payment> existingPayments = paymentRepository.findByBillingBillId(dto.getBillId());
        BigDecimal totalPaid = existingPayments.stream()
                .filter(p -> !p.getPaymentId().equals(id))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal newTotal = totalPaid.add(dto.getAmount());

        if (newTotal.compareTo(bill.getAmount()) > 0) {
            BigDecimal remaining = bill.getAmount().subtract(totalPaid);
            throw new BadRequestException("Payment amount (" + dto.getAmount() + ") exceeds remaining bill balance (" + remaining + "). Total bill amount: " + bill.getAmount());
        }

        payment.setPaymentDate(dto.getPaymentDate());
        payment.setAmount(dto.getAmount());
        payment.setPaymentMethod(dto.getPaymentMethod());
        payment.setStatus(dto.getStatus());
        payment.setBilling(bill);

        Payment updated = paymentRepository.save(payment);
        return convertToDTO(updated);
    }

    @Transactional
    public void deletePayment(Long id) {
        if (!paymentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Payment not found with ID: " + id);
        }
        paymentRepository.deleteById(id);
    }

    public PaymentDTO convertToDTO(Payment payment) {
        Long billId = payment.getBilling() != null ? payment.getBilling().getBillId() : null;

        return new PaymentDTO(
                payment.getPaymentId(),
                payment.getPaymentDate(),
                payment.getAmount(),
                payment.getPaymentMethod(),
                payment.getStatus(),
                billId
        );
    }
}
