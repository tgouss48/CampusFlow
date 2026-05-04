package com.campusflow.sociale.service;

import com.campusflow.sociale.dto.PresenceResponse;
import com.campusflow.sociale.dto.SocialStreamEvent;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class PresenceService {

    private final Map<Long, Instant> heartbeatByUserId = new ConcurrentHashMap<>();
    private final Duration timeout;
    private final SocialStreamService socialStreamService;

    public PresenceService(
            @Value("${sociale.presence.timeout}") Duration timeout,
            SocialStreamService socialStreamService
    ) {
        this.timeout = timeout;
        this.socialStreamService = socialStreamService;
    }

    public PresenceResponse heartbeat(Long userId) {
        boolean wasOnline = isOnline(userId);
        Instant now = Instant.now();
        heartbeatByUserId.put(userId, now);
        PresenceResponse presence = toPresence(userId, now);
        if (!wasOnline) {
            broadcastPresence(presence);
        }
        return presence;
    }

    public PresenceResponse goOffline(Long userId) {
        Instant lastSeen = heartbeatByUserId.remove(userId);
        PresenceResponse presence = toPresence(userId, lastSeen != null ? lastSeen : Instant.now());
        broadcastPresence(new PresenceResponse(userId, false, presence.lastSeenAt()));
        return new PresenceResponse(userId, false, presence.lastSeenAt());
    }

    public PresenceResponse getPresence(Long userId) {
        Instant lastSeen = heartbeatByUserId.get(userId);
        return toPresence(userId, lastSeen);
    }

    public List<PresenceResponse> getPresences(List<Long> userIds) {
        return userIds.stream()
                .distinct()
                .map(this::getPresence)
                .toList();
    }

    public boolean isOnline(Long userId) {
        Instant lastSeen = heartbeatByUserId.get(userId);
        return lastSeen != null && lastSeen.plus(timeout).isAfter(Instant.now());
    }

    @Scheduled(fixedDelay = 10000L)
    public void cleanupExpiredPresence() {
        Instant now = Instant.now();
        heartbeatByUserId.forEach((userId, lastSeen) -> {
            if (lastSeen.plus(timeout).isAfter(now)) {
                return;
            }
            if (heartbeatByUserId.remove(userId, lastSeen)) {
                broadcastPresence(toPresence(userId, lastSeen));
            }
        });
    }

    private void broadcastPresence(PresenceResponse presence) {
        socialStreamService.broadcastToAll(new SocialStreamEvent("presence.updated", presence));
    }

    private PresenceResponse toPresence(Long userId, Instant lastSeen) {
        LocalDateTime lastSeenAt = lastSeen == null ? null : LocalDateTime.ofInstant(lastSeen, ZoneOffset.UTC);
        boolean online = lastSeen != null && lastSeen.plus(timeout).isAfter(Instant.now());
        return new PresenceResponse(userId, online, lastSeenAt);
    }
}
