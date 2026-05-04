package com.campusflow.evenements.service;

import com.campusflow.evenements.dto.EvenementNotificationResponse;
import com.campusflow.evenements.dto.EvenementNotificationStreamEvent;
import com.campusflow.evenements.entity.Evenement;
import com.campusflow.evenements.entity.EvenementNotification;
import com.campusflow.evenements.entity.EvenementNotificationState;
import com.campusflow.evenements.repository.EvenementNotificationRepository;
import com.campusflow.evenements.repository.EvenementNotificationStateRepository;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class NotificationService {

    private final EvenementNotificationRepository notificationRepository;
    private final EvenementNotificationStateRepository notificationStateRepository;
    private final EvenementNotificationWebSocketHandler notificationWebSocketHandler;
    private final Clock clock;

    public NotificationService(
            EvenementNotificationRepository notificationRepository,
            EvenementNotificationStateRepository notificationStateRepository,
            EvenementNotificationWebSocketHandler notificationWebSocketHandler,
            Clock clock) {
        this.notificationRepository = notificationRepository;
        this.notificationStateRepository = notificationStateRepository;
        this.notificationWebSocketHandler = notificationWebSocketHandler;
        this.clock = clock;
    }

    public void publierEvenementCree(Evenement evenement) {
        sauvegarder(evenement.getId(), "Nouvel événement : \"" + evenement.getTitre() + "\"");
    }

    public void publierEvenementModifie(Evenement evenement, String message) {
        sauvegarder(evenement.getId(), "L'événement \"" + message + "\" a été mis à jour.");
    }

    public void publierEvenementSupprime(Long evenementId, String titre) {
        sauvegarder(evenementId, "L'événement \"" + titre + "\" a été annulé.");
    }

    public List<EvenementNotificationResponse> listerNotifications(Long userId) {
        List<EvenementNotification> notifications = findUnreadNotifications(userId);
        Map<Long, EvenementNotificationState> statesByNotificationId = findStatesByUser(userId,
                extractIds(notifications));

        return notifications
                .stream()
                .map(notification -> toResponse(
                        notification,
                        statesByNotificationId.get(notification.getId())))
                .toList();
    }

    public void marquerCommeLue(Long notificationId, Long userId) {
        notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Notification introuvable"));

        EvenementNotificationState state = notificationStateRepository
                .findByNotificationIdAndUserId(notificationId, userId)
                .orElse(EvenementNotificationState.builder()
                        .notificationId(notificationId)
                        .userId(userId)
                        .build());

        if (!state.isRead()) {
            state.setRead(true);
            state.setReadAt(LocalDateTime.now(clock));
            notificationStateRepository.save(state);
            notificationWebSocketHandler.sendToUser(
                    userId,
                    new EvenementNotificationStreamEvent(
                            "notification.read",
                            Map.of(
                                    "id", notificationId,
                                    "read", true,
                                    "readAt", state.getReadAt())));
        }
    }

    public void supprimerNotificationsPourEvenement(Long evenementId) {
        List<EvenementNotification> notifications = notificationRepository.findByEvenementId(evenementId);
        if (notifications.isEmpty()) {
            return;
        }

        List<Long> notificationIds = notifications.stream()
                .map(EvenementNotification::getId)
                .toList();

        // Informer les clients que les notifications doivent être retirées
        for (Long id : notificationIds) {
            notificationWebSocketHandler.broadcastToUsers(
                    new EvenementNotificationStreamEvent("notification.deleted", Map.of("id", id)));
        }

        notificationStateRepository.deleteByNotificationIdIn(notificationIds);
        notificationRepository.deleteByEvenementId(evenementId);
    }

    private void sauvegarder(Long evenementId, String message) {
        LocalDateTime now = LocalDateTime.now(clock);
        EvenementNotification notification = notificationRepository.save(EvenementNotification.builder()
                .message(message)
                .evenementId(evenementId)
                .occurredAt(now)
                .build());

        notificationWebSocketHandler.broadcastToUsers(
                new EvenementNotificationStreamEvent("notification.created", toResponse(notification, null)));
    }

    private List<EvenementNotification> findUnreadNotifications(Long userId) {
        if (userId == null) {
            return notificationRepository.findAllByOrderByOccurredAtDesc();
        }

        List<Long> readNotificationIds = notificationStateRepository.findByUserIdAndReadTrue(userId)
                .stream()
                .map(EvenementNotificationState::getNotificationId)
                .toList();
        if (readNotificationIds.isEmpty()) {
            return notificationRepository.findAllByOrderByOccurredAtDesc();
        }

        return notificationRepository.findByIdNotInOrderByOccurredAtDesc(readNotificationIds);
    }

    private Map<Long, EvenementNotificationState> findStatesByUser(Long userId, Collection<Long> notificationIds) {
        if (userId == null || notificationIds.isEmpty()) {
            return Map.of();
        }

        return notificationStateRepository.findByUserIdAndNotificationIdIn(userId, notificationIds)
                .stream()
                .collect(Collectors.toMap(EvenementNotificationState::getNotificationId, Function.identity()));
    }

    private Set<Long> extractIds(List<EvenementNotification> notifications) {
        return notifications.stream()
                .map(EvenementNotification::getId)
                .collect(Collectors.toSet());
    }

    private EvenementNotificationResponse toResponse(EvenementNotification notification,
            EvenementNotificationState state) {
        return EvenementNotificationResponse.builder()
                .id(notification.getId())
                .message(notification.getMessage())
                .evenementId(notification.getEvenementId())
                .read(state != null && state.isRead())
                .readAt(state != null ? state.getReadAt() : null)
                .occurredAt(notification.getOccurredAt())
                .build();
    }
}
