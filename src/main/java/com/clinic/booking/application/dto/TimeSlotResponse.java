package com.clinic.booking.application.dto;

import lombok.Data;
import java.time.LocalTime;

@Data
public class TimeSlotResponse {

    private Integer id;
    private LocalTime startTime;
    private LocalTime endTime;
}
