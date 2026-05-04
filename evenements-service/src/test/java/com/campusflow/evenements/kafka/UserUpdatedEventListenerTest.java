package com.campusflow.evenements.kafka;

import com.campusflow.evenements.dto.UserUpdatedEvent;
import com.campusflow.evenements.entity.Participation;
import com.campusflow.evenements.repository.ParticipationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserUpdatedEventListenerTest {

    @Mock
    private ParticipationRepository participationRepository;

    @InjectMocks
    private UserUpdatedEventListener listener;

    @Test
    void handleUserUpdatedEvent() {
        UserUpdatedEvent event = new UserUpdatedEvent(1L, "New Name");
        Participation participation = new Participation();
        participation.setParticipantId(1L);
        participation.setParticipantDisplayName("Old Name");

        when(participationRepository.findByParticipantId(1L)).thenReturn(List.of(participation));

        listener.handleUserUpdatedEvent(event);

        verify(participationRepository).saveAll(anyList());
    }
}
