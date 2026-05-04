package com.campusflow.evenements.repository;

import com.campusflow.evenements.entity.EvenementNotification;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EvenementNotificationRepository extends JpaRepository<EvenementNotification, Long> {

    List<EvenementNotification> findAllByOrderByOccurredAtDesc();

    List<EvenementNotification> findByIdNotInOrderByOccurredAtDesc(Collection<Long> ids);

    List<EvenementNotification> findByEvenementId(Long evenementId);

    void deleteByEvenementId(Long evenementId);
}
