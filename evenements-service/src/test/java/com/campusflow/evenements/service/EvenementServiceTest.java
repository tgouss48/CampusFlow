package com.campusflow.evenements.service;

import com.campusflow.evenements.dto.EvenementRequest;
import com.campusflow.evenements.dto.EvenementResponse;
import com.campusflow.evenements.entity.Evenement;
import com.campusflow.evenements.mapper.EvenementMapper;
import com.campusflow.evenements.repository.EvenementRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class EvenementServiceTest {

    @Mock
    private EvenementRepository evenementRepository;

    @Mock
    private EvenementMapper evenementMapper;

    @Mock
    private NotificationService notificationService;

    @Mock
    private Clock clock;

    @InjectMocks
    private EvenementService evenementService;

    private Evenement evenement;
    private Set<String> adeiRoles;

    @BeforeEach
    void setUp() {
        evenement = new Evenement();
        evenement.setId(1L);

        adeiRoles = Set.of("ROLE_ADEI");

        lenient().when(clock.instant()).thenReturn(Instant.parse("2024-01-01T10:00:00Z"));
        lenient().when(clock.getZone()).thenReturn(ZoneId.of("UTC"));
    }

    @Test
    void creerEvenement() {
        when(evenementRepository.save(any(Evenement.class))).thenReturn(evenement);
        
        EvenementResponse expectedResponse = new EvenementResponse(1L, "Titre", "Desc", "Lieu", LocalDateTime.now(), LocalDateTime.now().plusDays(1), com.campusflow.evenements.entity.enums.EvenementStatut.A_VENIR, 10, 0L, false, java.util.List.of());
        when(evenementMapper.toSummaryResponse(any(), eq(0L), eq(false), anyList())).thenReturn(expectedResponse);

        EvenementRequest request = new EvenementRequest("Titre", "Desc", "Lieu", LocalDateTime.now(), LocalDateTime.now().plusDays(1), 10);
        EvenementResponse response = evenementService.creerEvenement(request, adeiRoles);

        assertNotNull(response);
        verify(notificationService).publierEvenementCree(evenement);
    }

    @Test
    void supprimerEvenement() {
        when(evenementRepository.findById(1L)).thenReturn(Optional.of(evenement));

        evenementService.supprimerEvenement(1L, adeiRoles);

        verify(notificationService).supprimerNotificationsPourEvenement(1L);
        verify(evenementRepository).delete(evenement);
    }
}
