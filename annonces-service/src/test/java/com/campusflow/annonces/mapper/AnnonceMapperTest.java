package com.campusflow.annonces.mapper;

import com.campusflow.annonces.dto.AnnonceResponse;
import com.campusflow.annonces.entity.Annonce;
import com.campusflow.annonces.entity.enums.AnnonceType;
import com.campusflow.annonces.entity.enums.CategorieAnnonce;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AnnonceMapperTest {

    private final AnnonceMapper mapper = new AnnonceMapper();

    @Test
    void toResponse() {
        Annonce annonce = new Annonce();
        annonce.setId(1L);
        annonce.setTitre("Titre");
        annonce.setDescription("Desc");
        annonce.setType(AnnonceType.OFFRE);
        annonce.setCategorie(CategorieAnnonce.DIVERS);
        annonce.setOwnerId(10L);
        annonce.setOwnerDisplayName("Owner");
        annonce.setCreatedAt(LocalDateTime.now());

        AnnonceResponse response = mapper.toResponse(annonce, 5L, 3L, true);

        assertEquals(1L, response.id());
        assertEquals("Titre", response.titre());
        assertEquals(5L, response.likeCount());
        assertEquals(3L, response.commentaireCount());
        assertTrue(response.liked());
        assertEquals("DIVERS", response.categorie().code());
    }
}
