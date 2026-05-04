package com.campusflow.annonces.dto;

import com.campusflow.annonces.entity.enums.AnnonceStatut;
import com.campusflow.annonces.entity.enums.AnnonceType;

import java.time.LocalDateTime;

public record AnnonceResponse(
                Long id,
                String titre,
                String description,
                AnnonceType type,
                Long ownerId,
                String ownerDisplayName,
                CategorieResponse categorie,
                long likeCount,
                long commentaireCount,
                boolean liked,
                AnnonceStatut statut,
                LocalDateTime createdAt) {
}
