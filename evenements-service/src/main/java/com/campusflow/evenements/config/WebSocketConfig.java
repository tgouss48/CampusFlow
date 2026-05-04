package com.campusflow.evenements.config;

import com.campusflow.evenements.service.EvenementNotificationWebSocketHandler;
import com.campusflow.evenements.service.EvenementWebSocketHandshakeInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final EvenementNotificationWebSocketHandler notificationWebSocketHandler;
    private final EvenementWebSocketHandshakeInterceptor webSocketHandshakeInterceptor;

    public WebSocketConfig(
            EvenementNotificationWebSocketHandler notificationWebSocketHandler,
            EvenementWebSocketHandshakeInterceptor webSocketHandshakeInterceptor
    ) {
        this.notificationWebSocketHandler = notificationWebSocketHandler;
        this.webSocketHandshakeInterceptor = webSocketHandshakeInterceptor;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(notificationWebSocketHandler, "/api/evenements/notifications/stream")
                .addInterceptors(webSocketHandshakeInterceptor)
                .setAllowedOriginPatterns("*");
    }
}
