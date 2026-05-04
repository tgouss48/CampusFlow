package com.campusflow.sociale.service;

import com.campusflow.sociale.security.JwtAuthenticatedUser;
import com.campusflow.sociale.security.JwtService;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.socket.WebSocketHandler;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SocialWebSocketHandshakeInterceptorTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private ServerHttpRequest request;

    @Mock
    private ServerHttpResponse response;

    @Mock
    private WebSocketHandler wsHandler;

    private SocialWebSocketHandshakeInterceptor interceptor;

    @BeforeEach
    void setUp() {
        interceptor = new SocialWebSocketHandshakeInterceptor(jwtService, "social.userId", "access_token");
    }

    @Test
    void testBeforeHandshake_WithValidToken() throws Exception {
        when(request.getURI()).thenReturn(new URI("ws://localhost/ws?access_token=valid.token.here"));
        JwtAuthenticatedUser user = new JwtAuthenticatedUser(1L, java.util.Set.of("ROLE_USER"), "User", "Test");
        when(jwtService.parseToken("valid.token.here")).thenReturn(user);

        Map<String, Object> attributes = new HashMap<>();

        boolean result = interceptor.beforeHandshake(request, response, wsHandler, attributes);

        assertTrue(result);
        assertEquals(1L, attributes.get("social.userId"));
    }

    @Test
    void testBeforeHandshake_WithMissingToken() throws Exception {
        when(request.getURI()).thenReturn(new URI("ws://localhost/ws"));

        Map<String, Object> attributes = new HashMap<>();

        boolean result = interceptor.beforeHandshake(request, response, wsHandler, attributes);

        assertFalse(result);
        verify(response).setStatusCode(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void testBeforeHandshake_WithInvalidToken() throws Exception {
        when(request.getURI()).thenReturn(new URI("ws://localhost/ws?access_token=invalid.token.here"));
        when(jwtService.parseToken("invalid.token.here")).thenThrow(new JwtException("Invalid token"));

        Map<String, Object> attributes = new HashMap<>();

        boolean result = interceptor.beforeHandshake(request, response, wsHandler, attributes);

        assertFalse(result);
        verify(response).setStatusCode(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void testAfterHandshake() {
        // Just verify it doesn't throw any exceptions
        interceptor.afterHandshake(request, response, wsHandler, null);
    }
}
