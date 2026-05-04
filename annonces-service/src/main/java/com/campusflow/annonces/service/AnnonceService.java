package com.campusflow.annonces.service;

import com.campusflow.annonces.dto.AnnonceRequest;
import com.campusflow.annonces.dto.AnnonceResponse;
import com.campusflow.annonces.entity.Annonce;
import com.campusflow.annonces.entity.enums.AnnonceStatut;
import com.campusflow.annonces.entity.AnnonceLike;
import com.campusflow.annonces.entity.Commentaire;
import com.campusflow.annonces.exception.ForbiddenOperationException;
import com.campusflow.annonces.exception.ResourceNotFoundException;
import com.campusflow.annonces.mapper.AnnonceMapper;
import com.campusflow.annonces.repository.AnnonceLikeRepository;
import com.campusflow.annonces.repository.AnnonceRepository;
import com.campusflow.annonces.repository.CommentaireRepository;
import com.campusflow.annonces.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnnonceService {

    private final AnnonceRepository annonceRepository;
    private final AnnonceLikeRepository annonceLikeRepository;
    private final CommentaireRepository commentaireRepository;
    private final CurrentUserService currentUserService;
    private final AnnonceMapper annonceMapper;

    @Transactional
    public AnnonceResponse createAnnonce(AnnonceRequest request) {
        Long currentUserId = currentUserService.getCurrentUserId();

        Annonce annonce = Annonce.builder()
                .titre(request.titre().trim())
                .description(request.description().trim())
                .type(request.type())
                .ownerId(currentUserId)
                .ownerDisplayName(currentUserService.getCurrentUserDisplayName())
                .categorie(request.categorie())
                .build();

        Annonce savedAnnonce = annonceRepository.save(annonce);
        return toResponse(savedAnnonce, 0L, 0L, false);
    }

    @Transactional
    public AnnonceResponse updateAnnonce(Long annonceId, AnnonceRequest request) {
        Annonce annonce = getManagedAnnonce(annonceId);
        ensureCurrentUserOwnsAnnonce(annonce);

        annonce.setTitre(request.titre().trim());
        annonce.setDescription(request.description().trim());
        annonce.setType(request.type());
        annonce.setCategorie(request.categorie());

        Annonce updatedAnnonce = annonceRepository.save(annonce);
        return toResponse(
                updatedAnnonce,
                annonceLikeRepository.countByAnnonceId(updatedAnnonce.getId()),
                commentaireRepository.countByAnnonceId(updatedAnnonce.getId()),
                annonceLikeRepository.existsByAnnonceIdAndOwnerId(updatedAnnonce.getId(),
                        currentUserService.getCurrentUserId()));
    }

    @Transactional
    public void deleteAnnonce(Long annonceId) {
        Annonce annonce = getManagedAnnonce(annonceId);
        ensureCurrentUserCanDeleteAnnonce(annonce);

        boolean isAdei = currentUserService.isCurrentUserAdei();

        if (isAdei) {
            // Physical delete for ADEI (always)
            annonceLikeRepository.deleteByAnnonceId(annonceId);
            supprimerCommentairesPourAnnonce(annonceId);
            annonceRepository.delete(annonce);
        } else {
            // Soft delete for regular user
            softDeleteCommentairesPourAnnonce(annonceId);
            annonce.setStatut(AnnonceStatut.SUPPRIME);
            annonceRepository.save(annonce);
        }
    }

    private void softDeleteCommentairesPourAnnonce(Long annonceId) {
        List<Commentaire> commentaires = commentaireRepository.findByAnnonceId(annonceId);
        commentaires.forEach(c -> {
            c.setStatut(AnnonceStatut.SUPPRIME);
            commentaireRepository.save(c);
        });
    }

    /*
     * Supprime les commentaires couchés par couche (feuilles d’abord) pour
     * respecter la FK {@code parent_id},
     * sans requête textuelle — uniquement repository dérivé + logique Java.
     */
    private void supprimerCommentairesPourAnnonce(Long annonceId) {
        while (true) {
            List<Commentaire> tous = commentaireRepository.findByAnnonceId(annonceId);
            if (tous.isEmpty()) {
                return;
            }
            Set<Long> idsReferencesCommeParent = tous.stream()
                    .map(Commentaire::getParent)
                    .filter(Objects::nonNull)
                    .map(Commentaire::getId)
                    .collect(Collectors.toSet());
            List<Commentaire> feuilles = tous.stream()
                    .filter(c -> !idsReferencesCommeParent.contains(c.getId()))
                    .toList();
            if (feuilles.isEmpty()) {
                return;
            }
            commentaireRepository.deleteAll(feuilles);
        }
    }

    @Transactional(readOnly = true)
    public Page<AnnonceResponse> listAnnonces(AnnonceStatut filteredStatut, Pageable pageable) {
        Page<Annonce> page;
        if (currentUserService.isCurrentUserAdei()) {
            if (filteredStatut != null) {
                // ADEI filters by status
                page = annonceRepository.findByStatut(filteredStatut, pageable);
            } else {
                // ADEI sees everything
                page = annonceRepository.findAll(pageable);
            }
        } else {
            // Normal users only see active ones
            page = annonceRepository.findByStatut(AnnonceStatut.ACTIF, pageable);
        }
        return mapSummaryPage(page);
    }

    private Page<AnnonceResponse> mapSummaryPage(Page<Annonce> page) {
        List<Annonce> annonces = page.getContent();
        Set<Long> likedIds = likedAnnonceIdsFor(annonces);
        Map<Long, Long> likeCounts = countLikesByAnnonceIds(annonces);
        Map<Long, Long> commentaireCounts = countCommentairesByAnnonceIds(annonces);
        return page.map(a -> toResponse(
                a,
                likeCounts.getOrDefault(a.getId(), 0L),
                commentaireCounts.getOrDefault(a.getId(), 0L),
                likedIds.contains(a.getId())));
    }

    /*
     * Une seule lecture des likes pour la page courante (optimisation pour éviter
     * N+1)
     */
    private Set<Long> likedAnnonceIdsFor(List<Annonce> annonces) {
        if (annonces.isEmpty()) {
            return Set.of();
        }
        Long userId = currentUserService.getCurrentUserId();
        List<Long> ids = annonces.stream().map(Annonce::getId).toList();
        List<AnnonceLike> likes = annonceLikeRepository.findByOwnerIdAndAnnonceIdIn(userId, ids);
        Set<Long> liked = new HashSet<>();
        for (AnnonceLike like : likes) {
            liked.add(like.getAnnonce().getId());
        }
        return liked;
    }

    private Map<Long, Long> countLikesByAnnonceIds(List<Annonce> annonces) {
        if (annonces.isEmpty()) {
            return Map.of();
        }
        Map<Long, Long> counts = new LinkedHashMap<>();
        for (AnnonceLike like : annonceLikeRepository
                .findByAnnonceIdIn(annonces.stream().map(Annonce::getId).toList())) {
            Long annonceId = like.getAnnonce().getId();
            counts.merge(annonceId, 1L, Long::sum);
        }
        return counts;
    }

    private Map<Long, Long> countCommentairesByAnnonceIds(List<Annonce> annonces) {
        if (annonces.isEmpty()) {
            return Map.of();
        }
        Map<Long, Long> counts = new LinkedHashMap<>();
        for (Commentaire commentaire : commentaireRepository
                .findByAnnonceIdIn(annonces.stream().map(Annonce::getId).toList())) {
            Long annonceId = commentaire.getAnnonce().getId();
            counts.merge(annonceId, 1L, Long::sum);
        }
        return counts;
    }

    private Annonce getManagedAnnonce(Long annonceId) {
        if (annonceId == null) {
            throw new ResourceNotFoundException("Annonce non trouvée avec l'id null");
        }
        return annonceRepository.findById(annonceId)
                .orElseThrow(() -> new ResourceNotFoundException("Annonce non trouvée avec l'id " + annonceId));
    }

    private void ensureCurrentUserOwnsAnnonce(Annonce annonce) {
        Long currentUserId = currentUserService.getCurrentUserId();
        if (!annonce.getOwnerId().equals(currentUserId)) {
            throw new ForbiddenOperationException("Seul le propriétaire de l'annonce peut la modifier");
        }
    }

    private void ensureCurrentUserCanDeleteAnnonce(Annonce annonce) {
        Long currentUserId = currentUserService.getCurrentUserId();
        if (annonce.getOwnerId().equals(currentUserId) || currentUserService.isCurrentUserAdei()) {
            return;
        }
        throw new ForbiddenOperationException("Seul le propriétaire de l'annonce ou ADEI peut la supprimer");
    }

    private AnnonceResponse toResponse(
            Annonce annonce,
            long likeCount,
            long commentaireCount,
            boolean liked) {
        return annonceMapper.toResponse(
                annonce,
                likeCount,
                commentaireCount,
                liked);
    }
}
