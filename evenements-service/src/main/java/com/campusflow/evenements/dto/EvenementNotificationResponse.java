package com.campusflow.evenements.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvenementNotificationResponse {

    private Long id;
    private String message;
    private Long evenementId;
    private boolean read;
    private LocalDateTime readAt;
    private LocalDateTime occurredAt;
}
