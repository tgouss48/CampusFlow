package com.campusflow.annonces.repository;

import com.campusflow.annonces.entity.Annonce;
import com.campusflow.annonces.entity.enums.AnnonceStatut;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AnnonceRepository extends JpaRepository<Annonce, Long> {

    List<Annonce> findByOwnerId(Long ownerId);

    Page<Annonce> findByStatut(AnnonceStatut statut, Pageable pageable);
}
