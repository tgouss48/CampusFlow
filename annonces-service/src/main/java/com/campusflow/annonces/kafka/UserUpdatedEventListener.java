package com.campusflow.annonces.kafka;

import com.campusflow.annonces.dto.UserUpdatedEvent;
import com.campusflow.annonces.repository.AnnonceRepository;
import com.campusflow.annonces.repository.CommentaireRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.campusflow.annonces.entity.Annonce;
import com.campusflow.annonces.entity.Commentaire;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserUpdatedEventListener {

    private final AnnonceRepository annonceRepository;
    private final CommentaireRepository commentaireRepository;

    @Transactional
    @KafkaListener(topics = "${app.kafka.topics.user-profile-updates}", groupId = "${spring.application.name}-group")
    public void handleUserUpdatedEvent(UserUpdatedEvent event) {
        log.info("Réception de l'événement UserUpdatedEvent pour l'utilisateur ID : {}", event.userId());

        List<Annonce> annonces = annonceRepository.findByOwnerId(event.userId());
        annonces.forEach(a -> a.setOwnerDisplayName(event.newDisplayName()));
        annonceRepository.saveAll(annonces);

        List<Commentaire> commentaires = commentaireRepository.findByOwnerId(event.userId());
        commentaires.forEach(c -> c.setOwnerDisplayName(event.newDisplayName()));
        commentaireRepository.saveAll(commentaires);

        log.info("Mise à jour réussie du nom d'affichage pour l'utilisateur ID : {}", event.userId());
    }
}
