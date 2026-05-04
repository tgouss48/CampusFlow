package com.campusflow.sociale.service;

import com.campusflow.sociale.dto.PresenceResponse;
import com.campusflow.sociale.dto.SocialStreamEvent;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class SocialWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;
    private final PresenceService presenceService;
    private final String userIdAttribute;
    private final Map<Long, List<WebSocketSession>> sessionsByUserId = new ConcurrentHashMap<>();

    public SocialWebSocketHandler(
            ObjectMapper objectMapper,
            @Lazy PresenceService presenceService,
            @org.springframework.beans.factory.annotation.Value("${app.websocket.user-id-attribute}") String userIdAttribute) {
        this.objectMapper = objectMapper;
        this.presenceService = presenceService;
        this.userIdAttribute = userIdAttribute;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        Long userId = getUserId(session);
        if (userId == null) {
            closeQuietly(session);
            return;
        }

        sessionsByUserId.computeIfAbsent(userId, ignored -> new CopyOnWriteArrayList<>()).add(session);
        sendToSession(session, new SocialStreamEvent("stream.connected", Map.of("connected", true)));

        // Marquer l'utilisateur comme en ligne dès la connexion WebSocket
        presenceService.heartbeat(userId);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        Long userId = getUserId(session);
        if (userId == null) {
            return;
        }

        try {
            JsonNode node = objectMapper.readTree(message.getPayload());
            String type = node.has("type") ? node.get("type").asText() : "";

            switch (type) {
                case "presence.heartbeat" -> {
                    PresenceResponse response = presenceService.heartbeat(userId);
                    sendToSession(session, new SocialStreamEvent("presence.self", response));
                }
                case "presence.offline" -> {
                    PresenceResponse response = presenceService.goOffline(userId);
                    sendToSession(session, new SocialStreamEvent("presence.self", response));
                }
                case "presence.snapshot" -> {
                    JsonNode userIdsNode = node.get("userIds");
                    if (userIdsNode != null && userIdsNode.isArray()) {
                        List<Long> userIds = new java.util.ArrayList<>();
                        userIdsNode.forEach(id -> userIds.add(id.asLong()));
                        List<PresenceResponse> presences = presenceService.getPresences(userIds);
                        sendToSession(session, new SocialStreamEvent("presence.snapshot", presences));
                    }
                }
                default -> {
                    // Type de message inconnu — on ignore
                }
            }
        } catch (IOException ignored) {
            // Message malformé — on ignore
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        removeSession(session);
        closeQuietly(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Long userId = getUserId(session);
        removeSession(session);

        // Si c'était la dernière session de l'utilisateur, le passer hors ligne
        if (userId != null) {
            List<WebSocketSession> remaining = sessionsByUserId.get(userId);
            if (remaining == null || remaining.isEmpty()) {
                presenceService.goOffline(userId);
            }
        }
    }

    public void sendToUser(Long userId, SocialStreamEvent event) {
        List<WebSocketSession> sessions = sessionsByUserId.get(userId);
        if (sessions == null || sessions.isEmpty()) {
            return;
        }

        sessions.forEach(session -> sendToSession(session, event));
    }

    public void broadcastToAll(SocialStreamEvent event) {
        sessionsByUserId.values().forEach(sessions -> sessions.forEach(session -> sendToSession(session, event)));
    }

    private void sendToSession(WebSocketSession session, SocialStreamEvent event) {
        if (session == null || !session.isOpen()) {
            removeSession(session);
            return;
        }

        // Synchroniser sur la session pour éviter les accès concurrents (IllegalStateException)
        // car les sessions WebSocket JSR-356 ne supportent pas les envois simultanés.
        synchronized (session) {
            try {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(event)));
            } catch (IOException ex) {
                removeSession(session);
                closeQuietly(session);
            }
        }
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
        Object rawUserId = session.getAttributes().get(userIdAttribute);
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
