package com.clinic.booking.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    public enum Type { email, sms }

    public enum Status { pending, sent, failed }

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('email','sms') DEFAULT 'email')")
    private Type type;

    @Column(length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(length = 255)
    private String recipient;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('pending','sent','failed') DEFAULT 'pending')")
    private Status status;

    @Builder.Default
    @Column(name = "retry_count", columnDefinition = "INT DEFAULT 0")
    private Integer retryCount = 0;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;
}
