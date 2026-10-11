package com.hospital.hospitalmanagement;

import com.hospital.hospitalmanagement.dto.*;
import com.hospital.hospitalmanagement.entity.*;
import com.hospital.hospitalmanagement.exception.BadRequestException;
import com.hospital.hospitalmanagement.exception.ResourceNotFoundException;
import com.hospital.hospitalmanagement.repository.*;
import com.hospital.hospitalmanagement.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ModuleCreateOperationsTest {

    @Mock
    private PatientRepository patientRepository;
    @Mock
    private DoctorRepository doctorRepository;
    @Mock
    private DepartmentRepository departmentRepository;
    @Mock
    private MedicalRecordRepository medicalRecordRepository;
    @Mock
    private PrescriptionRepository prescriptionRepository;
    @Mock
    private PrescriptionMedicineRepository prescriptionMedicineRepository;
    @Mock
    private MedicineRepository medicineRepository;
    @Mock
    private RoomRepository roomRepository;
    @Mock
    private AdmissionRepository admissionRepository;
    @Mock
    private BillingRepository billingRepository;
    @Mock
    private LabTestRepository labTestRepository;
    @Mock
    private InsuranceRepository insuranceRepository;
    @Mock
    private StaffRepository staffRepository;
    @Mock
    private UserLoginRepository userLoginRepository;
    @Mock
    private IdAllocationService idAllocationService;

    private PatientService patientService;
    private DoctorService doctorService;
    private DepartmentService departmentService;
    private MedicalRecordService medicalRecordService;
    private PrescriptionService prescriptionService;
    private MedicineService medicineService;
    private RoomService roomService;
    private AdmissionService admissionService;
    private BillingService billingService;
    private LabTestService labTestService;
    private InsuranceService insuranceService;
    private StaffService staffService;
    private AuthService authService;

    @BeforeEach
    public void setUp() {
        patientService = new PatientService(patientRepository, idAllocationService);
        doctorService = new DoctorService(doctorRepository, departmentRepository, idAllocationService);
        departmentService = new DepartmentService(departmentRepository, idAllocationService);
        medicalRecordService = new MedicalRecordService(medicalRecordRepository, patientRepository, doctorRepository, idAllocationService);
        prescriptionService = new PrescriptionService(prescriptionRepository, prescriptionMedicineRepository, patientRepository, doctorRepository, medicineRepository, idAllocationService);
        medicineService = new MedicineService(medicineRepository, idAllocationService);
        roomService = new RoomService(roomRepository, idAllocationService);
        admissionService = new AdmissionService(admissionRepository, patientRepository, roomRepository, idAllocationService);
        billingService = new BillingService(billingRepository, patientRepository, idAllocationService);
        labTestService = new LabTestService(labTestRepository, patientRepository, idAllocationService);
        insuranceService = new InsuranceService(insuranceRepository, patientRepository, idAllocationService);
        staffService = new StaffService(staffRepository, departmentRepository, idAllocationService);
        authService = new AuthService(userLoginRepository, staffRepository, idAllocationService);
    }

    // 1. PATIENT CREATE TESTS
    @Test
    public void testCreatePatientAutoAllocatesId() {
        PatientDTO dto = new PatientDTO(null, "Alice Smith", LocalDate.of(1995, 5, 20), "Female", "555-1234", "123 Elm St", "alice@example.com");
        when(idAllocationService.allocateNextId("Patient", "patientId")).thenReturn(10L);
        when(patientRepository.save(any(Patient.class))).thenAnswer(inv -> inv.getArgument(0));

        PatientDTO result = patientService.createPatient(dto);

        assertNotNull(result);
        assertEquals(10L, result.getPatientId());
        assertEquals("Alice Smith", result.getName());
        verify(patientRepository, times(1)).save(any(Patient.class));
    }

    @Test
    public void testCreatePatientCustomIdCollisionThrowsBadRequest() {
        PatientDTO dto = new PatientDTO(5L, "Alice Smith", LocalDate.of(1995, 5, 20), "Female", "555-1234", "123 Elm St", "alice@example.com");
        when(patientRepository.existsById(5L)).thenReturn(true);

        assertThrows(BadRequestException.class, () -> patientService.createPatient(dto));
        verify(patientRepository, never()).save(any(Patient.class));
    }

    // 2. DOCTOR CREATE TESTS
    @Test
    public void testCreateDoctorSuccess() {
        Department dept = new Department(1L, "Cardiology", "Floor 2");
        DoctorDTO dto = new DoctorDTO(null, "Dr. John Doe", "Cardiology", "555-4321", "john@example.com", 1L, null);

        when(departmentRepository.findById(1L)).thenReturn(Optional.of(dept));
        when(idAllocationService.allocateNextId("Doctor", "doctorId")).thenReturn(15L);
        when(doctorRepository.save(any(Doctor.class))).thenAnswer(inv -> inv.getArgument(0));

        DoctorDTO result = doctorService.createDoctor(dto);

        assertNotNull(result);
        assertEquals(15L, result.getDoctorId());
        assertEquals("Dr. John Doe", result.getName());
        assertEquals(1L, result.getDeptId());
    }

    @Test
    public void testCreateDoctorMissingDepartmentThrowsNotFound() {
        DoctorDTO dto = new DoctorDTO(null, "Dr. John Doe", "Cardiology", "555-4321", "john@example.com", 999L, null);
        when(departmentRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> doctorService.createDoctor(dto));
    }

    // 3. DEPARTMENT CREATE TESTS
    @Test
    public void testCreateDepartmentSuccess() {
        DepartmentDTO dto = new DepartmentDTO(null, "Neurology", "Building B");
        when(idAllocationService.allocateNextId("Department", "deptId")).thenReturn(3L);
        when(departmentRepository.save(any(Department.class))).thenAnswer(inv -> inv.getArgument(0));

        DepartmentDTO result = departmentService.createDepartment(dto);

        assertNotNull(result);
        assertEquals(3L, result.getDeptId());
        assertEquals("Neurology", result.getDeptName());
    }

    // 4. MEDICAL RECORD CREATE TESTS
    @Test
    public void testCreateMedicalRecordSuccess() {
        Patient p = new Patient(1L, "Bob", LocalDate.now(), "Male", "555", "Address", "bob@example.com");
        Doctor d = new Doctor(2L, "Dr. Stone", "Neurology", "555", "stone@example.com", null);
        MedicalRecordDTO dto = new MedicalRecordDTO(null, "Migraine", "Painkillers", LocalDate.now(), "Follow up in 2 weeks", 1L, null, 2L, null);

        when(patientRepository.findById(1L)).thenReturn(Optional.of(p));
        when(doctorRepository.findById(2L)).thenReturn(Optional.of(d));
        when(idAllocationService.allocateNextId("MedicalRecord", "recordId")).thenReturn(101L);
        when(medicalRecordRepository.save(any(MedicalRecord.class))).thenAnswer(inv -> inv.getArgument(0));

        MedicalRecordDTO result = medicalRecordService.createMedicalRecord(dto);

        assertNotNull(result);
        assertEquals(101L, result.getRecordId());
        assertEquals("Migraine", result.getDiagnosis());
    }

    // 5. PRESCRIPTION & MEDICINE STOCK TESTS
    @Test
    public void testCreatePrescriptionDeductsStock() {
        Patient p = new Patient(1L, "Bob", LocalDate.now(), "Male", "555", "Address", "bob@example.com");
        Doctor d = new Doctor(2L, "Dr. Stone", "Neurology", "555", "stone@example.com", null);
        Medicine med = new Medicine(5L, "Amoxicillin", new BigDecimal("15.00"), "500mg", 50);

        PrescriptionMedicineDTO pmDto = new PrescriptionMedicineDTO(5L, "Amoxicillin", 10);
        PrescriptionDTO dto = new PrescriptionDTO(null, LocalDate.now(), "Take twice daily", 1L, null, 2L, null, Collections.singletonList(pmDto));

        when(patientRepository.findById(1L)).thenReturn(Optional.of(p));
        when(doctorRepository.findById(2L)).thenReturn(Optional.of(d));
        when(medicineRepository.findById(5L)).thenReturn(Optional.of(med));
        when(idAllocationService.allocateNextId("Prescription", "prescriptionId")).thenReturn(20L);
        when(prescriptionRepository.save(any(Prescription.class))).thenAnswer(inv -> inv.getArgument(0));

        PrescriptionDTO result = prescriptionService.createPrescription(dto);

        assertNotNull(result);
        assertEquals(20L, result.getPrescriptionId());
        assertEquals(40, med.getStock()); // 50 - 10 = 40
        verify(medicineRepository, times(1)).save(med);
    }

    @Test
    public void testCreatePrescriptionInsufficientStockThrowsBadRequest() {
        Patient p = new Patient(1L, "Bob", LocalDate.now(), "Male", "555", "Address", "bob@example.com");
        Doctor d = new Doctor(2L, "Dr. Stone", "Neurology", "555", "stone@example.com", null);
        Medicine med = new Medicine(5L, "Amoxicillin", new BigDecimal("15.00"), "500mg", 5);

        PrescriptionMedicineDTO pmDto = new PrescriptionMedicineDTO(5L, "Amoxicillin", 10);
        PrescriptionDTO dto = new PrescriptionDTO(null, LocalDate.now(), "Take twice daily", 1L, null, 2L, null, Collections.singletonList(pmDto));

        when(patientRepository.findById(1L)).thenReturn(Optional.of(p));
        when(doctorRepository.findById(2L)).thenReturn(Optional.of(d));
        when(medicineRepository.findById(5L)).thenReturn(Optional.of(med));
        when(idAllocationService.allocateNextId("Prescription", "prescriptionId")).thenReturn(20L);
        when(prescriptionRepository.save(any(Prescription.class))).thenAnswer(inv -> inv.getArgument(0));

        assertThrows(BadRequestException.class, () -> prescriptionService.createPrescription(dto));
    }

    // 6. ROOM UNICITY TEST
    @Test
    public void testCreateRoomDuplicateRoomNumberThrowsBadRequest() {
        RoomDTO dto = new RoomDTO(null, "101", "General", "East");
        when(roomRepository.existsByRoomNumber("101")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> roomService.createRoom(dto));
    }

    // 7. ADMISSION DISCHARGE DATE TEST
    @Test
    public void testCreateAdmissionInvalidDischargeDateThrowsBadRequest() {
        Patient p = new Patient(1L, "Bob", LocalDate.now(), "Male", "555", "Address", "bob@example.com");
        Room r = new Room(1L, "101", "General", "East");
        AdmissionDTO dto = new AdmissionDTO(null, LocalDate.of(2026, 10, 15), LocalDate.of(2026, 10, 10), "ADMITTED", 1L, null, 1L, null);

        when(patientRepository.findById(1L)).thenReturn(Optional.of(p));
        when(roomRepository.findById(1L)).thenReturn(Optional.of(r));

        assertThrows(BadRequestException.class, () -> admissionService.createAdmission(dto));
    }

    // 8. BILLING NEGATIVE AMOUNT TEST
    @Test
    public void testCreateBillNegativeAmountThrowsBadRequest() {
        BillingDTO dto = new BillingDTO(null, LocalDate.now(), "Consultation", new BigDecimal("-100.00"), 1L, null);
        assertThrows(BadRequestException.class, () -> billingService.createBill(dto));
    }

    // 9. MEDICINE NEGATIVE STOCK TEST
    @Test
    public void testCreateMedicineNegativeStockThrowsBadRequest() {
        MedicineDTO dto = new MedicineDTO(null, "Aspirin", new BigDecimal("10.00"), "100mg", -5);
        assertThrows(BadRequestException.class, () -> medicineService.createMedicine(dto));
    }

    // 10. LAB TEST CREATE TEST
    @Test
    public void testCreateLabTestSuccess() {
        Patient p = new Patient(1L, "Bob", LocalDate.now(), "Male", "555", "Address", "bob@example.com");
        LabTestDTO dto = new LabTestDTO(null, "Blood Count", LocalDate.now(), "Normal", "COMPLETED", 1L, null);

        when(patientRepository.findById(1L)).thenReturn(Optional.of(p));
        when(idAllocationService.allocateNextId("LabTest", "testId")).thenReturn(77L);
        when(labTestRepository.save(any(LabTest.class))).thenAnswer(inv -> inv.getArgument(0));

        LabTestDTO result = labTestService.createLabTest(dto);

        assertNotNull(result);
        assertEquals(77L, result.getTestId());
        assertEquals("Blood Count", result.getTestName());
    }

    // 11. INSURANCE CREATE TEST
    @Test
    public void testCreateInsuranceSuccess() {
        Patient p = new Patient(1L, "Bob", LocalDate.now(), "Male", "555", "Address", "bob@example.com");
        InsuranceDTO dto = new InsuranceDTO(null, "BlueCross", "POL-999", "Comprehensive", LocalDate.of(2028, 1, 1), 1L, null);

        when(patientRepository.findById(1L)).thenReturn(Optional.of(p));
        when(idAllocationService.allocateNextId("Insurance", "insuranceId")).thenReturn(45L);
        when(insuranceRepository.save(any(Insurance.class))).thenAnswer(inv -> inv.getArgument(0));

        InsuranceDTO result = insuranceService.createInsurance(dto);

        assertNotNull(result);
        assertEquals(45L, result.getInsuranceId());
        assertEquals("BlueCross", result.getProviderName());
    }

    // 12. STAFF CREATE TEST
    @Test
    public void testCreateStaffSuccess() {
        Department dept = new Department(1L, "Cardiology", "Floor 2");
        StaffDTO dto = new StaffDTO(null, "Mark Davis", "Technician", "555-9876", "mark@example.com", 1L, null);

        when(departmentRepository.findById(1L)).thenReturn(Optional.of(dept));
        when(idAllocationService.allocateNextId("Staff", "staffId")).thenReturn(12L);
        when(staffRepository.save(any(Staff.class))).thenAnswer(inv -> inv.getArgument(0));

        StaffDTO result = staffService.createStaff(dto);

        assertNotNull(result);
        assertEquals(12L, result.getStaffId());
        assertEquals("Mark Davis", result.getName());
    }

    // 13. USER LOGIN CREATE TEST
    @Test
    public void testCreateUserLoginSuccess() {
        Staff staff = new Staff(1L, "Mark Davis", "Technician", "555-9876", "mark@example.com", null);
        UserLoginDTO dto = new UserLoginDTO(null, "markd", "secretPass", 1L, null);

        when(userLoginRepository.existsByUsername("markd")).thenReturn(false);
        when(staffRepository.findById(1L)).thenReturn(Optional.of(staff));
        when(userLoginRepository.existsByStaffStaffId(1L)).thenReturn(false);
        when(idAllocationService.allocateNextId("UserLogin", "userId")).thenReturn(88L);
        when(userLoginRepository.save(any(UserLogin.class))).thenAnswer(inv -> inv.getArgument(0));

        UserLoginDTO result = authService.createUser(dto);

        assertNotNull(result);
        assertEquals(88L, result.getUserId());
        assertEquals("markd", result.getUsername());
    }

    @Test
    public void testCreateUserLoginDuplicateUsernameThrowsBadRequest() {
        UserLoginDTO dto = new UserLoginDTO(null, "existingUser", "secretPass", 1L, null);
        when(userLoginRepository.existsByUsername("existingUser")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> authService.createUser(dto));
    }
}
