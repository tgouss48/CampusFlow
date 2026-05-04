package com.campusflow.annonces.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CommentaireUpdateRequest(
        @NotBlank
        @Size(max = 1000)
        String contenu
) {
}
