package com.hospital.hospitalmanagement.controller;

import com.hospital.hospitalmanagement.dto.LoginRequestDTO;
import com.hospital.hospitalmanagement.dto.LoginResponseDTO;
import com.hospital.hospitalmanagement.dto.UserLoginDTO;
import com.hospital.hospitalmanagement.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginRequestDTO request) {
        LoginResponseDTO response = authService.login(request);
        if (!response.isAuthenticated()) {
            return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserLoginDTO>> getAllUsers() {
        return ResponseEntity.ok(authService.getAllUsers());
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserLoginDTO> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(authService.getUserById(id));
    }

    @PostMapping("/users")
    public ResponseEntity<UserLoginDTO> createUser(@Valid @RequestBody UserLoginDTO dto) {
        UserLoginDTO created = authService.createUser(dto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<UserLoginDTO> updateUser(@PathVariable Long id, @Valid @RequestBody UserLoginDTO dto) {
        return ResponseEntity.ok(authService.updateUser(id, dto));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        authService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
