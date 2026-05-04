package com.campusflow.annonces.repository;

import com.campusflow.annonces.entity.AnnonceLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface AnnonceLikeRepository extends JpaRepository<AnnonceLike, Long> {

    boolean existsByAnnonceIdAndOwnerId(Long annonceId, Long ownerId);

    long countByAnnonceId(Long annonceId);

    void deleteByAnnonceIdAndOwnerId(Long annonceId, Long ownerId);

    void deleteByAnnonceId(Long annonceId);

    List<AnnonceLike> findByOwnerIdAndAnnonceIdIn(Long ownerId, Collection<Long> annonceIds);

    List<AnnonceLike> findByAnnonceIdIn(Collection<Long> annonceIds);
}
