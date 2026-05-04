package com.campusflow.evenements.service;

import com.campusflow.evenements.dto.ParticipationResponse;
import com.campusflow.evenements.dto.ParticipationToggleResponse;
import com.campusflow.evenements.dto.ParticipantPreviewResponse;
import com.campusflow.evenements.entity.Evenement;
import com.campusflow.evenements.entity.Participation;
import com.campusflow.evenements.entity.enums.EvenementStatut;
import com.campusflow.evenements.exception.ResourceNotFoundException;
import com.campusflow.evenements.mapper.EvenementMapper;
import java.time.Clock;
import com.campusflow.evenements.repository.EvenementRepository;
import com.campusflow.evenements.repository.ParticipationRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.FORBIDDEN;

@Service
public class ParticipationService {
    private static final String ROLE_ADEI = "ROLE_ADEI";
    private static final String ROLE_ADEI_ALT = "ADEI";

    private final ParticipationRepository participationRepository;
    private final EvenementRepository evenementRepository;
    private final EvenementMapper evenementMapper;
    private final Clock clock;

    private final boolean inscriptionOngoingEnabled;

    public ParticipationService(
            ParticipationRepository participationRepository,
            EvenementRepository evenementRepository,
            EvenementMapper evenementMapper,
            Clock clock,
            @Value("${evenements.inscription-ongoing-enabled}") boolean inscriptionOngoingEnabled) {
        this.participationRepository = participationRepository;
        this.evenementRepository = evenementRepository;
        this.evenementMapper = evenementMapper;
        this.clock = clock;
        this.inscriptionOngoingEnabled = inscriptionOngoingEnabled;
    }

    public List<ParticipationResponse> getParticipantsForEvenement(Long evenementId) {
        return participationRepository.findByEvenement_Id(evenementId)
                .stream()
                .map(evenementMapper::toParticipationResponse)
                .toList();
    }

    public List<ParticipantPreviewResponse> getParticipantPreviewsForEvenement(Long evenementId) {
        return participationRepository.findTop3ByEvenement_IdOrderByCreatedAtAsc(evenementId)
                .stream()
                .map(evenementMapper::toParticipantPreviewResponse)
                .toList();
    }

    public long countParticipants(Long evenementId) {
        return participationRepository.countByEvenement_Id(evenementId);
    }

    public boolean isParticipating(Long evenementId, Long participantId) {
        if (participantId == null) {
            return false;
        }
        return participationRepository.existsByEvenement_IdAndParticipantId(evenementId, participantId);
    }

    /**
     * Inscription si l'utilisateur ne participe pas encore, sinon desinscription
     * (suppression de la ligne).
     */
    @Transactional
    public ParticipationToggleResponse participerOuSeDesinscrire(Long evenementId, Long participantId,
            Set<String> userRoles) {
        ensureCannotParticipateAsAdei(userRoles);

        Optional<Participation> existante = participationRepository.findByEvenement_IdAndParticipantId(evenementId,
                participantId);
        if (existante.isPresent()) {
            participationRepository.delete(existante.get());
            participationRepository.flush();
            long count = participationRepository.countByEvenement_Id(evenementId);
            return new ParticipationToggleResponse(false, count, false);
        }

        Evenement evenement = evenementRepository.findWithLockingById(evenementId)
                .orElseThrow(() -> new ResourceNotFoundException("Evenement introuvable: " + evenementId));

        validerEligibiliteInscription(evenement);

        long countAvant = participationRepository.countByEvenement_Id(evenementId);
        if (countAvant >= evenement.getCapaciteMax()) {
            throw new IllegalArgumentException("Capacite maximale atteinte pour cet evenement");
        }

        Participation participation = Participation.builder()
                .participantId(participantId)
                .participantDisplayName(currentUserDisplayName(participantId))
                .evenement(evenement)
                .build();
        participationRepository.save(participation);
        participationRepository.flush();

        long countApres = participationRepository.countByEvenement_Id(evenementId);
        return new ParticipationToggleResponse(true, countApres, true);
    }

    private void validerEligibiliteInscription(Evenement evenement) {
        LocalDateTime now = LocalDateTime.now(clock);
        EvenementStatut temporal = evenementMapper.calculateTemporalStatus(evenement.getDateDebut(),
                evenement.getDateFin(), now);
        if (EvenementMapper.STATUS_PASSE.equals(temporal)) {
            throw new IllegalArgumentException("Inscription impossible : l'evenement est termine");
        }
        if (EvenementMapper.STATUS_EN_COURS.equals(temporal) && !inscriptionOngoingEnabled) {
            throw new IllegalArgumentException(
                    "Inscription impossible : l'evenement est deja en cours (inscription a mi-parcours desactivee)");
        }
    }

    private void ensureCannotParticipateAsAdei(Set<String> userRoles) {
        if (userRoles == null || userRoles.isEmpty()) {
            return;
        }

        if (userRoles.contains(ROLE_ADEI) || userRoles.contains(ROLE_ADEI_ALT)) {
            throw new ResponseStatusException(FORBIDDEN, "Le role ADEI ne peut pas participer aux evenements");
        }
    }

    private String currentUserDisplayName(Long participantId) {
        Object principal = org.springframework.security.core.context.SecurityContextHolder.getContext()
                .getAuthentication() == null
                        ? null
                        : org.springframework.security.core.context.SecurityContextHolder.getContext()
                                .getAuthentication().getPrincipal();

        if (principal instanceof com.campusflow.evenements.security.JwtAuthenticatedUser jwtUser) {
            String displayName = jwtUser.displayName();
            if (displayName != null && !displayName.isBlank()) {
                return displayName;
            }
        }

        return "Participant #" + participantId;
    }
}
