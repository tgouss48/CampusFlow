package com.campusflow.sociale.dto;

import java.time.LocalDateTime;

public record PresenceResponse(
        Long userId,
        boolean online,
        LocalDateTime lastSeenAt
) {
}
