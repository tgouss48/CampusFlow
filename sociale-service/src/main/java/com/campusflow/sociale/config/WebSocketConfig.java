package com.campusflow.sociale.config;

import com.campusflow.sociale.service.SocialWebSocketHandshakeInterceptor;
import com.campusflow.sociale.service.SocialWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final SocialWebSocketHandler socialWebSocketHandler;
    private final SocialWebSocketHandshakeInterceptor socialWebSocketHandshakeInterceptor;

    public WebSocketConfig(
            SocialWebSocketHandler socialWebSocketHandler,
            SocialWebSocketHandshakeInterceptor socialWebSocketHandshakeInterceptor
    ) {
        this.socialWebSocketHandler = socialWebSocketHandler;
        this.socialWebSocketHandshakeInterceptor = socialWebSocketHandshakeInterceptor;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(socialWebSocketHandler, "/api/sociale/ws")
                .addInterceptors(socialWebSocketHandshakeInterceptor)
                .setAllowedOriginPatterns("*");
    }
}
