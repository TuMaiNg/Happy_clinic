package com.clinic.booking.application.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ServiceResponse {

    private Integer id;
    private String name;
    private String description;
    private Integer durationMinutes;
    private BigDecimal price;
}
