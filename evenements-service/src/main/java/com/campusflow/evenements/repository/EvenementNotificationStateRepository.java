package com.campusflow.evenements.repository;

import com.campusflow.evenements.entity.EvenementNotificationState;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EvenementNotificationStateRepository extends JpaRepository<EvenementNotificationState, Long> {

    List<EvenementNotificationState> findByUserIdAndNotificationIdIn(Long userId, Collection<Long> notificationIds);

    Optional<EvenementNotificationState> findByNotificationIdAndUserId(Long notificationId, Long userId);

    List<EvenementNotificationState> findByUserIdAndReadTrue(Long userId);

    void deleteByNotificationIdIn(Collection<Long> notificationIds);
}
