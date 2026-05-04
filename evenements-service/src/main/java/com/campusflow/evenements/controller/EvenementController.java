package com.campusflow.evenements.controller;

import com.campusflow.evenements.dto.EvenementRequest;
import com.campusflow.evenements.dto.EvenementNotificationResponse;
import com.campusflow.evenements.dto.EvenementResponse;
import com.campusflow.evenements.dto.ParticipationResponse;
import com.campusflow.evenements.dto.ParticipationToggleResponse;
import com.campusflow.evenements.security.CurrentUserProvider;
import com.campusflow.evenements.security.JwtAuthenticatedUser;
import com.campusflow.evenements.service.EvenementService;
import com.campusflow.evenements.service.NotificationService;
import com.campusflow.evenements.service.ParticipationService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/evenements")
public class EvenementController {

    private final EvenementService evenementService;
    private final ParticipationService participationService;
    private final NotificationService notificationService;
    private final CurrentUserProvider currentUserProvider;

    public EvenementController(
            EvenementService evenementService,
            ParticipationService participationService,
            NotificationService notificationService,
            CurrentUserProvider currentUserProvider
    ) {
        this.evenementService = evenementService;
        this.participationService = participationService;
        this.notificationService = notificationService;
        this.currentUserProvider = currentUserProvider;
    }

    @GetMapping
    public ResponseEntity<Page<EvenementResponse>> listerEvenements(
            @PageableDefault(sort = "dateDebut", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        JwtAuthenticatedUser currentUser = currentUserProvider.getRequiredUser();
        return ResponseEntity.ok(evenementService.listerEvenements(currentUser.userId(), pageable));
    }

    @PostMapping
    public ResponseEntity<EvenementResponse> creerEvenement(
            @Valid @RequestBody EvenementRequest request
    ) {
        JwtAuthenticatedUser currentUser = currentUserProvider.getRequiredUser();
        EvenementResponse response = evenementService.creerEvenement(request, currentUser.roles());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EvenementResponse> modifierEvenement(
            @PathVariable("id") Long evenementId,
            @Valid @RequestBody EvenementRequest request
    ) {
        JwtAuthenticatedUser currentUser = currentUserProvider.getRequiredUser();
        return ResponseEntity.ok(
                evenementService.modifierEvenement(evenementId, request, currentUser.roles())
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerEvenement(
            @PathVariable("id") Long evenementId
    ) {
        JwtAuthenticatedUser currentUser = currentUserProvider.getRequiredUser();
        evenementService.supprimerEvenement(evenementId, currentUser.roles());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/participer")
    public ResponseEntity<ParticipationToggleResponse> participerOuSeDesinscrire(@PathVariable("id") Long evenementId) {
        JwtAuthenticatedUser currentUser = currentUserProvider.getRequiredUser();
        ParticipationToggleResponse body =
                participationService.participerOuSeDesinscrire(evenementId, currentUser.userId(), currentUser.roles());
        HttpStatus status = body.inscription() ? HttpStatus.CREATED : HttpStatus.OK;
        return ResponseEntity.status(status).body(body);
    }

    @GetMapping("/{id}/participants")
    public ResponseEntity<List<ParticipationResponse>> recupererParticipants(@PathVariable("id") Long evenementId) {
        return ResponseEntity.ok(evenementService.recupererParticipants(evenementId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EvenementResponse> recupererEvenement(@PathVariable("id") Long evenementId) {
        JwtAuthenticatedUser currentUser = currentUserProvider.getRequiredUser();
        return ResponseEntity.ok(evenementService.recupererEvenement(evenementId, currentUser.userId()));
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<EvenementNotificationResponse>> listerNotifications() {
        JwtAuthenticatedUser currentUser = currentUserProvider.getRequiredUser();
        return ResponseEntity.ok(notificationService.listerNotifications(currentUser.userId()));
    }

    @PatchMapping("/notifications/{id}/read")
    public ResponseEntity<Void> marquerNotificationCommeLue(@PathVariable("id") Long notificationId) {
        JwtAuthenticatedUser currentUser = currentUserProvider.getRequiredUser();
        notificationService.marquerCommeLue(notificationId, currentUser.userId());
        return ResponseEntity.noContent().build();
    }
}
