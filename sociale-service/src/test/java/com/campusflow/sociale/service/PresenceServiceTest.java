package com.campusflow.sociale.service;

import com.campusflow.sociale.dto.PresenceResponse;
import com.campusflow.sociale.dto.SocialStreamEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PresenceServiceTest {

    @Mock
    private SocialStreamService socialStreamService;

    private PresenceService presenceService;
    private final Duration timeout = Duration.ofSeconds(30);

    @BeforeEach
    void setUp() {
        presenceService = new PresenceService(timeout, socialStreamService);
    }

    @Test
    void testHeartbeat_WhenUserWasOffline_ShouldBroadcastPresence() {
        Long userId = 1L;

        PresenceResponse response = presenceService.heartbeat(userId);

        assertTrue(response.online());
        assertEquals(userId, response.userId());
        assertNotNull(response.lastSeenAt());

        verify(socialStreamService, times(1)).broadcastToAll(any(SocialStreamEvent.class));
    }

    @Test
    void testHeartbeat_WhenUserWasOnline_ShouldNotBroadcastPresence() {
        Long userId = 1L;
        presenceService.heartbeat(userId); // first heartbeat broadcasts
        reset(socialStreamService);

        PresenceResponse response = presenceService.heartbeat(userId); // second should not

        assertTrue(response.online());
        verify(socialStreamService, never()).broadcastToAll(any(SocialStreamEvent.class));
    }

    @Test
    void testGoOffline() {
        Long userId = 1L;
        presenceService.heartbeat(userId);
        reset(socialStreamService);

        PresenceResponse response = presenceService.goOffline(userId);

        assertFalse(response.online());
        assertEquals(userId, response.userId());
        
        ArgumentCaptor<SocialStreamEvent> eventCaptor = ArgumentCaptor.forClass(SocialStreamEvent.class);
        verify(socialStreamService, times(1)).broadcastToAll(eventCaptor.capture());
        assertEquals("presence.updated", eventCaptor.getValue().type());
    }

    @Test
    void testGetPresence_WhenOnline() {
        Long userId = 1L;
        presenceService.heartbeat(userId);

        PresenceResponse response = presenceService.getPresence(userId);

        assertTrue(response.online());
    }

    @Test
    void testGetPresence_WhenOffline() {
        Long userId = 1L;
        PresenceResponse response = presenceService.getPresence(userId);
        assertFalse(response.online());
    }

    @Test
    void testGetPresences() {
        presenceService.heartbeat(1L);

        List<PresenceResponse> presences = presenceService.getPresences(List.of(1L, 2L));

        assertEquals(2, presences.size());
        assertTrue(presences.stream().filter(p -> p.userId().equals(1L)).findFirst().orElseThrow().online());
        assertFalse(presences.stream().filter(p -> p.userId().equals(2L)).findFirst().orElseThrow().online());
    }

    @Test
    void testIsOnline() {
        Long userId = 1L;
        assertFalse(presenceService.isOnline(userId));

        presenceService.heartbeat(userId);
        assertTrue(presenceService.isOnline(userId));
    }

    @Test
    void testCleanupExpiredPresence() throws InterruptedException {
        // We set up the service with a very short timeout for testing
        PresenceService shortTimeoutService = new PresenceService(Duration.ofMillis(10), socialStreamService);
        
        Long userId = 1L;
        shortTimeoutService.heartbeat(userId);
        assertTrue(shortTimeoutService.isOnline(userId));
        
        Thread.sleep(20); // wait for expiration
        
        assertFalse(shortTimeoutService.isOnline(userId));
        
        shortTimeoutService.cleanupExpiredPresence();
        
        assertFalse(shortTimeoutService.isOnline(userId));
    }
}
