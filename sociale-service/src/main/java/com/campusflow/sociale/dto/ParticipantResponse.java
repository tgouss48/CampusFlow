package com.campusflow.sociale.dto;

import java.time.LocalDateTime;

public record ParticipantResponse(
        Long userId,
        String displayName,
        boolean online,
        LocalDateTime lastSeenAt,
        LocalDateTime lastReadAt
) {
}
