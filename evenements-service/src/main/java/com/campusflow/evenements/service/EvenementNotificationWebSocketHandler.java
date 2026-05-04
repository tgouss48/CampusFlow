package com.campusflow.evenements.service;

import com.campusflow.evenements.dto.EvenementNotificationStreamEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class EvenementNotificationWebSocketHandler extends TextWebSocketHandler {

    private static final Set<String> USER_ROLES = Set.of("USER", "ROLE_USER");

    private final ObjectMapper objectMapper;
    private final Map<Long, List<WebSocketSession>> sessionsByUserId = new ConcurrentHashMap<>();

    public EvenementNotificationWebSocketHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        Long userId = getUserId(session);
        if (userId == null) {
            closeQuietly(session);
            return;
        }

        sessionsByUserId.computeIfAbsent(userId, ignored -> new CopyOnWriteArrayList<>()).add(session);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        removeSession(session);
        closeQuietly(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        removeSession(session);
    }

    public void sendToUser(Long userId, EvenementNotificationStreamEvent event) {
        List<WebSocketSession> sessions = sessionsByUserId.get(userId);
        if (sessions == null || sessions.isEmpty()) {
            return;
        }

        sessions.forEach(session -> sendToSession(session, event));
    }

    public void broadcastToUsers(EvenementNotificationStreamEvent event) {
        sessionsByUserId.values().stream()
                .flatMap(List::stream)
                .filter(this::isUserSession)
                .forEach(session -> sendToSession(session, event));
    }

    private void sendToSession(WebSocketSession session, EvenementNotificationStreamEvent event) {
        if (!session.isOpen()) {
            removeSession(session);
            return;
        }

        try {
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(event)));
        } catch (IOException ex) {
            removeSession(session);
            closeQuietly(session);
        }
    }

    private boolean isUserSession(WebSocketSession session) {
        Object rawRoles = session.getAttributes().get(EvenementWebSocketHandshakeInterceptor.USER_ROLES_ATTRIBUTE);
        if (!(rawRoles instanceof Set<?> roles)) {
            return false;
        }

        return roles.stream()
                .map(String::valueOf)
                .anyMatch(USER_ROLES::contains);
    }

    private void removeSession(WebSocketSession session) {
        Long userId = getUserId(session);
        if (userId == null) {
            return;
        }

        List<WebSocketSession> sessions = sessionsByUserId.get(userId);
        if (sessions == null) {
            return;
        }

        sessions.remove(session);
        if (sessions.isEmpty()) {
            sessionsByUserId.remove(userId);
        }
    }

    private Long getUserId(WebSocketSession session) {
        Object rawUserId = session.getAttributes().get(EvenementWebSocketHandshakeInterceptor.USER_ID_ATTRIBUTE);
        if (rawUserId instanceof Long userId) {
            return userId;
        }
        if (rawUserId instanceof Number number) {
            return number.longValue();
        }
        return null;
    }

    private void closeQuietly(WebSocketSession session) {
        try {
            session.close();
        } catch (IOException ignored) {
        }
    }
}
