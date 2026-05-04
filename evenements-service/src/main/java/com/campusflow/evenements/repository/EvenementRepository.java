package com.campusflow.evenements.repository;

import com.campusflow.evenements.entity.Evenement;
import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;

public interface EvenementRepository extends JpaRepository<Evenement, Long>, JpaSpecificationExecutor<Evenement> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Evenement> findWithLockingById(Long id);
    
    Page<Evenement> findByDateFinGreaterThanEqual(LocalDateTime now, Pageable pageable);

}
