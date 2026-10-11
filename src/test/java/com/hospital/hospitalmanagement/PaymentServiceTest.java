package com.hospital.hospitalmanagement;

import com.hospital.hospitalmanagement.dto.PaymentDTO;
import com.hospital.hospitalmanagement.entity.Billing;
import com.hospital.hospitalmanagement.entity.Patient;
import com.hospital.hospitalmanagement.entity.Payment;
import com.hospital.hospitalmanagement.exception.BadRequestException;
import com.hospital.hospitalmanagement.repository.BillingRepository;
import com.hospital.hospitalmanagement.repository.PaymentRepository;
import com.hospital.hospitalmanagement.service.PaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private BillingRepository billingRepository;

    @Mock
    private com.hospital.hospitalmanagement.service.IdAllocationService idAllocationService;

    @InjectMocks
    private PaymentService paymentService;

    private Billing bill;

    @BeforeEach
    public void setUp() {
        Patient patient = new Patient(1L, "John Doe", LocalDate.of(1990, 1, 1), "Male", "1234567890", "Address", "email@example.com");
        bill = new Billing(100L, LocalDate.now(), "Consultation & Lab", new BigDecimal("500.00"), patient);
    }

    @Test
    public void testCreatePaymentSuccess() {
        PaymentDTO dto = new PaymentDTO(null, LocalDate.now(), new BigDecimal("200.00"), "CREDIT_CARD", "COMPLETED", 100L);
        Payment savedPayment = new Payment(1L, LocalDate.now(), new BigDecimal("200.00"), "CREDIT_CARD", "COMPLETED", bill);

        when(billingRepository.findById(100L)).thenReturn(Optional.of(bill));
        when(paymentRepository.findByBillingBillId(100L)).thenReturn(Collections.emptyList());
        when(idAllocationService.allocateNextId("Payment", "paymentId")).thenReturn(1L);
        when(paymentRepository.save(any(Payment.class))).thenReturn(savedPayment);

        PaymentDTO result = paymentService.createPayment(dto);

        assertNotNull(result);
        assertEquals(1L, result.getPaymentId());
        assertEquals(new BigDecimal("200.00"), result.getAmount());
    }

    @Test
    public void testCreatePaymentExceedsBillAmountThrowsBadRequest() {
        PaymentDTO dto = new PaymentDTO(null, LocalDate.now(), new BigDecimal("600.00"), "CREDIT_CARD", "COMPLETED", 100L);

        when(billingRepository.findById(100L)).thenReturn(Optional.of(bill));
        when(paymentRepository.findByBillingBillId(100L)).thenReturn(Collections.emptyList());

        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            paymentService.createPayment(dto);
        });

        assertTrue(exception.getMessage().contains("exceeds remaining bill balance"));
    }
}
