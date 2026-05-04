package com.campusflow.evenements.service;

import com.campusflow.evenements.dto.EvenementRequest;
import com.campusflow.evenements.dto.EvenementResponse;
import com.campusflow.evenements.dto.ParticipantPreviewResponse;
import com.campusflow.evenements.dto.ParticipationResponse;
import com.campusflow.evenements.entity.Evenement;
import com.campusflow.evenements.exception.ResourceNotFoundException;
import com.campusflow.evenements.mapper.EvenementMapper;
import com.campusflow.evenements.repository.EvenementRepository;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.FORBIDDEN;

@Service
public class EvenementService {

    private static final String ROLE_ADEI = "ROLE_ADEI";
    private static final String ROLE_ADEI_ALT = "ADEI";

    private final EvenementRepository evenementRepository;
    private final ParticipationService participationService;
    private final EvenementMapper evenementMapper;
    private final NotificationService notificationService;
    private final Clock clock;

    public EvenementService(
            EvenementRepository evenementRepository,
            ParticipationService participationService,
            EvenementMapper evenementMapper,
            NotificationService notificationService,
            Clock clock) {
        this.evenementRepository = evenementRepository;
        this.participationService = participationService;
        this.evenementMapper = evenementMapper;
        this.notificationService = notificationService;
        this.clock = clock;
    }

    @Transactional
    public EvenementResponse creerEvenement(EvenementRequest request, Set<String> userRoles) {
        ensureCanManageEvents(userRoles);
        validateDates(request);

        Evenement evenement = Evenement.builder()
                .titre(request.getTitre())
                .description(request.getDescription())
                .lieu(request.getLieu())
                .dateDebut(request.getDateDebut())
                .dateFin(request.getDateFin())
                .capaciteMax(request.getCapaciteMax())
                .build();

        Evenement saved = evenementRepository.save(evenement);
        notificationService.publierEvenementCree(saved);
        return evenementMapper.toSummaryResponse(saved, 0, false, List.of());
    }

    @Transactional(readOnly = true)
    public Page<EvenementResponse> listerEvenements(Long currentUserId, Pageable pageable) {
        LocalDateTime now = LocalDateTime.now(clock);
        return evenementRepository.findByDateFinGreaterThanEqual(now, pageable)
                .map(evenement -> {
                    long nombreParticipants = participationService.countParticipants(evenement.getId());
                    boolean isParticipating = currentUserId != null
                            && participationService.isParticipating(evenement.getId(), currentUserId);
                    List<ParticipantPreviewResponse> previewParticipants = participationService
                            .getParticipantPreviewsForEvenement(evenement.getId());
                    return evenementMapper.toSummaryResponse(
                            evenement,
                            nombreParticipants,
                            isParticipating,
                            previewParticipants);
                });
    }

    @Transactional
    public EvenementResponse modifierEvenement(Long evenementId, EvenementRequest request, Set<String> userRoles) {
        ensureCanManageEvents(userRoles);
        validateDates(request);
        Evenement evenement = getEvenementById(evenementId);
        String ancienTitre = evenement.getTitre();

        long participants = participationService.countParticipants(evenementId);
        if (request.getCapaciteMax() < participants) {
            throw new IllegalArgumentException(
                    "La capacite max ne peut pas etre inferieure au nombre actuel de participants (" + participants
                            + ")");
        }

        evenementMapper.updateEntityFromRequest(evenement, request);

        Evenement updated = evenementRepository.save(evenement);
        notificationService.supprimerNotificationsPourEvenement(evenementId);
        notificationService.publierEvenementModifie(updated, ancienTitre);
        List<ParticipantPreviewResponse> previewParticipants = participationService
                .getParticipantPreviewsForEvenement(evenementId);
        return evenementMapper.toSummaryResponse(updated, participants, false, previewParticipants);
    }

    @Transactional
    public void supprimerEvenement(Long evenementId, Set<String> userRoles) {
        ensureCanManageEvents(userRoles);
        Evenement evenement = getEvenementById(evenementId);
        String titre = evenement.getTitre();
        notificationService.supprimerNotificationsPourEvenement(evenementId);
        notificationService.publierEvenementSupprime(evenementId, titre);
        evenementRepository.delete(evenement);
    }

    @Transactional(readOnly = true)
    public List<ParticipationResponse> recupererParticipants(Long evenementId) {
        if (!evenementRepository.existsById(evenementId)) {
            throw new ResourceNotFoundException("Evenement introuvable: " + evenementId);
        }
        return participationService.getParticipantsForEvenement(evenementId);
    }

    @Transactional(readOnly = true)
    public EvenementResponse recupererEvenement(Long evenementId, Long currentUserId) {
        Evenement evenement = getEvenementById(evenementId);
        long nombreParticipants = participationService.countParticipants(evenementId);
        boolean isParticipating = currentUserId != null
                && participationService.isParticipating(evenementId, currentUserId);
        List<ParticipantPreviewResponse> previewParticipants = participationService
                .getParticipantPreviewsForEvenement(evenementId);
        return evenementMapper.toSummaryResponse(evenement, nombreParticipants, isParticipating, previewParticipants);
    }

    private Evenement getEvenementById(Long evenementId) {
        return evenementRepository.findById(evenementId)
                .orElseThrow(() -> new ResourceNotFoundException("Evenement introuvable: " + evenementId));
    }

    private void validateDates(EvenementRequest request) {
        if (request.getDateDebut() != null
                && request.getDateFin() != null
                && (request.getDateFin().isBefore(request.getDateDebut())
                        || request.getDateFin().isEqual(request.getDateDebut()))) {
            throw new IllegalArgumentException("La date de fin doit etre apres la date de debut");
        }
    }

    private void ensureCanManageEvents(Set<String> userRoles) {
        if (!isAdei(userRoles)) {
            throw new ResponseStatusException(FORBIDDEN, "Seul le role ADEI peut gerer les evenements");
        }
    }

    private boolean isAdei(Set<String> userRoles) {
        if (userRoles == null || userRoles.isEmpty()) {
            return false;
        }
        return userRoles.contains(ROLE_ADEI) || userRoles.contains(ROLE_ADEI_ALT);
    }
}
