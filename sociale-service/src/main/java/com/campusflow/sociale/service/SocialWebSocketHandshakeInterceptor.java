package com.campusflow.sociale.service;

import com.campusflow.sociale.security.JwtAuthenticatedUser;
import com.campusflow.sociale.security.JwtService;
import io.jsonwebtoken.JwtException;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.MultiValueMap;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class SocialWebSocketHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtService jwtService;
    private final String userIdAttribute;
    private final String tokenParam;

    public SocialWebSocketHandshakeInterceptor(
            JwtService jwtService,
            @org.springframework.beans.factory.annotation.Value("${app.websocket.user-id-attribute}") String userIdAttribute,
            @org.springframework.beans.factory.annotation.Value("${app.websocket.token-param}") String tokenParam) {
        this.jwtService = jwtService;
        this.userIdAttribute = userIdAttribute;
        this.tokenParam = tokenParam;
    }

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes) {
        MultiValueMap<String, String> queryParams = UriComponentsBuilder.fromUri(request.getURI()).build()
                .getQueryParams();
        String accessToken = queryParams.getFirst(tokenParam);
        if (accessToken == null || accessToken.isBlank()) {
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }

        try {
            JwtAuthenticatedUser user = jwtService.parseToken(accessToken);
            attributes.put(userIdAttribute, user.userId());
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception) {
        // Nothing to do after the handshake.
    }
}
