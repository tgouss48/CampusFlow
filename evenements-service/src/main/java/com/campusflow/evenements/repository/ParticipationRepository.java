package com.campusflow.evenements.repository;

import com.campusflow.evenements.entity.Participation;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ParticipationRepository extends JpaRepository<Participation, Long> {

    boolean existsByEvenement_IdAndParticipantId(Long evenementId, Long participantId);

    Optional<Participation> findByEvenement_IdAndParticipantId(Long evenementId, Long participantId);
    long countByEvenement_Id(Long evenementId);
    List<Participation> findByEvenement_Id(Long evenementId);
    List<Participation> findTop3ByEvenement_IdOrderByCreatedAtAsc(Long evenementId);
    List<Participation> findByParticipantId(Long participantId);
}
