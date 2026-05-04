package com.campusflow.annonces.dto;

import com.campusflow.annonces.entity.enums.AnnonceStatut;
import java.time.LocalDateTime;

public record CommentaireResponse(
        Long id,
        String contenu,
        Long ownerId,
        String ownerDisplayName,
        Long annonceId,
        Long parentId,
        long reponseCount,
        AnnonceStatut statut,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
