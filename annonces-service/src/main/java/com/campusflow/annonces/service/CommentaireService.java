package com.campusflow.annonces.service;

import com.campusflow.annonces.dto.CommentaireCreateRequest;
import com.campusflow.annonces.dto.CommentaireResponse;
import com.campusflow.annonces.dto.CommentaireUpdateRequest;
import com.campusflow.annonces.entity.Annonce;
import com.campusflow.annonces.entity.enums.AnnonceStatut;
import com.campusflow.annonces.entity.Commentaire;
import com.campusflow.annonces.exception.ForbiddenOperationException;
import com.campusflow.annonces.exception.InvalidOperationException;
import com.campusflow.annonces.exception.ResourceNotFoundException;
import com.campusflow.annonces.mapper.CommentaireMapper;
import com.campusflow.annonces.repository.AnnonceRepository;
import com.campusflow.annonces.repository.CommentaireRepository;
import com.campusflow.annonces.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentaireService {

    private final AnnonceRepository annonceRepository;
    private final CommentaireRepository commentaireRepository;
    private final CommentaireMapper commentaireMapper;
    private final CurrentUserService currentUserService;

    @Transactional
    public CommentaireResponse addCommentaire(CommentaireCreateRequest request) {
        Long currentUserId = currentUserService.getCurrentUserId();
        Annonce annonce = getAnnonceById(request.annonceId());
        
        if (annonce.getStatut() == AnnonceStatut.SUPPRIME) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.FORBIDDEN, "Impossible de commenter une annonce supprimée");
        }

        Commentaire parent = resolveParent(request.parentId(), annonce.getId());

        Commentaire commentaire = Commentaire.builder()
                .contenu(request.contenu().trim())
                .ownerId(currentUserId)
                .ownerDisplayName(currentUserService.getCurrentUserDisplayName())
                .annonce(annonce)
                .parent(parent)
                .build();

        Commentaire savedCommentaire = commentaireRepository.save(commentaire);
        return commentaireMapper.toResponse(savedCommentaire, 0L);
    }

    @Transactional(readOnly = true)
    public Page<CommentaireResponse> listCommentaires(Long annonceId, Pageable pageable) {
        getAnnonceById(annonceId);
        Page<Commentaire> page;
        if (currentUserService.isCurrentUserAdei()) {
            page = commentaireRepository.findByAnnonceIdAndParentIsNull(annonceId, pageable);
        } else {
            page = commentaireRepository.findByAnnonceIdAndParentIsNullAndStatut(annonceId, AnnonceStatut.ACTIF, pageable);
        }

        return page.map(commentaire -> commentaireMapper.toResponse(
                commentaire,
                currentUserService.isCurrentUserAdei()
                        ? commentaireRepository.countByParentId(commentaire.getId())
                        : commentaireRepository.countByParentIdAndStatut(commentaire.getId(), AnnonceStatut.ACTIF)));
    }

    @Transactional(readOnly = true)
    public Page<CommentaireResponse> listReponses(Long parentId, Pageable pageable) {
        Commentaire parent = getCommentaireById(parentId);
        assertPrincipalCommentaire(parent);

        Page<Commentaire> page;
        if (currentUserService.isCurrentUserAdei()) {
            page = commentaireRepository.findByParentId(parentId, pageable);
        } else {
            page = commentaireRepository.findByParentIdAndStatut(parentId, AnnonceStatut.ACTIF, pageable);
        }

        return page.map(commentaire -> commentaireMapper.toResponse(
                commentaire,
                currentUserService.isCurrentUserAdei()
                        ? commentaireRepository.countByParentId(commentaire.getId())
                        : commentaireRepository.countByParentIdAndStatut(commentaire.getId(), AnnonceStatut.ACTIF)));
    }

    @Transactional
    public void deleteCommentaire(Long commentaireId) {
        Commentaire commentaire = getCommentaireById(commentaireId);
        ensureCurrentUserCanDeleteCommentaire(commentaire);

        if (currentUserService.isCurrentUserAdei()) {
            // Physical delete for ADEI
            commentaireRepository.delete(commentaire);
        } else {
            // Soft delete for author (recursive for replies)
            softDeleteRecursively(commentaire);
        }
    }

    private void softDeleteRecursively(Commentaire parent) {
        parent.setStatut(AnnonceStatut.SUPPRIME);
        commentaireRepository.save(parent);
        
        List<Commentaire> children = commentaireRepository.findByParentId(parent.getId());
        for (Commentaire child : children) {
            softDeleteRecursively(child);
        }
    }

    @Transactional
    public CommentaireResponse updateCommentaire(Long commentaireId, CommentaireUpdateRequest request) {
        Long currentUserId = currentUserService.getCurrentUserId();
        Commentaire commentaire = getCommentaireById(commentaireId);
        assertOwner(commentaire, currentUserId);
        return saveUpdatedContent(commentaire, request.contenu());
    }

    private CommentaireResponse saveUpdatedContent(Commentaire commentaire, String contenu) {
        commentaire.setContenu(contenu.trim());
        Commentaire saved = commentaireRepository.save(commentaire);
        return commentaireMapper.toResponse(saved, commentaireRepository.countByParentId(saved.getId()));
    }

    private static void assertOwner(Commentaire commentaire, Long ownerId) {
        if (!commentaire.getOwnerId().equals(ownerId)) {
            throw new ForbiddenOperationException("Seul l'auteur peut modifier ce commentaire");
        }
    }

    private void ensureCurrentUserCanDeleteCommentaire(Commentaire commentaire) {
        Long currentUserId = currentUserService.getCurrentUserId();
        if (commentaire.getOwnerId().equals(currentUserId) || currentUserService.isCurrentUserAdei()) {
            return;
        }
        throw new ForbiddenOperationException("Seul l'auteur ou ADEI peut supprimer ce commentaire");
    }

    private Commentaire resolveParent(Long parentId, Long annonceId) {
        if (parentId == null) {
            return null;
        }

        Commentaire parent = getCommentaireById(parentId);

        if (!parent.getAnnonce().getId().equals(annonceId)) {
            throw new InvalidOperationException("Le commentaire parent n'appartient pas à l'annonce");
        }

        assertPrincipalCommentaire(parent);
        return parent;
    }

    private static void assertPrincipalCommentaire(Commentaire commentaire) {
        if (commentaire.getParent() != null) {
            throw new InvalidOperationException("Il est interdit de repondre a une reponse");
        }
    }

    private Commentaire getCommentaireById(Long commentaireId) {
        return commentaireRepository.findById(commentaireId)
                .orElseThrow(() -> new ResourceNotFoundException("Commentaire non trouvé avec l'id " + commentaireId));
    }

    private Annonce getAnnonceById(Long annonceId) {
        return annonceRepository.findById(annonceId)
                .orElseThrow(() -> new ResourceNotFoundException("Annonce non trouvée avec l'id " + annonceId));
    }
}
