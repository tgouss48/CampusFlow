package com.campusflow.evenements.service;

import com.campusflow.evenements.dto.ParticipationToggleResponse;
import com.campusflow.evenements.entity.Evenement;
import com.campusflow.evenements.entity.Participation;
import com.campusflow.evenements.mapper.EvenementMapper;
import com.campusflow.evenements.repository.EvenementRepository;
import com.campusflow.evenements.repository.ParticipationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class ParticipationServiceTest {

    @Mock
    private ParticipationRepository participationRepository;

    @Mock
    private EvenementRepository evenementRepository;

    @Mock
    private EvenementMapper evenementMapper;

    @Mock
    private Clock clock;

    private ParticipationService participationService;

    @BeforeEach
    void setUp() {
        participationService = new ParticipationService(participationRepository, evenementRepository, evenementMapper,
                clock, true);

        lenient().when(clock.instant()).thenReturn(Instant.parse("2024-01-01T10:00:00Z"));
        lenient().when(clock.getZone()).thenReturn(ZoneId.of("UTC"));
    }

    @Test
    void participerOuSeDesinscrire_Inscription() {
        Evenement evenement = new Evenement();
        evenement.setId(1L);
        evenement.setCapaciteMax(100);

        when(participationRepository.findByEvenement_IdAndParticipantId(1L, 10L)).thenReturn(Optional.empty());
        when(evenementRepository.findWithLockingById(1L)).thenReturn(Optional.of(evenement));
        when(evenementMapper.calculateTemporalStatus(any(), any(), any()))
                .thenReturn(com.campusflow.evenements.entity.enums.EvenementStatut.A_VENIR);
        when(participationRepository.countByEvenement_Id(1L)).thenReturn(5L).thenReturn(6L);

        ParticipationToggleResponse response = participationService.participerOuSeDesinscrire(1L, 10L, Set.of("USER"));

        assertTrue(response.participating());
        verify(participationRepository).save(any(Participation.class));
    }
}
