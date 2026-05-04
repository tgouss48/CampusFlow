package com.campusflow.evenements.service;

import com.campusflow.evenements.dto.EvenementNotificationResponse;
import com.campusflow.evenements.entity.Evenement;
import com.campusflow.evenements.entity.EvenementNotification;
import com.campusflow.evenements.entity.EvenementNotificationState;
import com.campusflow.evenements.repository.EvenementNotificationRepository;
import com.campusflow.evenements.repository.EvenementNotificationStateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private EvenementNotificationRepository notificationRepository;

    @Mock
    private EvenementNotificationStateRepository notificationStateRepository;

    @Mock
    private EvenementNotificationWebSocketHandler notificationWebSocketHandler;

    @Mock
    private Clock clock;

    @InjectMocks
    private NotificationService notificationService;

    @BeforeEach
    void setUp() {
        lenient().when(clock.instant()).thenReturn(Instant.parse("2024-01-01T10:00:00Z"));
        lenient().when(clock.getZone()).thenReturn(ZoneId.of("UTC"));
    }

    @Test
    void publierEvenementCree() {
        Evenement evenement = new Evenement();
        evenement.setId(1L);
        evenement.setTitre("New Event");

        EvenementNotification notification = new EvenementNotification();
        notification.setId(10L);

        when(notificationRepository.save(any(EvenementNotification.class))).thenReturn(notification);

        notificationService.publierEvenementCree(evenement);

        verify(notificationWebSocketHandler).broadcastToUsers(any());
    }

    @Test
    void listerNotifications() {
        EvenementNotification notification = new EvenementNotification();
        notification.setId(10L);
        notification.setMessage("New Event");

        when(notificationStateRepository.findByUserIdAndReadTrue(1L)).thenReturn(List.of());
        when(notificationRepository.findAllByOrderByOccurredAtDesc()).thenReturn(List.of(notification));

        List<EvenementNotificationResponse> responses = notificationService.listerNotifications(1L);

        assertEquals(1, responses.size());
    }

    @Test
    void marquerCommeLue() {
        EvenementNotification notification = new EvenementNotification();
        notification.setId(10L);

        when(notificationRepository.findById(10L)).thenReturn(Optional.of(notification));
        when(notificationStateRepository.findByNotificationIdAndUserId(10L, 1L)).thenReturn(Optional.empty());

        notificationService.marquerCommeLue(10L, 1L);

        verify(notificationStateRepository).save(any(EvenementNotificationState.class));
        verify(notificationWebSocketHandler).sendToUser(eq(1L), any());
    }
}
