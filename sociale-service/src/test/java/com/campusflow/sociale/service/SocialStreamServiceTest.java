package com.campusflow.sociale.service;

import com.campusflow.sociale.dto.SocialStreamEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class SocialStreamServiceTest {

    @Mock
    private SocialWebSocketHandler socialWebSocketHandler;

    private SocialStreamService socialStreamService;

    @BeforeEach
    void setUp() {
        socialStreamService = new SocialStreamService(socialWebSocketHandler);
    }

    @Test
    void testSendToUser() {
        Long userId = 1L;
        SocialStreamEvent event = new SocialStreamEvent("test.event", Map.of("key", "value"));

        socialStreamService.sendToUser(userId, event);

        verify(socialWebSocketHandler, times(1)).sendToUser(userId, event);
    }
}
