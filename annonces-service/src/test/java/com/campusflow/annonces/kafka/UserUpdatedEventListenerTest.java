package com.campusflow.annonces.kafka;

import com.campusflow.annonces.dto.UserUpdatedEvent;
import com.campusflow.annonces.entity.Annonce;
import com.campusflow.annonces.repository.AnnonceRepository;
import com.campusflow.annonces.repository.CommentaireRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserUpdatedEventListenerTest {

    @Mock
    private AnnonceRepository annonceRepository;
    @Mock
    private CommentaireRepository commentaireRepository;

    @InjectMocks
    private UserUpdatedEventListener listener;

    @Test
    void handleUserUpdatedEvent() {
        UserUpdatedEvent event = new UserUpdatedEvent(1L, "New Name");
        Annonce annonce = new Annonce();
        annonce.setOwnerId(1L);
        annonce.setOwnerDisplayName("Old Name");

        when(annonceRepository.findByOwnerId(1L)).thenReturn(List.of(annonce));
        when(commentaireRepository.findByOwnerId(1L)).thenReturn(Collections.emptyList());

        listener.handleUserUpdatedEvent(event);

        verify(annonceRepository).saveAll(anyList());
        verify(commentaireRepository).saveAll(anyList());
    }
}
