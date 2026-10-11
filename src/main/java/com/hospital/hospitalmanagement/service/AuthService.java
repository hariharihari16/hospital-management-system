package com.hospital.hospitalmanagement.service;

import com.hospital.hospitalmanagement.dto.LoginRequestDTO;
import com.hospital.hospitalmanagement.dto.LoginResponseDTO;
import com.hospital.hospitalmanagement.dto.UserLoginDTO;
import com.hospital.hospitalmanagement.entity.Staff;
import com.hospital.hospitalmanagement.entity.UserLogin;
import com.hospital.hospitalmanagement.exception.BadRequestException;
import com.hospital.hospitalmanagement.exception.ResourceNotFoundException;
import com.hospital.hospitalmanagement.repository.StaffRepository;
import com.hospital.hospitalmanagement.repository.UserLoginRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final UserLoginRepository userLoginRepository;
    private final StaffRepository staffRepository;
    private final IdAllocationService idAllocationService;

    public AuthService(UserLoginRepository userLoginRepository, StaffRepository staffRepository, IdAllocationService idAllocationService) {
        this.userLoginRepository = userLoginRepository;
        this.staffRepository = staffRepository;
        this.idAllocationService = idAllocationService;
    }

    public LoginResponseDTO login(LoginRequestDTO request) {
        Optional<UserLogin> userOpt = userLoginRepository.findByUsername(request.getUsername());

        if (!userOpt.isPresent() || !userOpt.get().getPassword().equals(request.getPassword())) {
            return new LoginResponseDTO(false, "Invalid username or password", null, null, null, null, null);
        }

        UserLogin user = userOpt.get();
        Staff staff = user.getStaff();
        Long staffId = staff != null ? staff.getStaffId() : null;
        String staffName = staff != null ? staff.getName() : null;
        String role = staff != null ? staff.getRole() : "USER";

        return new LoginResponseDTO(true, "Login successful", user.getUserId(), user.getUsername(), staffId, staffName, role);
    }

    public List<UserLoginDTO> getAllUsers() {
        return userLoginRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public UserLoginDTO getUserById(Long id) {
        UserLogin user = userLoginRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User login not found with ID: " + id));
        return convertToDTO(user);
    }

    @Transactional
    public UserLoginDTO createUser(UserLoginDTO dto) {
        if (userLoginRepository.existsByUsername(dto.getUsername())) {
            throw new BadRequestException("Username '" + dto.getUsername() + "' is already taken");
        }

        Staff staff = staffRepository.findById(dto.getStaffId())
                .orElseThrow(() -> new ResourceNotFoundException("Staff member not found with ID: " + dto.getStaffId()));

        if (userLoginRepository.existsByStaffStaffId(dto.getStaffId())) {
            throw new BadRequestException("Staff ID " + dto.getStaffId() + " already has a user login associated with it");
        }

        Long assignedId;
        if (dto.getUserId() != null) {
            if (dto.getUserId() <= 0) {
                throw new BadRequestException("User ID must be greater than zero");
            }
            if (userLoginRepository.existsById(dto.getUserId())) {
                throw new BadRequestException("User with ID " + dto.getUserId() + " already exists");
            }
            assignedId = dto.getUserId();
            idAllocationService.recordCustomId("UserLogin", assignedId);
        } else {
            assignedId = idAllocationService.allocateNextId("UserLogin", "userId");
        }

        UserLogin user = new UserLogin();
        user.setUserId(assignedId);
        user.setUsername(dto.getUsername());
        user.setPassword(dto.getPassword());
        user.setStaff(staff);

        UserLogin saved = userLoginRepository.save(user);
        return convertToDTO(saved);
    }

    @Transactional
    public UserLoginDTO updateUser(Long id, UserLoginDTO dto) {
        UserLogin user = userLoginRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User login not found with ID: " + id));

        Staff staff = staffRepository.findById(dto.getStaffId())
                .orElseThrow(() -> new ResourceNotFoundException("Staff member not found with ID: " + dto.getStaffId()));

        if (userLoginRepository.existsByStaffStaffIdAndUserIdNot(dto.getStaffId(), id)) {
            throw new BadRequestException("Staff ID " + dto.getStaffId() + " already has another user login associated with it");
        }

        user.setUsername(dto.getUsername());
        user.setPassword(dto.getPassword());
        user.setStaff(staff);

        UserLogin updated = userLoginRepository.save(user);
        return convertToDTO(updated);
    }

    @Transactional
    public void deleteUser(Long id) {
        if (!userLoginRepository.existsById(id)) {
            throw new ResourceNotFoundException("User login not found with ID: " + id);
        }
        userLoginRepository.deleteById(id);
    }

    public UserLoginDTO convertToDTO(UserLogin user) {
        Long staffId = user.getStaff() != null ? user.getStaff().getStaffId() : null;
        String staffName = user.getStaff() != null ? user.getStaff().getName() : null;

        return new UserLoginDTO(
                user.getUserId(),
                user.getUsername(),
                user.getPassword(),
                staffId,
                staffName
        );
    }
}
