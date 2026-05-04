package com.campusflow.evenements.service;

import com.campusflow.evenements.dto.EvenementNotificationStreamEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EvenementNotificationWebSocketHandlerTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private WebSocketSession session;

    private EvenementNotificationWebSocketHandler handler;

    @BeforeEach
    void setUp() {
        handler = new EvenementNotificationWebSocketHandler(objectMapper);
    }

    @Test
    void afterConnectionEstablished_WithUserId() {
        Map<String, Object> attributes = new HashMap<>();
        attributes.put(EvenementWebSocketHandshakeInterceptor.USER_ID_ATTRIBUTE, 1L);
        when(session.getAttributes()).thenReturn(attributes);

        handler.afterConnectionEstablished(session);

        // Verification: no exception and session registered (can be tested via sendToUser)
        handler.sendToUser(1L, new EvenementNotificationStreamEvent("test", Collections.emptyMap()));
        verify(session, atLeastOnce()).isOpen();
    }

    @Test
    void afterConnectionEstablished_WithoutUserId() throws Exception {
        when(session.getAttributes()).thenReturn(Collections.emptyMap());

        handler.afterConnectionEstablished(session);

        verify(session).close();
    }

    @Test
    void broadcastToUsers() throws Exception {
        Map<String, Object> attributes = new HashMap<>();
        attributes.put(EvenementWebSocketHandshakeInterceptor.USER_ID_ATTRIBUTE, 1L);
        attributes.put(EvenementWebSocketHandshakeInterceptor.USER_ROLES_ATTRIBUTE, Set.of("ROLE_USER"));
        when(session.getAttributes()).thenReturn(attributes);
        when(session.isOpen()).thenReturn(true);

        handler.afterConnectionEstablished(session);
        handler.broadcastToUsers(new EvenementNotificationStreamEvent("test", Collections.emptyMap()));

        verify(session).sendMessage(any(TextMessage.class));
    }
}
