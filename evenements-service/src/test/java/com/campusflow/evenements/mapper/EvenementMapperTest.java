package com.campusflow.evenements.mapper;

import com.campusflow.evenements.dto.EvenementResponse;
import com.campusflow.evenements.entity.Evenement;
import com.campusflow.evenements.entity.enums.EvenementStatut;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;

class EvenementMapperTest {

    private EvenementMapper mapper;
    private Clock clock;

    @BeforeEach
    void setUp() {
        clock = Clock.fixed(Instant.parse("2026-04-22T10:00:00Z"), ZoneId.of("UTC"));
        mapper = new EvenementMapper(clock);
    }

    @Test
    void toSummaryResponse_A_VENIR() {
        Evenement evenement = new Evenement();
        evenement.setId(1L);
        evenement.setTitre("Titre");
        evenement.setDateDebut(LocalDateTime.of(2026, 4, 23, 10, 0));
        evenement.setDateFin(LocalDateTime.of(2026, 4, 23, 12, 0));
        evenement.setCapaciteMax(100);

        EvenementResponse response = mapper.toSummaryResponse(evenement, 10L, false, Collections.emptyList());

        assertEquals(EvenementStatut.A_VENIR, response.getStatut());
        assertEquals(10L, response.getNombreParticipants());
    }

    @Test
    void calculateTemporalStatus_PASSE() {
        LocalDateTime start = LocalDateTime.of(2026, 4, 21, 10, 0);
        LocalDateTime end = LocalDateTime.of(2026, 4, 21, 12, 0);
        LocalDateTime now = LocalDateTime.now(clock);

        EvenementStatut status = mapper.calculateTemporalStatus(start, end, now);
        assertEquals(EvenementStatut.PASSE, status);
    }
}
