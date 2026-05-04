package com.campusflow.sociale.service;

import com.campusflow.sociale.dto.PresenceResponse;
import com.campusflow.sociale.dto.SocialStreamEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SocialWebSocketHandlerTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private PresenceService presenceService;

    @Mock
    private WebSocketSession session;

    private SocialWebSocketHandler handler;

    @BeforeEach
    void setUp() {
        handler = new SocialWebSocketHandler(objectMapper, presenceService, "social.userId");
    }

    @Test
    void testAfterConnectionEstablished_WithUserId() throws Exception {
        when(session.getAttributes()).thenReturn(Map.of("social.userId", 1L));
        when(session.isOpen()).thenReturn(true);

        handler.afterConnectionEstablished(session);

        verify(presenceService, times(1)).heartbeat(1L);
        ArgumentCaptor<TextMessage> messageCaptor = ArgumentCaptor.forClass(TextMessage.class);
        verify(session, times(1)).sendMessage(messageCaptor.capture());

        String payload = messageCaptor.getValue().getPayload();
        SocialStreamEvent event = objectMapper.readValue(payload, SocialStreamEvent.class);
        assertEquals("stream.connected", event.type());
    }

    @Test
    void testAfterConnectionEstablished_WithoutUserId() throws Exception {
        when(session.getAttributes()).thenReturn(Map.of());

        handler.afterConnectionEstablished(session);

        verify(session, times(1)).close();
        verify(presenceService, never()).heartbeat(anyLong());
    }

    @Test
    void testHandleTextMessage_PresenceHeartbeat() {
        when(session.getAttributes()).thenReturn(Map.of("social.userId", 1L));
        when(session.isOpen()).thenReturn(true);
        handler.afterConnectionEstablished(session);

        when(presenceService.heartbeat(1L)).thenReturn(new PresenceResponse(1L, true, null));

        TextMessage message = new TextMessage("{\"type\":\"presence.heartbeat\"}");
        handler.handleTextMessage(session, message);

        verify(presenceService, times(2)).heartbeat(1L); // 1 for connection, 1 for message
    }

    @Test
    void testAfterConnectionClosed_ShouldGoOffline() {
        when(session.getAttributes()).thenReturn(Map.of("social.userId", 1L));
        handler.afterConnectionEstablished(session); // register session

        handler.afterConnectionClosed(session, CloseStatus.NORMAL);

        verify(presenceService, times(1)).goOffline(1L);
    }

    @Test
    void testSendToUser() throws Exception {
        when(session.getAttributes()).thenReturn(Map.of("social.userId", 1L));
        when(session.isOpen()).thenReturn(true);
        handler.afterConnectionEstablished(session); // register session

        SocialStreamEvent event = new SocialStreamEvent("test.event", "data");
        handler.sendToUser(1L, event);

        verify(session, times(2)).sendMessage(any(TextMessage.class)); // 1 for connection, 1 for sendToUser
    }
}
