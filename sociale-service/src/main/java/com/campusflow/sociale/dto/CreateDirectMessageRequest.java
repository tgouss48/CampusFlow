package com.campusflow.sociale.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateDirectMessageRequest(
        @NotNull Long participantId,
        String participantDisplayName,
        @NotBlank
        @Size(max = 2000)
        String content
) {
}
