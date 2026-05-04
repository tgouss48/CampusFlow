package com.campusflow.evenements.mapper;

import com.campusflow.evenements.dto.EvenementRequest;
import com.campusflow.evenements.dto.EvenementResponse;
import com.campusflow.evenements.dto.ParticipantPreviewResponse;
import com.campusflow.evenements.dto.ParticipationResponse;
import com.campusflow.evenements.entity.Evenement;
import com.campusflow.evenements.entity.Participation;
import com.campusflow.evenements.entity.enums.EvenementStatut;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class EvenementMapper {
    public static final EvenementStatut STATUS_A_VENIR = EvenementStatut.A_VENIR;
    public static final EvenementStatut STATUS_EN_COURS = EvenementStatut.EN_COURS;
    public static final EvenementStatut STATUS_COMPLET = EvenementStatut.COMPLET;
    public static final EvenementStatut STATUS_PASSE = EvenementStatut.PASSE;

    private final Clock clock;

    public EvenementMapper(Clock clock) {
        this.clock = clock;
    }

    public EvenementResponse toSummaryResponse(
            Evenement evenement,
            long nombreParticipants,
            boolean isParticipating,
            List<ParticipantPreviewResponse> previewParticipants) {
        LocalDateTime now = LocalDateTime.now(clock);
        return EvenementResponse.builder()
                .id(evenement.getId())
                .titre(evenement.getTitre())
                .description(evenement.getDescription())
                .lieu(evenement.getLieu())
                .dateDebut(evenement.getDateDebut())
                .dateFin(evenement.getDateFin())
                .statut(calculateTemporalStatus(
                        evenement.getDateDebut(),
                        evenement.getDateFin(),
                        now,
                        evenement.getCapaciteMax(),
                        nombreParticipants))
                .capaciteMax(evenement.getCapaciteMax())
                .nombreParticipants(nombreParticipants)
                .isParticipating(isParticipating)
                .previewParticipants(previewParticipants == null ? Collections.emptyList() : previewParticipants)
                .build();
    }

    public ParticipantPreviewResponse toParticipantPreviewResponse(Participation participation) {
        return ParticipantPreviewResponse.builder()
                .participantId(participation.getParticipantId())
                .name(participation.getParticipantDisplayName())
                .build();
    }

    public ParticipationResponse toParticipationResponse(Participation participation) {
        return ParticipationResponse.builder()
                .id(participation.getId())
                .participantId(participation.getParticipantId())
                .participantDisplayName(participation.getParticipantDisplayName())
                .createdAt(participation.getCreatedAt())
                .build();
    }

    public void updateEntityFromRequest(Evenement evenement, EvenementRequest request) {
        evenement.setTitre(request.getTitre());
        evenement.setDescription(request.getDescription());
        evenement.setLieu(request.getLieu());
        evenement.setDateDebut(request.getDateDebut());
        evenement.setDateFin(request.getDateFin());
        evenement.setCapaciteMax(request.getCapaciteMax());
    }

    public EvenementStatut calculateTemporalStatus(LocalDateTime dateDebut, LocalDateTime dateFin, LocalDateTime now) {
        return calculateTemporalStatus(dateDebut, dateFin, now, null, 0);
    }

    public EvenementStatut calculateTemporalStatus(
            LocalDateTime dateDebut,
            LocalDateTime dateFin,
            LocalDateTime now,
            Integer capaciteMax,
            long nombreParticipants) {
        if (dateDebut != null && now.isBefore(dateDebut)) {
            if (capaciteMax != null && capaciteMax > 0 && nombreParticipants >= capaciteMax) {
                return STATUS_COMPLET;
            }
            return STATUS_A_VENIR;
        }
        if (dateDebut != null && dateFin != null && (now.isEqual(dateDebut) || now.isAfter(dateDebut))
                && now.isBefore(dateFin)) {
            if (capaciteMax != null && capaciteMax > 0 && nombreParticipants >= capaciteMax) {
                return STATUS_COMPLET;
            }
            return STATUS_EN_COURS;
        }
        if (dateFin != null && (now.isAfter(dateFin) || now.isEqual(dateFin))) {
            return STATUS_PASSE;
        }
        if (capaciteMax != null && capaciteMax > 0 && nombreParticipants >= capaciteMax) {
            return STATUS_COMPLET;
        }
        return STATUS_A_VENIR;
    }
}
