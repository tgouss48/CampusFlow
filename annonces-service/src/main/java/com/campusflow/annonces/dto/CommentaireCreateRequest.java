package com.campusflow.annonces.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CommentaireCreateRequest(
        @NotBlank
        @Size(max = 1000)
        String contenu,

        @NotNull
        Long annonceId,

        Long parentId
) {
}
