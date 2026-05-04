package com.campusflow.evenements.service;

import com.campusflow.evenements.security.JwtAuthenticatedUser;
import com.campusflow.evenements.security.JwtService;
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
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EvenementWebSocketHandshakeInterceptorTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private ServerHttpRequest request;

    @Mock
    private ServerHttpResponse response;

    @Mock
    private WebSocketHandler wsHandler;

    private EvenementWebSocketHandshakeInterceptor interceptor;

    @BeforeEach
    void setUp() {
        interceptor = new EvenementWebSocketHandshakeInterceptor(jwtService);
    }

    @Test
    void beforeHandshake_Success() throws Exception {
        when(request.getURI()).thenReturn(new URI("ws://localhost?access_token=token"));
        JwtAuthenticatedUser user = new JwtAuthenticatedUser(1L, Set.of("ROLE_USER"), "First", "Last");
        when(jwtService.parseToken("token")).thenReturn(user);

        Map<String, Object> attributes = new HashMap<>();
        boolean result = interceptor.beforeHandshake(request, response, wsHandler, attributes);

        assertTrue(result);
        assertEquals(1L, attributes.get(EvenementWebSocketHandshakeInterceptor.USER_ID_ATTRIBUTE));
        assertEquals(user.roles(), attributes.get(EvenementWebSocketHandshakeInterceptor.USER_ROLES_ATTRIBUTE));
    }

    @Test
    void beforeHandshake_NoToken() throws Exception {
        when(request.getURI()).thenReturn(new URI("ws://localhost"));

        Map<String, Object> attributes = new HashMap<>();
        boolean result = interceptor.beforeHandshake(request, response, wsHandler, attributes);

        assertFalse(result);
        verify(response).setStatusCode(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void beforeHandshake_InvalidToken() throws Exception {
        when(request.getURI()).thenReturn(new URI("ws://localhost?access_token=invalid"));
        when(jwtService.parseToken("invalid")).thenThrow(new JwtException("invalid"));

        Map<String, Object> attributes = new HashMap<>();
        boolean result = interceptor.beforeHandshake(request, response, wsHandler, attributes);

        assertFalse(result);
        verify(response).setStatusCode(HttpStatus.UNAUTHORIZED);
    }
}
