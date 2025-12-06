package com.clinic.booking.application.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class PatientResponse {

    private long id;
    private String fullName;
    private String phone;
    private LocalDate birthday;
    private Gender gender;
    private String address;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public enum Gender {
        MALE, FEMALE, OTHER
    }
}
