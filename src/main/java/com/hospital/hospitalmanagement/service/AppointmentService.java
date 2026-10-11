package com.hospital.hospitalmanagement.service;

import com.hospital.hospitalmanagement.dto.AppointmentDTO;
import com.hospital.hospitalmanagement.entity.Appointment;
import com.hospital.hospitalmanagement.entity.Doctor;
import com.hospital.hospitalmanagement.entity.Patient;
import com.hospital.hospitalmanagement.exception.BadRequestException;
import com.hospital.hospitalmanagement.exception.ResourceNotFoundException;
import com.hospital.hospitalmanagement.repository.AppointmentRepository;
import com.hospital.hospitalmanagement.repository.DoctorRepository;
import com.hospital.hospitalmanagement.repository.PatientRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;

    private long lastAllocatedId = 0L;

    public AppointmentService(AppointmentRepository appointmentRepository, DoctorRepository doctorRepository, PatientRepository patientRepository) {
        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
    }

    /**
     * Safely allocates the next unique appointment ID.
     * Synchronized to prevent concurrent collision within the application.
     * Computes the ID as strictly greater than both the current database maximum
     * and the last allocated ID in memory.
     */
    private synchronized Long generateNextApptId() {
        Long maxInDb = appointmentRepository.findMaxApptId();
        long currentMax = (maxInDb != null) ? maxInDb : 0L;
        long nextId = Math.max(currentMax, lastAllocatedId) + 1L;
        lastAllocatedId = nextId;
        return nextId;
    }

    public List<AppointmentDTO> getAllAppointments() {
        return appointmentRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public AppointmentDTO getAppointmentById(Long id) {
        Appointment appt = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + id));
        return convertToDTO(appt);
    }

    @Transactional
    public AppointmentDTO createAppointment(AppointmentDTO dto) {
        Long assignedId;
        if (dto.getApptId() != null) {
            if (dto.getApptId() <= 0) {
                throw new BadRequestException("Appointment ID must be greater than zero");
            }
            if (appointmentRepository.existsById(dto.getApptId())) {
                throw new BadRequestException("Appointment with ID " + dto.getApptId() + " already exists");
            }
            assignedId = dto.getApptId();
            synchronized (this) {
                if (assignedId > lastAllocatedId) {
                    lastAllocatedId = assignedId;
                }
            }
        } else {
            assignedId = generateNextApptId();
        }

        Doctor doctor = doctorRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with ID: " + dto.getDoctorId()));

        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + dto.getPatientId()));

        // Check if doctor is already booked at date and time
        boolean doubleBooked = appointmentRepository.existsByDoctorDoctorIdAndApptDateAndApptTime(
                dto.getDoctorId(), dto.getApptDate(), dto.getApptTime());

        if (doubleBooked) {
            throw new BadRequestException("Doctor already has an appointment scheduled at " + dto.getApptDate() + " " + dto.getApptTime());
        }

        Appointment appt = new Appointment();
        appt.setApptId(assignedId);
        appt.setApptDate(dto.getApptDate());
        appt.setApptTime(dto.getApptTime());
        appt.setReason(dto.getReason());
        appt.setStatus(dto.getStatus() != null ? dto.getStatus() : "SCHEDULED");
        appt.setDoctor(doctor);
        appt.setPatient(patient);

        Appointment saved = appointmentRepository.save(appt);
        return convertToDTO(saved);
    }

    @Transactional
    public AppointmentDTO updateAppointment(Long id, AppointmentDTO dto) {
        Appointment appt = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + id));

        Doctor doctor = doctorRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with ID: " + dto.getDoctorId()));

        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + dto.getPatientId()));

        // Check if doctor is already booked at date and time (excluding current appointment)
        boolean doubleBooked = appointmentRepository.existsByDoctorDoctorIdAndApptDateAndApptTimeAndApptIdNot(
                dto.getDoctorId(), dto.getApptDate(), dto.getApptTime(), id);

        if (doubleBooked) {
            throw new BadRequestException("Doctor already has an appointment scheduled at " + dto.getApptDate() + " " + dto.getApptTime());
        }

        appt.setApptDate(dto.getApptDate());
        appt.setApptTime(dto.getApptTime());
        appt.setReason(dto.getReason());
        appt.setStatus(dto.getStatus());
        appt.setDoctor(doctor);
        appt.setPatient(patient);

        Appointment updated = appointmentRepository.save(appt);
        return convertToDTO(updated);
    }

    @Transactional
    public void deleteAppointment(Long id) {
        if (!appointmentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Appointment not found with ID: " + id);
        }
        appointmentRepository.deleteById(id);
    }

    public AppointmentDTO convertToDTO(Appointment appt) {
        Long doctorId = appt.getDoctor() != null ? appt.getDoctor().getDoctorId() : null;
        String doctorName = appt.getDoctor() != null ? appt.getDoctor().getName() : null;
        Long patientId = appt.getPatient() != null ? appt.getPatient().getPatientId() : null;
        String patientName = appt.getPatient() != null ? appt.getPatient().getName() : null;

        return new AppointmentDTO(
                appt.getApptId(),
                appt.getApptDate(),
                appt.getApptTime(),
                appt.getReason(),
                appt.getStatus(),
                doctorId,
                doctorName,
                patientId,
                patientName
        );
    }
}
