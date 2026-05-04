package com.campusflow.evenements.service;

import com.campusflow.evenements.security.JwtAuthenticatedUser;
import com.campusflow.evenements.security.JwtService;
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
public class EvenementWebSocketHandshakeInterceptor implements HandshakeInterceptor {

    static final String USER_ID_ATTRIBUTE = "evenements.userId";
    static final String USER_ROLES_ATTRIBUTE = "evenements.roles";

    private final JwtService jwtService;

    public EvenementWebSocketHandshakeInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes) {
        MultiValueMap<String, String> queryParams = UriComponentsBuilder.fromUri(request.getURI()).build()
                .getQueryParams();
        String accessToken = queryParams.getFirst("access_token");
        if (accessToken == null || accessToken.isBlank()) {
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }

        try {
            JwtAuthenticatedUser user = jwtService.parseToken(accessToken);
            attributes.put(USER_ID_ATTRIBUTE, user.userId());
            attributes.put(USER_ROLES_ATTRIBUTE, user.roles());
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
