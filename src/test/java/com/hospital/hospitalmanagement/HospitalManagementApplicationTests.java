package com.hospital.hospitalmanagement;

import com.hospital.hospitalmanagement.dto.PatientDTO;
import com.hospital.hospitalmanagement.entity.Patient;
import com.hospital.hospitalmanagement.repository.PatientRepository;
import com.hospital.hospitalmanagement.service.PatientService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class HospitalManagementApplicationTests {

    @Mock
    private PatientRepository patientRepository;

    @InjectMocks
    private PatientService patientService;

    private Patient patient;

    @BeforeEach
    public void setUp() {
        patient = new Patient(1L, "John Doe", LocalDate.of(1990, 1, 1), "Male", "1234567890", "123 Main St", "john@example.com");
    }

    @Test
    public void testGetAllPatients() {
        when(patientRepository.findAll()).thenReturn(Arrays.asList(patient));

        List<PatientDTO> patients = patientService.getAllPatients();

        assertNotNull(patients);
        assertEquals(1, patients.size());
        assertEquals("John Doe", patients.get(0).getName());
        verify(patientRepository, times(1)).findAll();
    }

    @Test
    public void testGetPatientById() {
        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));

        PatientDTO result = patientService.getPatientById(1L);

        assertNotNull(result);
        assertEquals("John Doe", result.getName());
        verify(patientRepository, times(1)).findById(1L);
    }

    @Test
    public void testCreatePatient() {
        PatientDTO dto = new PatientDTO(null, "Jane Doe", LocalDate.of(1995, 5, 5), "Female", "0987654321", "456 Oak St", "jane@example.com");
        Patient savedPatient = new Patient(2L, "Jane Doe", LocalDate.of(1995, 5, 5), "Female", "0987654321", "456 Oak St", "jane@example.com");

        when(patientRepository.save(any(Patient.class))).thenReturn(savedPatient);

        PatientDTO result = patientService.createPatient(dto);

        assertNotNull(result);
        assertEquals(2L, result.getPatientId());
        assertEquals("Jane Doe", result.getName());
        verify(patientRepository, times(1)).save(any(Patient.class));
    }
}
