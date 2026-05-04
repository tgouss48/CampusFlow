package com.campusflow.evenements.kafka;

import com.campusflow.evenements.dto.UserUpdatedEvent;
import com.campusflow.evenements.repository.ParticipationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.campusflow.evenements.entity.Participation;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserUpdatedEventListener {

    private final ParticipationRepository participationRepository;

    @Transactional
    @KafkaListener(topics = "${app.kafka.topics.user-profile-updates}", groupId = "${spring.application.name}-group")
    public void handleUserUpdatedEvent(UserUpdatedEvent event) {
        log.info("Réception de UserUpdatedEvent pour l'utilisateur ID: {}", event.userId());

        List<Participation> participations = participationRepository.findByParticipantId(event.userId());
        participations.forEach(p -> p.setParticipantDisplayName(event.newDisplayName()));
        participationRepository.saveAll(participations);

        log.info("Mise à jour réussie du nom d'affichage du participant pour l'utilisateur ID: {}", event.userId());
    }
}
