package com.campusflow.annonces.mapper;

import com.campusflow.annonces.dto.CommentaireResponse;
import com.campusflow.annonces.entity.Commentaire;
import org.springframework.stereotype.Component;

@Component
public class CommentaireMapper {

    public CommentaireResponse toResponse(Commentaire commentaire, long reponseCount) {
        return new CommentaireResponse(
                commentaire.getId(),
                commentaire.getContenu(),
                commentaire.getOwnerId(),
                commentaire.getOwnerDisplayName(),
                commentaire.getAnnonce().getId(),
                commentaire.getParent() != null ? commentaire.getParent().getId() : null,
                reponseCount,
                commentaire.getStatut(),
                commentaire.getCreatedAt(),
                commentaire.getUpdatedAt()
        );
    }
}
