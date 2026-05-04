package com.campusflow.sociale.service;

import com.campusflow.sociale.dto.SocialStreamEvent;
import org.springframework.stereotype.Service;

@Service
public class SocialStreamService {

    private final SocialWebSocketHandler socialWebSocketHandler;

    public SocialStreamService(SocialWebSocketHandler socialWebSocketHandler) {
        this.socialWebSocketHandler = socialWebSocketHandler;
    }

    public void sendToUser(Long userId, SocialStreamEvent event) {
        socialWebSocketHandler.sendToUser(userId, event);
    }

    public void broadcastToAll(SocialStreamEvent event) {
        socialWebSocketHandler.broadcastToAll(event);
    }
}
