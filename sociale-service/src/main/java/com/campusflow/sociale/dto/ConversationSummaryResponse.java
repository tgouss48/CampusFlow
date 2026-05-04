package com.campusflow.sociale.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ConversationSummaryResponse(
        Long id,
        List<ParticipantResponse> participants,
        MessageResponse lastMessage,
        long unreadCount,
        LocalDateTime updatedAt
) {
}
