package com.clinic.booking.shared;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {

    private boolean success;
    private String message;
    private T data;
    private LocalDateTime timestamp;
    private Object errors;

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, "Success", data, LocalDateTime.now(), null);
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(true, message, data, LocalDateTime.now(), null);
    }

    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message, null, LocalDateTime.now(), null);
    }

    public static <T> ApiResponse<T> error(String message, List<String> errors) {
        return new ApiResponse<>(false, message, null, LocalDateTime.now(), errors);
    }

    public static <T> ApiResponse<T> error(String message, Map<String, String> fieldErrors) {
        return new ApiResponse<>(false, message, null, LocalDateTime.now(), fieldErrors);
    }

    public static <T> ApiResponse<T> error(String message, Object errorDetails) {
        return new ApiResponse<>(false, message, null, LocalDateTime.now(), errorDetails);
    }
}