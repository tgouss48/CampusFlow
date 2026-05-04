package com.campusflow.annonces.repository;

import com.campusflow.annonces.entity.Commentaire;
import com.campusflow.annonces.entity.enums.AnnonceStatut;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface CommentaireRepository extends JpaRepository<Commentaire, Long> {

    List<Commentaire> findByOwnerId(Long ownerId);

    List<Commentaire> findByAnnonceId(Long annonceId);

    Page<Commentaire> findByAnnonceIdAndParentIsNull(Long annonceId, Pageable pageable);

    Page<Commentaire> findByAnnonceIdAndParentIsNullAndStatut(Long annonceId, AnnonceStatut statut, Pageable pageable);

    Page<Commentaire> findByParentId(Long parentId, Pageable pageable);
    List<Commentaire> findByParentId(Long parentId);

    Page<Commentaire> findByParentIdAndStatut(Long parentId, AnnonceStatut statut, Pageable pageable);

    long countByAnnonceId(Long annonceId);

    long countByParentId(Long parentId);

    long countByParentIdAndStatut(Long parentId, AnnonceStatut statut);

    List<Commentaire> findByAnnonceIdIn(Collection<Long> annonceIds);
}
