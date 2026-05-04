package com.campusflow.annonces.mapper;

import com.campusflow.annonces.dto.AnnonceResponse;
import com.campusflow.annonces.dto.CategorieResponse;
import com.campusflow.annonces.entity.Annonce;
import org.springframework.stereotype.Component;

@Component
public class AnnonceMapper {

    public AnnonceResponse toResponse(Annonce annonce, long likeCount, long commentaireCount, boolean liked) {
        return new AnnonceResponse(
                annonce.getId(),
                annonce.getTitre(),
                annonce.getDescription(),
                annonce.getType(),
                annonce.getOwnerId(),
                annonce.getOwnerDisplayName(),
                toCategorieResponse(annonce),
                likeCount,
                commentaireCount,
                liked,
                annonce.getStatut(),
                annonce.getCreatedAt());
    }

    private CategorieResponse toCategorieResponse(Annonce annonce) {
        return new CategorieResponse(
                annonce.getCategorie().name(),
                annonce.getCategorie().getNom());
    }
}
