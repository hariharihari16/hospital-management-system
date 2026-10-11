package com.hospital.hospitalmanagement.controller;

import com.hospital.hospitalmanagement.dto.BillingDTO;
import com.hospital.hospitalmanagement.service.BillingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/bills")
public class BillingController {

    private final BillingService billingService;

    public BillingController(BillingService billingService) {
        this.billingService = billingService;
    }

    @GetMapping
    public ResponseEntity<List<BillingDTO>> getAllBills() {
        return ResponseEntity.ok(billingService.getAllBills());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BillingDTO> getBillById(@PathVariable Long id) {
        return ResponseEntity.ok(billingService.getBillById(id));
    }

    @PostMapping
    public ResponseEntity<BillingDTO> createBill(@Valid @RequestBody BillingDTO dto) {
        BillingDTO created = billingService.createBill(dto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BillingDTO> updateBill(@PathVariable Long id, @Valid @RequestBody BillingDTO dto) {
        return ResponseEntity.ok(billingService.updateBill(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBill(@PathVariable Long id) {
        billingService.deleteBill(id);
        return ResponseEntity.noContent().build();
    }
}
