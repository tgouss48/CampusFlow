package com.campusflow.annonces.service;

import com.campusflow.annonces.dto.LikeToggleResponse;
import com.campusflow.annonces.entity.Annonce;
import com.campusflow.annonces.entity.AnnonceLike;
import com.campusflow.annonces.exception.ResourceNotFoundException;
import com.campusflow.annonces.repository.AnnonceLikeRepository;
import com.campusflow.annonces.repository.AnnonceRepository;
import com.campusflow.annonces.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AnnonceLikeService {

    private final AnnonceLikeRepository annonceLikeRepository;
    private final AnnonceRepository annonceRepository;
    private final CurrentUserService currentUserService;

    @Transactional
    public LikeToggleResponse toggleLike(Long annonceId) {
        Long currentUserId = currentUserService.getCurrentUserId();
        Annonce annonce = getManagedAnnonce(annonceId);

        if (annonce.getStatut() == com.campusflow.annonces.entity.enums.AnnonceStatut.SUPPRIME) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.FORBIDDEN, "Impossible de liker une annonce supprimée");
        }

        if (annonceLikeRepository.existsByAnnonceIdAndOwnerId(annonce.getId(), currentUserId)) {
            annonceLikeRepository.deleteByAnnonceIdAndOwnerId(annonce.getId(), currentUserId);
            return new LikeToggleResponse(false, annonceLikeRepository.countByAnnonceId(annonce.getId()));
        }

        AnnonceLike annonceLike = AnnonceLike.builder()
                .annonce(annonce)
                .ownerId(currentUserId)
                .build();

        annonceLikeRepository.save(annonceLike);
        return new LikeToggleResponse(true, annonceLikeRepository.countByAnnonceId(annonce.getId()));
    }



    private Annonce getManagedAnnonce(Long annonceId) {
        return annonceRepository.findById(annonceId)
                .orElseThrow(() -> new ResourceNotFoundException("Annonce non trouvée avec l'id " + annonceId));
    }
}
