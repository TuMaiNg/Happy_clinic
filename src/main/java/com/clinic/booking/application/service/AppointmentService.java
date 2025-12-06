package com.clinic.booking.application.service;

import com.clinic.booking.application.dto.*;
import com.clinic.booking.application.repository.*;
import com.clinic.booking.domain.*;
import com.clinic.booking.shared.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final ServiceRepository serviceRepository;

    @Transactional
    public AppointmentResponse createAppointment(AppointmentRequest request) {
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new BusinessException("Patient not found"));

        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new BusinessException("Doctor not found"));

        TimeSlot timeSlot = timeSlotRepository.findById(request.getSlotId())
                .orElseThrow(() -> new BusinessException("Time slot not found"));

        LocalDate date = request.getAppointmentDate();

        if (!date.isAfter(LocalDate.now())) {
            throw new BusinessException("Appointment date must be in the future");
        }

        boolean isDayOff = appointmentRepository.findByDoctorIdAndAppointmentDate(doctor.getId(), date)
                .stream()
                .anyMatch(a -> true); 
        if (isDayOff) {
            throw new BusinessException("The doctor is not available on the selected date");    
        }

        boolean alreadyBooked = appointmentRepository.findByDoctorIdAndAppointmentDateAndSlotId(
                doctor.getId(), date, timeSlot.getId()).isPresent();

        if (alreadyBooked) {
            throw new BusinessException("This time slot is already booked");
        }

        com.clinic.booking.domain.Service domainService = null;
        if (request.getServiceId() != null) {
            domainService = serviceRepository.findById(request.getServiceId())
                    .orElseThrow(() -> new BusinessException("Service not found"));
        }

        Appointment appointment = Appointment.builder()
                .patient(patient)
                .doctor(doctor)
                .service(domainService)
                .appointmentDate(date)
                .startTime(timeSlot.getStartTime())
                .endTime(timeSlot.getEndTime())
                .schedule(timeSlot.getSchedule())
                .slot(timeSlot)
                .status(Appointment.Status.pending)
                .build();

        Appointment saved = appointmentRepository.save(appointment);

        return mapToResponse(saved);
    }

    public List<TimeSlotResponse> getAvailableSlots(Integer doctorId, LocalDate date) {
        doctorRepository.findById(doctorId)
                .orElseThrow(() -> new BusinessException("Doctor not found"));

        List<TimeSlot> allSlots = timeSlotRepository.findAllActive();

        List<Integer> bookedSlotIds = appointmentRepository
                .findByDoctorIdAndAppointmentDate(doctorId, date)
                .stream()
                .map(a -> a.getSlot().getId())
                .toList();

        return allSlots.stream()
                .filter(slot -> !bookedSlotIds.contains(slot.getId()))
                .map(this::mapToTimeSlotResponse)
                .toList();
    }


    public Page<AppointmentResponse> getPatientAppointments(Integer patientId, Pageable pageable) {
        patientRepository.findById(patientId)
                .orElseThrow(() -> new BusinessException("Patient not found"));

        return appointmentRepository.findByPatientId(patientId, pageable)
                .map(this::mapToResponse);
    }

    public List<AppointmentResponse> getPatientAppointmentHistory(Integer patientId) {
        patientRepository.findById(patientId)
                .orElseThrow(() -> new BusinessException("Patient not found"));

        return appointmentRepository.findByPatientIdOrderByAppointmentDateDesc(patientId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<AppointmentResponse> getDoctorAppointmentsForDate(Integer doctorId, LocalDate date) {
        doctorRepository.findById(doctorId)
                .orElseThrow(() -> new BusinessException("Doctor not found"));

        return appointmentRepository.findByDoctorIdAndAppointmentDate(doctorId, date)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<AppointmentResponse> getDoctorUpcomingAppointments(Integer doctorId) {
        doctorRepository.findById(doctorId)
                .orElseThrow(() -> new BusinessException("Doctor not found"));

        return appointmentRepository.findByDoctorIdOrderByAppointmentDateDesc(doctorId)
                .stream()
                .filter(a -> !a.getAppointmentDate().isBefore(LocalDate.now()))
                .map(this::mapToResponse)
                .toList();
    }

    public List<AppointmentResponse> getDoctorAppointmentsByDateRange(Integer doctorId, LocalDate from, LocalDate to) {
        doctorRepository.findById(doctorId)
                .orElseThrow(() -> new BusinessException("Doctor not found"));

        if (from.isAfter(to)) {
            throw new BusinessException("From date cannot be after to date");
        }

        return appointmentRepository.findByDoctorIdAndAppointmentDateBetween(doctorId, from, to)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public AppointmentResponse getAppointmentById(Integer appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new BusinessException("Appointment not found"));

        return mapToResponse(appointment);
    }

    @Transactional
    public AppointmentResponse confirmAppointment(Integer appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new BusinessException("Appointment not found"));

        if (appointment.getStatus() == Appointment.Status.confirmed) {
            throw new BusinessException("Appointment is already confirmed");
        }

        if (appointment.getStatus() == Appointment.Status.cancelled) {
            throw new BusinessException("Cannot confirm a cancelled appointment");
        }

        appointment.setStatus(Appointment.Status.confirmed);
        appointment.setUpdatedAt(LocalDateTime.now());
        Appointment saved = appointmentRepository.save(appointment);

        return mapToResponse(saved);
    }

    @Transactional
    public void cancelAppointment(Integer appointmentId, Integer patientId, String reason) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new BusinessException("Appointment not found"));

        if (appointment.getPatient().getId() != patientId) {
            throw new BusinessException("You can only cancel your own appointments");
        }

        if (appointment.getStatus() == Appointment.Status.cancelled) {
            throw new BusinessException("Appointment is already cancelled");
        }

        appointment.setStatus(Appointment.Status.cancelled);
        appointment.setReasonCancel(reason);
        appointment.setUpdatedAt(LocalDateTime.now());
        appointmentRepository.save(appointment);
    }



    private AppointmentResponse mapToResponse(Appointment a) {
        AppointmentResponse response = new AppointmentResponse();
        response.setId(a.getId());
        
        PatientResponse patientResponse = new PatientResponse();
        patientResponse.setId(a.getPatient().getId());
        patientResponse.setFullName(a.getPatient().getFullName());
        patientResponse.setPhone(a.getPatient().getPhone());
        response.setPatient(patientResponse);

        DoctorResponse doctorResponse = new DoctorResponse();
        doctorResponse.setId(a.getDoctor().getId());
        doctorResponse.setFullName(a.getDoctor().getFullName());
        doctorResponse.setSpeciality(a.getDoctor().getSpeciality());
        doctorResponse.setDescription(a.getDoctor().getDescription());
        doctorResponse.setAvatar(a.getDoctor().getAvatar());
        response.setDoctor(doctorResponse);

        if (a.getService() != null) {
            ServiceResponse serviceResponse = new ServiceResponse();
            serviceResponse.setId(a.getService().getId());
            serviceResponse.setName(a.getService().getName());
            response.setService(serviceResponse);
        }

        TimeSlotResponse slotResponse = new TimeSlotResponse();
        slotResponse.setId(a.getSlot().getId());
        slotResponse.setStartTime(a.getSlot().getStartTime());
        slotResponse.setEndTime(a.getSlot().getEndTime());
        response.setSlot(slotResponse);

        response.setAppointmentDate(a.getAppointmentDate());
        response.setStatus(a.getStatus());
        response.setReasonCancel(a.getReasonCancel());
        response.setCreatedAt(a.getCreatedAt());
        response.setUpdatedAt(a.getUpdatedAt());

        return response;
    }

    private TimeSlotResponse mapToTimeSlotResponse(TimeSlot slot) {
        TimeSlotResponse response = new TimeSlotResponse();
        response.setId(slot.getId());
        response.setStartTime(slot.getStartTime());
        response.setEndTime(slot.getEndTime());
        return response;
    }

}