package com.campusflow.sociale.dto;

import java.time.LocalDateTime;

public record MessageResponse(
        Long id,
        Long conversationId,
        Long senderId,
        String senderDisplayName,
        String content,
        LocalDateTime createdAt,
        boolean ownMessage
) {
}
