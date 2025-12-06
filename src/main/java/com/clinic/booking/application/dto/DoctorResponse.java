package com.clinic.booking.application.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class DoctorResponse {

    private Integer id;
    private String fullName;
    private String speciality;
    private String description;
    private String avatar;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
