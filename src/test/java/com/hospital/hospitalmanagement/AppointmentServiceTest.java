package com.hospital.hospitalmanagement;

import com.hospital.hospitalmanagement.dto.AppointmentDTO;
import com.hospital.hospitalmanagement.entity.Appointment;
import com.hospital.hospitalmanagement.entity.Doctor;
import com.hospital.hospitalmanagement.entity.Patient;
import com.hospital.hospitalmanagement.exception.BadRequestException;
import com.hospital.hospitalmanagement.exception.ResourceNotFoundException;
import com.hospital.hospitalmanagement.repository.AppointmentRepository;
import com.hospital.hospitalmanagement.repository.DoctorRepository;
import com.hospital.hospitalmanagement.repository.PatientRepository;
import com.hospital.hospitalmanagement.service.AppointmentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AppointmentServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private PatientRepository patientRepository;

    @InjectMocks
    private AppointmentService appointmentService;

    private Doctor doctor;
    private Patient patient;

    @BeforeEach
    public void setUp() {
        doctor = new Doctor(1L, "Dr. Sarah Jenkins", "Cardiology", "1234567890", "sarah@hospital.com", null);
        patient = new Patient(2L, "Eleanor Brooks", LocalDate.of(1985, 3, 15), "Female", "9876543210", "123 Main St", "eleanor@example.com");
    }

    @Test
    public void testCreateAppointmentAutoAllocatesIdWhenNull() {
        AppointmentDTO dto = new AppointmentDTO(
                null,
                LocalDate.of(2026, 10, 15),
                LocalTime.of(10, 30),
                "Checkup",
                "SCHEDULED",
                1L, null,
                2L, null
        );

        when(appointmentRepository.findMaxApptId()).thenReturn(4L);
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
        when(patientRepository.findById(2L)).thenReturn(Optional.of(patient));
        when(appointmentRepository.existsByDoctorDoctorIdAndApptDateAndApptTime(1L, dto.getApptDate(), dto.getApptTime())).thenReturn(false);
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AppointmentDTO result = appointmentService.createAppointment(dto);

        assertNotNull(result);
        assertEquals(5L, result.getApptId()); // 4 + 1
        assertEquals("Checkup", result.getReason());
        assertEquals("SCHEDULED", result.getStatus());
        assertEquals(1L, result.getDoctorId());
        assertEquals(2L, result.getPatientId());
        verify(appointmentRepository, times(1)).save(any(Appointment.class));
    }

    @Test
    public void testCreateAppointmentAutoAllocatesOneWhenTableIsEmpty() {
        AppointmentDTO dto = new AppointmentDTO(
                null,
                LocalDate.of(2026, 10, 15),
                LocalTime.of(10, 30),
                "First Appointment",
                "SCHEDULED",
                1L, null,
                2L, null
        );

        when(appointmentRepository.findMaxApptId()).thenReturn(null);
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
        when(patientRepository.findById(2L)).thenReturn(Optional.of(patient));
        when(appointmentRepository.existsByDoctorDoctorIdAndApptDateAndApptTime(1L, dto.getApptDate(), dto.getApptTime())).thenReturn(false);
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AppointmentDTO result = appointmentService.createAppointment(dto);

        assertNotNull(result);
        assertEquals(1L, result.getApptId()); // null -> 0 + 1 = 1
    }

    @Test
    public void testCreateAppointmentWithClientSuppliedId() {
        AppointmentDTO dto = new AppointmentDTO(
                100L,
                LocalDate.of(2026, 10, 15),
                LocalTime.of(10, 30),
                "Manual ID Checkup",
                "SCHEDULED",
                1L, null,
                2L, null
        );

        when(appointmentRepository.existsById(100L)).thenReturn(false);
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
        when(patientRepository.findById(2L)).thenReturn(Optional.of(patient));
        when(appointmentRepository.existsByDoctorDoctorIdAndApptDateAndApptTime(1L, dto.getApptDate(), dto.getApptTime())).thenReturn(false);
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AppointmentDTO result = appointmentService.createAppointment(dto);

        assertNotNull(result);
        assertEquals(100L, result.getApptId());
    }

    @Test
    public void testCreateAppointmentWithExistingIdThrowsBadRequest() {
        AppointmentDTO dto = new AppointmentDTO(
                4L,
                LocalDate.of(2026, 10, 15),
                LocalTime.of(10, 30),
                "Duplicate ID",
                "SCHEDULED",
                1L, null,
                2L, null
        );

        when(appointmentRepository.existsById(4L)).thenReturn(true);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> {
            appointmentService.createAppointment(dto);
        });

        assertTrue(ex.getMessage().contains("already exists"));
        verify(appointmentRepository, never()).save(any(Appointment.class));
    }

    @Test
    public void testCreateAppointmentWithInvalidIdThrowsBadRequest() {
        AppointmentDTO dto = new AppointmentDTO(
                -1L,
                LocalDate.of(2026, 10, 15),
                LocalTime.of(10, 30),
                "Negative ID",
                "SCHEDULED",
                1L, null,
                2L, null
        );

        BadRequestException ex = assertThrows(BadRequestException.class, () -> {
            appointmentService.createAppointment(dto);
        });

        assertTrue(ex.getMessage().contains("greater than zero"));
    }

    @Test
    public void testCreateAppointmentDoubleBookedThrowsBadRequest() {
        AppointmentDTO dto = new AppointmentDTO(
                null,
                LocalDate.of(2026, 10, 15),
                LocalTime.of(10, 30),
                "Checkup",
                "SCHEDULED",
                1L, null,
                2L, null
        );

        when(appointmentRepository.findMaxApptId()).thenReturn(5L);
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
        when(patientRepository.findById(2L)).thenReturn(Optional.of(patient));
        when(appointmentRepository.existsByDoctorDoctorIdAndApptDateAndApptTime(1L, dto.getApptDate(), dto.getApptTime())).thenReturn(true);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> {
            appointmentService.createAppointment(dto);
        });

        assertTrue(ex.getMessage().contains("already has an appointment scheduled"));
        verify(appointmentRepository, never()).save(any(Appointment.class));
    }

    @Test
    public void testCreateAppointmentDoctorNotFoundThrowsResourceNotFound() {
        AppointmentDTO dto = new AppointmentDTO(
                null,
                LocalDate.of(2026, 10, 15),
                LocalTime.of(10, 30),
                "Checkup",
                "SCHEDULED",
                999L, null,
                2L, null
        );

        when(appointmentRepository.findMaxApptId()).thenReturn(5L);
        when(doctorRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            appointmentService.createAppointment(dto);
        });
    }

    @Test
    public void testCreateAppointmentPatientNotFoundThrowsResourceNotFound() {
        AppointmentDTO dto = new AppointmentDTO(
                null,
                LocalDate.of(2026, 10, 15),
                LocalTime.of(10, 30),
                "Checkup",
                "SCHEDULED",
                1L, null,
                999L, null
        );

        when(appointmentRepository.findMaxApptId()).thenReturn(5L);
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
        when(patientRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            appointmentService.createAppointment(dto);
        });
    }
}
